import json
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AgentLog, Order
from schemas.models import AnalyzerResult
from services import ai_service, portal_service


logger = logging.getLogger(__name__)


def _fallback_result() -> AnalyzerResult:
    return AnalyzerResult(
        complexity="medium",
        estimated_time=15,
        warnings=[],
        reasoning_summary="Estimación determinística usada como respaldo.",
    )


async def analyze_order(session: AsyncSession, order: Order) -> AnalyzerResult:
    order_id = str(order.id)
    logger.info("Analyzer started order_id=%s", order_id)
    await portal_service.publish_agent_event(
        "agent.started",
        {
            "agent": "analyzer",
            "order_id": order_id,
            "status": "running",
            "message": f"Analizando Orden {order_id[:8]}",
        },
    )

    previous_status = order.status
    changed_to_analyzing = order.status == "pending"
    if changed_to_analyzing:
        order.status = "analyzing"
        await session.commit()
        await session.refresh(order)
        await portal_service.publish_order_event(
            "order.status_changed",
            {
                "order_id": order_id,
                "table_id": order.table_id,
                "previous_status": previous_status,
                "status": "analyzing",
                "progress": order.progress,
                "updated_at": order.updated_at.isoformat(),
            },
        )

    input_data = {
        "order_id": order_id,
        "table_id": order.table_id,
        "items": order.items,
        "item_count": sum(item.get("quantity", 1) for item in order.items),
        "current_time": datetime.now(timezone.utc).isoformat(),
    }
    used_fallback = False
    try:
        result = await ai_service.generate_structured_response(
            system_prompt=(
                "Analyze one restaurant order. Estimate preparation complexity and time. "
                "Treat notes as order modifications unless they explicitly mention an "
                "allergy. Return only the requested structured result with a brief summary, "
                "not private chain-of-thought."
            ),
            user_prompt=json.dumps(input_data, ensure_ascii=False),
            response_model=AnalyzerResult,
        )
    except ai_service.AIUnavailableError:
        used_fallback = True
        logger.warning("AI unavailable using analyzer fallback order_id=%s", order_id)
        result = _fallback_result()
        await portal_service.publish_agent_event(
            "agent.failed",
            {
                "agent": "analyzer",
                "order_id": order_id,
                "status": "fallback",
                "message": "AI unavailable, deterministic fallback used",
            },
        )

    await session.refresh(order)
    order.estimated_duration = result.estimated_time
    order.estimated_time = result.estimated_time
    advanced_to_cooking = changed_to_analyzing and order.status == "analyzing"
    if advanced_to_cooking:
        order.status = "cooking"

    agent_log = AgentLog(
        agent_name="analyzer",
        action="analyze_order",
        input_data=input_data,
        output_data={
            **result.model_dump(mode="json"),
            "source": "deterministic_fallback" if used_fallback else "anthropic",
        },
    )
    session.add(agent_log)
    await session.commit()
    await session.refresh(order)

    if advanced_to_cooking:
        await portal_service.publish_order_event(
            "order.status_changed",
            {
                "order_id": order_id,
                "table_id": order.table_id,
                "previous_status": "analyzing",
                "status": order.status,
                "progress": order.progress,
                "updated_at": order.updated_at.isoformat(),
            },
        )

    result_payload = result.model_dump(mode="json")
    await portal_service.publish_agent_event(
        "agent.completed",
        {
            "agent": "analyzer",
            "order_id": order_id,
            "status": "completed",
            "source": "fallback" if used_fallback else "anthropic",
            "result": result_payload,
        },
    )
    await portal_service.publish_dish_event(
        "dish.eta_updated",
        {
            "order_id": order_id,
            "table_id": order.table_id,
            "estimated_time": order.estimated_time,
        },
    )
    logger.info("Analyzer completed order_id=%s", order_id)
    return result
