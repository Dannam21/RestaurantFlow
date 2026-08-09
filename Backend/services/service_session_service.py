from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Order, ServiceSession, StaffUser, Table, utc_now


class ServiceSessionConflictError(ValueError):
    pass


async def get_active_session(
    session: AsyncSession, table_id: int
) -> ServiceSession | None:
    return await session.scalar(
        select(ServiceSession)
        .where(ServiceSession.table_id == table_id, ServiceSession.status == "active")
        .order_by(ServiceSession.created_at.desc())
    )


async def ensure_active_session(
    session: AsyncSession,
    table: Table,
) -> ServiceSession | None:
    if table.status == "empty":
        active_session = await get_active_session(session, table.id)
        if active_session is not None:
            active_session.status = "completed"
            active_session.closed_at = utc_now()
        return active_session

    active_session = await get_active_session(session, table.id)
    if active_session is None:
        active_session = ServiceSession(
            table_id=table.id,
            customer_id=table.customer_id,
            order_id=table.order_id,
            status="active",
        )
        session.add(active_session)
        return active_session

    active_session.customer_id = table.customer_id
    active_session.order_id = table.order_id
    return active_session


async def assign_waiter(
    session: AsyncSession,
    table_id: int,
    waiter_id: UUID | None,
) -> ServiceSession:
    table = await session.get(Table, table_id)
    if table is None:
        raise ServiceSessionConflictError("Table not found")
    if table.status == "empty":
        raise ServiceSessionConflictError("Cannot assign a waiter to an empty table")

    active_session = await ensure_active_session(session, table)
    if active_session is None:
        raise ServiceSessionConflictError("Active service session not found")

    if waiter_id is not None:
        waiter = await session.get(StaffUser, waiter_id)
        if waiter is None or waiter.role != "waiter":
            raise ServiceSessionConflictError("Waiter not found")
        active_session.waiter_id = waiter_id
        active_session.waiter_assigned_at = utc_now()
    else:
        active_session.waiter_id = None
        active_session.waiter_assigned_at = None

    await session.commit()
    await session.refresh(active_session)
    return active_session


async def list_service_sessions(
    session: AsyncSession,
    *,
    active_only: bool = True,
) -> list[ServiceSession]:
    statement = select(ServiceSession).order_by(ServiceSession.created_at.desc())
    if active_only:
        statement = statement.where(ServiceSession.status == "active")
    result = await session.scalars(statement)
    return list(result.all())


async def attach_order(
    session: AsyncSession,
    table_id: int,
    order: Order,
) -> None:
    active_session = await get_active_session(session, table_id)
    if active_session is None:
        return

    active_session.order_id = order.id
    active_session.order_sent_at = utc_now()


async def complete_session_for_table(
    session: AsyncSession, table_id: int
) -> ServiceSession | None:
    active_session = await get_active_session(session, table_id)
    if active_session is None:
        return None

    active_session.status = "completed"
    active_session.closed_at = utc_now()
    return active_session


async def require_waiter_session(
    session: AsyncSession,
    *,
    table_id: int,
    waiter_id: UUID,
) -> tuple[Table, ServiceSession]:
    table = await session.get(Table, table_id)
    if table is None:
        raise ServiceSessionConflictError("Table not found")

    active_session = await get_active_session(session, table_id)
    if active_session is None:
        raise ServiceSessionConflictError("Active service session not found")
    if active_session.waiter_id != waiter_id:
        raise ServiceSessionConflictError(
            "Only the assigned waiter can change this table status"
        )
    return table, active_session
