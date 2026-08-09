import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Order, Table
from schemas.models import OrderCreate, OrderStatus
from services import portal_service, service_session_service


logger = logging.getLogger(__name__)

class OrderConflictError(ValueError):
    pass


ALLOWED_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"analyzing", "cooking"},
    "analyzing": {"pending", "cooking"},
    "cooking": {"ready"},
    "ready": {"served"},
    "served": {"paid"},
    "paid": set(),
}


async def create_order(session: AsyncSession, order_data: OrderCreate) -> Order | None:
    table = await session.get(Table, order_data.table_id)
    if table is None:
        return None
    if table.order_id is not None:
        raise OrderConflictError("Table already has an active order")

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
    await service_session_service.ensure_active_session(session, table)
    await service_session_service.attach_order(session, table.id, order)

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
    await portal_service.publish_state_event(
        {"resource": "order", "resource_id": str(order.id)}
    )
    logger.info("Order created order_id=%s table_id=%s", order.id, order.table_id)
    return order


async def get_orders(
    session: AsyncSession,
    status: OrderStatus | None = None,
    limit: int = 50,
) -> list[Order]:
    statement = select(Order)
    if status is not None:
        statement = statement.where(Order.status == status)

    statement = statement.order_by(Order.created_at.desc()).limit(limit)
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

    if order.status in {"served", "paid"}:
        raise OrderConflictError(
            f"Progress cannot be changed when order status is {order.status}"
        )

    previous_progress = order.progress
    previous_status = order.status
    if progress < previous_progress:
        raise OrderConflictError("Order progress cannot move backwards")
    if order.status == "ready" and progress != 100:
        raise OrderConflictError("A ready order must keep progress at 100")
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
    await portal_service.publish_state_event(
        {"resource": "order", "resource_id": str(order.id)}
    )

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
    if status != previous_status and status not in ALLOWED_STATUS_TRANSITIONS.get(
        previous_status, set()
    ):
        raise OrderConflictError(
            f"Invalid order status transition: {previous_status} -> {status}"
        )
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
            table.customer_id = None
            available_table = table
            await service_session_service.complete_session_for_table(session, table.id)

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
    await portal_service.publish_state_event(
        {"resource": "order", "resource_id": str(order.id)}
    )
    logger.info(
        "Order status updated order_id=%s status=%s", order.id, order.status
    )
    return order
