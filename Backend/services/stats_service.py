from datetime import datetime, timezone

from sqlalchemy import String, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AgentLog, MenuItem, Message, Order, OrderDish, Table
from schemas.models import (
    CookingTimeEntry,
    PeakHourEntry,
    SalesByCategoryEntry,
    SalesByHourEntry,
    StatsResponse,
    TopDishEntry,
)


ACTIVE_ORDER_STATUSES = {"pending", "analyzing", "cooking", "ready"}
COMPLETED_ORDER_STATUSES = {"served", "paid"}


def _start_of_today() -> datetime:
    return datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)


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

    sales_metrics = (
        await session.execute(
            select(
                func.coalesce(func.sum(OrderDish.price * OrderDish.quantity), 0),
                func.count(func.distinct(OrderDish.order_id)),
            ).where(
                OrderDish.price.isnot(None),
                OrderDish.created_at >= start_of_today,
            )
        )
    ).one()
    revenue_today = round(float(sales_metrics[0] or 0), 2)
    priced_order_count = int(sales_metrics[1] or 0)
    avg_ticket_today = (
        round(revenue_today / priced_order_count, 2) if priced_order_count else 0.0
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
        revenue_today=revenue_today,
        avg_ticket_today=avg_ticket_today,
        satisfaction=None,
    )


async def get_sales_by_hour(session: AsyncSession) -> list[SalesByHourEntry]:
    start_of_today = _start_of_today()
    rows = (
        await session.execute(
            select(
                func.date_trunc("hour", OrderDish.created_at).label("hour_bucket"),
                func.sum(OrderDish.price * OrderDish.quantity),
            )
            .where(
                OrderDish.price.isnot(None),
                OrderDish.created_at >= start_of_today,
            )
            .group_by("hour_bucket")
            .order_by("hour_bucket")
        )
    ).all()
    return [
        SalesByHourEntry(
            hour=hour_bucket.strftime("%-I %p"),
            sales=round(float(sales or 0), 2),
        )
        for hour_bucket, sales in rows
    ]


async def get_top_dishes(session: AsyncSession, limit: int = 5) -> list[TopDishEntry]:
    rows = (
        await session.execute(
            select(OrderDish.name, func.sum(OrderDish.quantity))
            .group_by(OrderDish.name)
            .order_by(func.sum(OrderDish.quantity).desc())
            .limit(limit)
        )
    ).all()
    return [TopDishEntry(name=name, count=int(count or 0)) for name, count in rows]


async def get_sales_by_category(session: AsyncSession) -> list[SalesByCategoryEntry]:
    rows = (
        await session.execute(
            select(
                MenuItem.category,
                func.sum(OrderDish.price * OrderDish.quantity),
            )
            .join(MenuItem, func.cast(MenuItem.id, String) == OrderDish.product_id)
            .where(OrderDish.price.isnot(None))
            .group_by(MenuItem.category)
            .order_by(func.sum(OrderDish.price * OrderDish.quantity).desc())
        )
    ).all()
    return [
        SalesByCategoryEntry(category=category, amount=round(float(amount or 0), 2))
        for category, amount in rows
    ]


async def get_orders_by_status(session: AsyncSession) -> dict[str, int]:
    rows = (
        await session.execute(select(Order.status, func.count(Order.id)).group_by(Order.status))
    ).all()
    return {status: int(count) for status, count in rows}


async def get_peak_hours(session: AsyncSession) -> list[PeakHourEntry]:
    start_of_today = _start_of_today()
    rows = (
        await session.execute(
            select(
                func.date_trunc("hour", Order.created_at).label("hour_bucket"),
                func.count(Order.id),
            )
            .where(Order.created_at >= start_of_today)
            .group_by("hour_bucket")
            .order_by("hour_bucket")
        )
    ).all()
    return [
        PeakHourEntry(hour=hour_bucket.strftime("%-I %p"), orders=int(orders))
        for hour_bucket, orders in rows
    ]


async def get_cooking_time_by_hour(session: AsyncSession) -> list[CookingTimeEntry]:
    start_of_today = _start_of_today()
    rows = (
        await session.execute(
            select(
                func.date_trunc("hour", Order.created_at).label("hour_bucket"),
                func.avg(
                    func.extract("epoch", Order.updated_at - Order.created_at) / 60
                ),
            )
            .where(
                Order.status.in_(COMPLETED_ORDER_STATUSES),
                Order.created_at >= start_of_today,
            )
            .group_by("hour_bucket")
            .order_by("hour_bucket")
        )
    ).all()
    return [
        CookingTimeEntry(hour=hour_bucket.strftime("%-I %p"), minutes=round(float(minutes or 0), 1))
        for hour_bucket, minutes in rows
    ]
