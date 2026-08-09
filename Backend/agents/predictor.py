import logging
import math
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AgentLog, Order
from services import portal_service


logger = logging.getLogger(__name__)
ACTIVE_STATUSES = {"pending", "analyzing", "cooking", "ready"}


FINISHED_STATUSES = {"ready", "served", "paid"}


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


def calculate_progress(order: Order, now: datetime) -> int | None:
    """Simulate real cooking progress from elapsed wall-clock time, so the
    kitchen UI shows a genuinely moving percentage instead of a frozen 0%."""
    if order.status in FINISHED_STATUSES:
        return 100

    duration = order.estimated_duration or order.estimated_time
    if duration is None or duration <= 0:
        return None

    elapsed_minutes = max(0.0, (now - order.created_at).total_seconds() / 60)
    computed = round((elapsed_minutes / duration) * 100)
    # Progress must never move backwards, matching order_service's own rule.
    return max(order.progress, min(100, computed))


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
    newly_ready: list[Order] = []
    changes: list[dict[str, object]] = []
    for order in active_orders:
        try:
            remaining = calculate_remaining_time(order, now)
            new_progress = calculate_progress(order, now)

            time_changed = remaining is not None and remaining != order.estimated_time
            progress_changed = (
                new_progress is not None and new_progress != order.progress
            )
            if not time_changed and not progress_changed:
                continue

            previous_eta = order.estimated_time
            previous_progress = order.progress
            if time_changed:
                order.estimated_time = remaining
            if progress_changed:
                order.progress = new_progress
                if new_progress == 100 and order.status not in FINISHED_STATUSES:
                    order.status = "ready"
                    order.estimated_time = 0
                    newly_ready.append(order)

            updated.append(order)
            changes.append(
                {
                    "order_id": str(order.id),
                    "previous_eta": previous_eta,
                    "estimated_time": order.estimated_time,
                    "previous_progress": previous_progress,
                    "progress": order.progress,
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

        for order in newly_ready:
            ready_payload = {
                "order_id": str(order.id),
                "table_id": order.table_id,
                "status": order.status,
                "progress": order.progress,
                "updated_at": order.updated_at.isoformat(),
            }
            await portal_service.publish_order_event("order.ready", ready_payload)
            await portal_service.publish_dish_ready_notification(
                str(order.id), order.table_id
            )

    await portal_service.publish_agent_event(
        "agent.completed",
        {
            "agent": "predictor",
            "status": "completed",
            "updated_orders": len(updated),
        },
    )
    return len(updated)
