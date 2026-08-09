import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.models import AgentLog, Order
from schemas.models import OperationalAlert
from services import portal_service


logger = logging.getLogger(__name__)
MONITORED_STATUSES = {"pending", "cooking", "ready"}


def _detect_alert(order: Order, now: datetime) -> OperationalAlert | None:
    elapsed_minutes = max(
        0.0, (now - order.created_at).total_seconds() / 60
    )

    if order.status == "cooking" and order.estimated_time == 0:
        duration = order.estimated_duration or 0
        overdue = max(0, int(elapsed_minutes - duration))
        return OperationalAlert(
            alert_type="order.delayed",
            order_id=order.id,
            table_id=order.table_id,
            severity="critical" if overdue >= settings.delay_warning_minutes else "warning",
            message=f"La orden {str(order.id)[:8]} excedió su tiempo estimado por {overdue} minutos.",
            detected_at=now,
        )

    if order.status == "ready":
        ready_minutes = max(
            0.0, (now - order.updated_at).total_seconds() / 60
        )
        if ready_minutes >= settings.ready_warning_minutes:
            return OperationalAlert(
                alert_type="dish.waiting_pickup",
                order_id=order.id,
                table_id=order.table_id,
                severity="warning",
                message=f"El plato de la orden {str(order.id)[:8]} espera ser recogido.",
                detected_at=now,
            )

    if (
        order.status == "pending"
        and elapsed_minutes >= settings.delay_warning_minutes
    ):
        return OperationalAlert(
            alert_type="order.waiting_to_start",
            order_id=order.id,
            table_id=order.table_id,
            severity="warning",
            message=f"La orden {str(order.id)[:8]} aún no ha comenzado a cocinarse.",
            detected_at=now,
        )

    return None


async def run_supervisor(session: AsyncSession) -> int:
    now = datetime.now(timezone.utc)
    orders_result = await session.scalars(
        select(Order).where(Order.status.in_(MONITORED_STATUSES))
    )
    orders = list(orders_result.all())
    logger.info("Supervisor cycle started active_orders=%s", len(orders))

    await portal_service.publish_agent_event(
        "agent.started",
        {
            "agent": "supervisor",
            "status": "running",
            "active_orders": len(orders),
        },
    )

    cutoff = now - timedelta(minutes=settings.alert_dedup_minutes)
    logs_result = await session.scalars(
        select(AgentLog).where(
            AgentLog.agent_name == "supervisor",
            AgentLog.action == "operational_alert",
            AgentLog.created_at >= cutoff,
        )
    )
    recent_alerts = {
        (
            log.output_data.get("alert_type"),
            log.output_data.get("order_id"),
        )
        for log in logs_result.all()
        if isinstance(log.output_data, dict)
    }

    alerts: list[OperationalAlert] = []
    for order in orders:
        try:
            alert = _detect_alert(order, now)
            if alert is None:
                continue
            key = (alert.alert_type, str(alert.order_id))
            if key in recent_alerts:
                continue
            alerts.append(alert)
            session.add(
                AgentLog(
                    agent_name="supervisor",
                    action="operational_alert",
                    input_data={
                        "status": order.status,
                        "estimated_time": order.estimated_time,
                        "estimated_duration": order.estimated_duration,
                        "progress": order.progress,
                    },
                    output_data=alert.model_dump(mode="json"),
                )
            )
        except Exception:
            logger.exception("Supervisor failed order_id=%s", order.id)

    if alerts:
        await session.commit()
        for alert in alerts:
            payload = {
                "source": "supervisor",
                **alert.model_dump(mode="json"),
            }
            await portal_service.publish_notification(
                "notification.operational_alert", payload
            )
            logger.warning(
                "Operational alert detected type=%s order_id=%s",
                alert.alert_type,
                alert.order_id,
            )

    await portal_service.publish_agent_event(
        "agent.completed",
        {
            "agent": "supervisor",
            "status": "completed",
            "alerts_created": len(alerts),
        },
    )
    return len(alerts)
