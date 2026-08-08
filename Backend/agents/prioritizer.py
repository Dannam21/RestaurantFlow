import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AgentLog, Order
from schemas.models import PrioritizerResult, PriorityItem
from services import ai_service, portal_service


logger = logging.getLogger(__name__)
ACTIVE_STATUSES = {"pending", "analyzing", "cooking"}


def _fallback_result(orders: list[dict[str, object]]) -> PrioritizerResult:
    priorities: list[PriorityItem] = []
    for order in orders:
        waiting_minutes = float(order["waiting_minutes"])
        if waiting_minutes > 20:
            priority, score = "critical", min(100, 80 + int(waiting_minutes - 20))
        elif waiting_minutes >= 10:
            priority, score = "high", min(79, 60 + int(waiting_minutes - 10))
        else:
            priority, score = "normal", min(59, 30 + int(waiting_minutes * 3))

        priorities.append(
            PriorityItem(
                order_id=order["order_id"],
                priority=priority,
                score=score,
                reason=f"Prioridad basada en {waiting_minutes:.1f} minutos de espera.",
            )
        )

    priorities.sort(key=lambda item: item.score, reverse=True)
    return PrioritizerResult(priorities=priorities)


def _normalize_result(
    result: PrioritizerResult,
    orders: list[dict[str, object]],
) -> PrioritizerResult:
    fallback = _fallback_result(orders)
    fallback_by_id = {str(item.order_id): item for item in fallback.priorities}
    priorities: list[PriorityItem] = []
    seen: set[str] = set()

    for item in result.priorities:
        order_id = str(item.order_id)
        if order_id in fallback_by_id and order_id not in seen:
            priorities.append(item)
            seen.add(order_id)

    priorities.extend(
        item for order_id, item in fallback_by_id.items() if order_id not in seen
    )
    priorities.sort(key=lambda item: item.score, reverse=True)
    return PrioritizerResult(priorities=priorities)


async def prioritize_orders(session: AsyncSession) -> PrioritizerResult:
    logger.info("Prioritizer started")
    await portal_service.publish_agent_event(
        "agent.started",
        {
            "agent": "prioritizer",
            "status": "running",
            "message": "Priorizador revisando cola",
        },
    )

    statement = (
        select(Order)
        .where(Order.status.in_(ACTIVE_STATUSES))
        .order_by(Order.created_at.asc())
    )
    query_result = await session.scalars(statement)
    active_orders = list(query_result.all())
    now = datetime.now(timezone.utc)
    input_data = [
        {
            "order_id": str(order.id),
            "created_at": order.created_at.isoformat(),
            "estimated_time": order.estimated_time,
            "status": order.status,
            "table_id": order.table_id,
            "item_count": sum(item.get("quantity", 1) for item in order.items),
            "waiting_minutes": max(
                0.0, (now - order.created_at).total_seconds() / 60
            ),
        }
        for order in active_orders
    ]

    used_fallback = False
    try:
        prioritization = await ai_service.generate_structured_response(
            system_prompt=(
                "Recommend priorities for active restaurant orders using only the supplied "
                "facts. Do not invent VIP status or customer information. Return every "
                "recommendation sorted by descending score and give only a brief reason."
            ),
            user_prompt=json.dumps(input_data, ensure_ascii=False),
            response_model=PrioritizerResult,
        )
        prioritization = _normalize_result(prioritization, input_data)
    except ai_service.AIUnavailableError:
        used_fallback = True
        logger.warning("AI unavailable using prioritizer fallback")
        prioritization = _fallback_result(input_data)
        await portal_service.publish_agent_event(
            "agent.failed",
            {
                "agent": "prioritizer",
                "status": "fallback",
                "message": "AI unavailable, deterministic fallback used",
            },
        )

    agent_log = AgentLog(
        agent_name="prioritizer",
        action="prioritize_orders",
        input_data=input_data,
        output_data={
            **prioritization.model_dump(mode="json"),
            "source": "deterministic_fallback" if used_fallback else "anthropic",
        },
    )
    session.add(agent_log)
    await session.commit()

    await portal_service.publish_agent_event(
        "agent.completed",
        {
            "agent": "prioritizer",
            "status": "completed",
            "source": "fallback" if used_fallback else "anthropic",
            "priorities": prioritization.model_dump(mode="json")["priorities"],
        },
    )
    logger.info("Prioritizer completed active_orders=%s", len(active_orders))
    return prioritization
