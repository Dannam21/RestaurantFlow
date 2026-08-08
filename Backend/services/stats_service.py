from datetime import datetime, timezone

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AgentLog, Message, Order, Table
from schemas.models import StatsResponse


ACTIVE_ORDER_STATUSES = {"pending", "analyzing", "cooking", "ready"}
COMPLETED_ORDER_STATUSES = {"served", "paid"}


async def get_stats(session: AsyncSession) -> StatsResponse:
    start_of_today = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    order_metrics = (
        await session.execute(
            select(
                func.count(Order.id),
                func.count(Order.id).filter(Order.status.in_(ACTIVE_ORDER_STATUSES)),
                func.count(Order.id).filter(
                    Order.status.in_(COMPLETED_ORDER_STATUSES)
                ),
                func.avg(
                    func.extract("epoch", Order.updated_at - Order.created_at) / 60
                ).filter(Order.status.in_(COMPLETED_ORDER_STATUSES)),
                func.avg(func.coalesce(Order.estimated_duration, Order.estimated_time)),
            )
        )
    ).one()

    table_metrics = (
        await session.execute(
            select(
                func.count(Table.id),
                func.sum(case((Table.status != "empty", 1), else_=0)),
                func.sum(case((Table.status == "empty", 1), else_=0)),
            )
        )
    ).one()

    messages_today = await session.scalar(
        select(func.count(Message.id)).where(Message.created_at >= start_of_today)
    )
    alerts_today = await session.scalar(
        select(func.count(AgentLog.id)).where(
            AgentLog.agent_name == "supervisor",
            AgentLog.action == "operational_alert",
            AgentLog.created_at >= start_of_today,
        )
    )

    return StatsResponse(
        total_orders=int(order_metrics[0] or 0),
        active_orders=int(order_metrics[1] or 0),
        completed_orders=int(order_metrics[2] or 0),
        average_order_time_minutes=round(float(order_metrics[3] or 0), 2),
        average_estimated_time_minutes=round(float(order_metrics[4] or 0), 2),
        tables_total=int(table_metrics[0] or 0),
        tables_occupied=int(table_metrics[1] or 0),
        tables_available=int(table_metrics[2] or 0),
        messages_today=int(messages_today or 0),
        alerts_today=int(alerts_today or 0),
        revenue_today=None,
        satisfaction=None,
    )
