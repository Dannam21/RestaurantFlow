from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Order, Table
from schemas.models import OrderCreate, OrderStatus


async def create_order(session: AsyncSession, order_data: OrderCreate) -> Order | None:
    table = await session.get(Table, order_data.table_id)
    if table is None:
        return None

    order = Order(
        table_id=order_data.table_id,
        items=[item.model_dump() for item in order_data.items],
        status="pending",
        progress=0,
        estimated_time=None,
    )
    session.add(order)
    await session.flush()

    table.order_id = order.id
    table.status = "cooking"

    await session.commit()
    await session.refresh(order)
    return order


async def get_orders(session: AsyncSession, status: OrderStatus | None = None) -> list[Order]:
    statement = select(Order)
    if status is not None:
        statement = statement.where(Order.status == status)

    statement = statement.order_by(Order.created_at.desc())
    result = await session.scalars(statement)
    return list(result.all())


async def get_order_by_id(session: AsyncSession, order_id: UUID) -> Order | None:
    return await session.get(Order, order_id)


async def update_order_progress(
    session: AsyncSession, order_id: UUID, progress: int
) -> Order | None:
    order = await session.get(Order, order_id)
    if order is None:
        return None

    order.progress = progress
    if progress == 100:
        order.status = "ready"
    elif progress > 0 and order.status == "pending":
        order.status = "cooking"

    await session.commit()
    await session.refresh(order)
    return order


async def update_order_status(
    session: AsyncSession, order_id: UUID, status: OrderStatus
) -> Order | None:
    order = await session.get(Order, order_id)
    if order is None:
        return None

    order.status = status
    if status in {"ready", "served", "paid"}:
        order.progress = 100

    if status == "paid":
        statement = select(Table).where(
            Table.id == order.table_id,
            Table.order_id == order.id,
        )
        table = await session.scalar(statement)
        if table is not None:
            table.status = "empty"
            table.customers = 0
            table.order_id = None

    await session.commit()
    await session.refresh(order)
    return order
