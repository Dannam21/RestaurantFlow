import logging
import math
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AgentLog, Order
from services import portal_service


logger = logging.getLogger(__name__)
ACTIVE_STATUSES = {"pending", "analyzing", "cooking", "ready"}


def calculate_remaining_time(order: Order, now: datetime) -> int | None:
    duration = order.estimated_duration or order.estimated_time
    if duration is None:
        return None
    if order.status == "ready":
        return 0

    elapsed_minutes = max(
        0.0, (now - order.created_at).total_seconds() / 60
    )
    progress_elapsed = duration * min(100, max(0, order.progress)) / 100
    effective_elapsed = max(elapsed_minutes, progress_elapsed)
    return max(0, math.ceil(duration - effective_elapsed))


async def run_predictor(session: AsyncSession) -> int:
    query = (
        select(Order)
        .where(Order.status.in_(ACTIVE_STATUSES))
        .order_by(Order.created_at.asc())
    )
    result = await session.scalars(query)
    active_orders = list(result.all())
    logger.info("Predictor cycle started active_orders=%s", len(active_orders))

    await portal_service.publish_agent_event(
        "agent.started",
        {
            "agent": "predictor",
            "status": "running",
            "active_orders": len(active_orders),
        },
    )

    now = datetime.now(timezone.utc)
    updated: list[Order] = []
    changes: list[dict[str, object]] = []
    for order in active_orders:
        try:
            remaining = calculate_remaining_time(order, now)
            if remaining is None or remaining == order.estimated_time:
                continue

            previous_eta = order.estimated_time
            order.estimated_time = remaining
            updated.append(order)
            changes.append(
                {
                    "order_id": str(order.id),
                    "previous_eta": previous_eta,
                    "estimated_time": remaining,
                }
            )
        except Exception:
            logger.exception("Predictor failed order_id=%s", order.id)

    if updated:
        session.add(
            AgentLog(
                agent_name="predictor",
                action="update_eta",
                input_data={"orders_checked": len(active_orders)},
                output_data={
                    "orders_checked": len(active_orders),
                    "orders_updated": len(updated),
                    "changes": changes,
                },
            )
        )
        await session.commit()

        for order in updated:
            await session.refresh(order)
            await portal_service.publish_dish_event(
                "dish.eta_updated",
                {
                    "order_id": str(order.id),
                    "table_id": order.table_id,
                    "estimated_time": order.estimated_time,
                    "progress": order.progress,
                    "status": order.status,
                    "updated_at": order.updated_at.isoformat(),
                },
            )
            logger.info("Predictor updated order_id=%s", order.id)

    await portal_service.publish_agent_event(
        "agent.completed",
        {
            "agent": "predictor",
            "status": "completed",
            "updated_orders": len(updated),
        },
    )
    return len(updated)
