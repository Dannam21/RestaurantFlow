from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Order, Table
from schemas.models import OrderCreate, OrderStatus
from services import portal_service


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

    await portal_service.publish_order_event(
        "order.created",
        {
            "order_id": str(order.id),
            "table_id": order.table_id,
            "status": order.status,
            "progress": order.progress,
            "items": order.items,
            "created_at": order.created_at.isoformat(),
        },
    )
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

    previous_progress = order.progress
    previous_status = order.status
    order.progress = progress
    if progress == 100:
        order.status = "ready"
    elif progress > 0 and order.status == "pending":
        order.status = "cooking"

    if order.progress == previous_progress and order.status == previous_status:
        return order

    await session.commit()
    await session.refresh(order)

    dish_payload = {
        "order_id": str(order.id),
        "table_id": order.table_id,
        "progress": order.progress,
        "status": order.status,
        "updated_at": order.updated_at.isoformat(),
    }
    await portal_service.publish_dish_event("dish.progress_updated", dish_payload)

    if order.status == "ready" and previous_status != "ready":
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
    return order


async def update_order_status(
    session: AsyncSession, order_id: UUID, status: OrderStatus
) -> Order | None:
    order = await session.get(Order, order_id)
    if order is None:
        return None

    previous_status = order.status
    previous_progress = order.progress
    order.status = status
    if status in {"ready", "served", "paid"}:
        order.progress = 100

    available_table: Table | None = None
    table_became_available = False
    if status == "paid":
        statement = select(Table).where(
            Table.id == order.table_id,
            Table.order_id == order.id,
        )
        table = await session.scalar(statement)
        if table is not None:
            table_became_available = table.status != "empty"
            table.status = "empty"
            table.customers = 0
            table.order_id = None
            available_table = table

    order_changed = (
        order.status != previous_status or order.progress != previous_progress
    )
    if not order_changed and available_table is None:
        return order

    await session.commit()
    await session.refresh(order)

    if order.status != previous_status:
        status_payload = {
            "order_id": str(order.id),
            "table_id": order.table_id,
            "previous_status": previous_status,
            "status": order.status,
            "progress": order.progress,
            "updated_at": order.updated_at.isoformat(),
        }
        await portal_service.publish_order_event(
            "order.status_changed", status_payload
        )

        if status == "served":
            await portal_service.publish_order_event("order.served", status_payload)

        if status == "ready":
            await portal_service.publish_order_event("order.ready", status_payload)
            await portal_service.publish_dish_ready_notification(
                str(order.id), order.table_id
            )

    if available_table is not None:
        await portal_service.publish_table_event(
            "table.available",
            {
                "table_id": available_table.id,
                "status": available_table.status,
                "customers": available_table.customers,
            },
        )
        if table_became_available:
            await portal_service.publish_table_available_notification(
                available_table.id
            )
    return order
