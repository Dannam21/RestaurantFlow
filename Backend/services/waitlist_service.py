import logging
from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from agents.predictor import calculate_remaining_time
from db.models import Customer, Order, ReservationTracking, Table, WaitlistEntry
from db.models import utc_now
from schemas.models import (
    WaitlistEntryCreate,
    WaitlistEntryUpdate,
    WaitlistJoinRequest,
    WaitlistJoinResponse,
    WaitlistStatus,
)
from services import portal_service, service_session_service


logger = logging.getLogger(__name__)

FINAL_WAITLIST_STATUSES = {"seated", "cancelled"}
ACTIVE_WAITLIST_STATUSES = ("waiting", "notified")

DEFAULT_TABLE_TURNOVER_MINUTES = 30
DINING_BUFFER_MINUTES = 20
MIN_ESTIMATED_WAIT_MINUTES = 5


class WaitlistConflictError(ValueError):
    pass


async def _upsert_reservation_tracking(
    session: AsyncSession,
    *,
    customer_id: UUID | None,
    table_id: int,
    party_size: int,
) -> None:
    if customer_id is None:
        return

    active_tracking = await session.scalar(
        select(ReservationTracking).where(
            ReservationTracking.customer_id == customer_id,
            ReservationTracking.table_id == table_id,
            ReservationTracking.released_at.is_(None),
        )
    )
    if active_tracking is None:
        session.add(
            ReservationTracking(
                customer_id=customer_id,
                table_id=table_id,
                party_size=party_size,
                status="reserved",
            )
        )
        return

    active_tracking.party_size = party_size


async def _find_seatable_table(
    session: AsyncSession, party_size: int
) -> Table | None:
    statement = (
        select(Table)
        .where(Table.capacity >= party_size, Table.status == "empty")
        .order_by(Table.capacity.asc(), Table.id.asc())
    )
    return await session.scalar(statement)


async def _remaining_minutes_for_table(
    session: AsyncSession, table: Table, now: datetime
) -> int:
    if table.order_id is not None:
        order = await session.get(Order, table.order_id)
        if order is not None and order.status != "paid":
            if order.status == "served":
                elapsed = max(0.0, (now - order.updated_at).total_seconds() / 60)
                return max(
                    MIN_ESTIMATED_WAIT_MINUTES,
                    round(DINING_BUFFER_MINUTES - elapsed),
                )
            cook_remaining = (
                calculate_remaining_time(order, now) or DEFAULT_TABLE_TURNOVER_MINUTES
            )
            return max(
                MIN_ESTIMATED_WAIT_MINUTES,
                round(cook_remaining + DINING_BUFFER_MINUTES),
            )

    elapsed = max(0.0, (now - table.updated_at).total_seconds() / 60)
    return max(
        MIN_ESTIMATED_WAIT_MINUTES,
        round(DEFAULT_TABLE_TURNOVER_MINUTES - elapsed),
    )


async def estimate_wait(
    session: AsyncSession, party_size: int
) -> tuple[bool, int | None]:
    """Return (can_seat_now, estimated_wait_minutes) for a party of this size."""
    candidates_statement = select(Table).where(Table.capacity >= party_size)
    candidates = list((await session.scalars(candidates_statement)).all())
    if not candidates:
        return False, None

    free_table = next((t for t in candidates if t.status == "empty"), None)
    if free_table is not None:
        return True, 0

    now = utc_now()
    occupied = [t for t in candidates if t.status != "empty"]
    if not occupied:
        return False, DEFAULT_TABLE_TURNOVER_MINUTES

    waits = [
        await _remaining_minutes_for_table(session, table, now) for table in occupied
    ]
    return False, min(waits)


async def create_waitlist_entry(
    session: AsyncSession, data: WaitlistEntryCreate
) -> WaitlistEntry:
    if data.customer_id is not None:
        customer = await session.get(Customer, data.customer_id)
        if customer is None:
            raise WaitlistConflictError("Customer not found")

    entry = WaitlistEntry(
        customer_id=data.customer_id,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        party_size=data.party_size,
        status="waiting",
        quoted_wait_minutes=data.quoted_wait_minutes,
        notes=data.notes,
    )
    session.add(entry)
    await session.commit()
    await session.refresh(entry)

    await portal_service.publish_notification(
        "notification.waitlist_created",
        {
            "waitlist_entry_id": str(entry.id),
            "full_name": entry.full_name,
            "party_size": entry.party_size,
            "status": entry.status,
        },
    )
    await portal_service.publish_state_event(
        {"resource": "waitlist_entry", "resource_id": str(entry.id)}
    )
    logger.info("Waitlist entry created entry_id=%s", entry.id)
    return entry


async def join_queue(
    session: AsyncSession, data: WaitlistJoinRequest
) -> WaitlistJoinResponse:
    """Atomically seat the party now if the queue is empty and a table fits,
    otherwise add them to the waitlist with a real estimated wait."""
    if data.customer_id is not None:
        customer = await session.get(Customer, data.customer_id)
        if customer is None:
            raise WaitlistConflictError("Customer not found")

        existing_table = await session.scalar(
            select(Table).where(
                Table.customer_id == data.customer_id, Table.status != "empty"
            )
        )
        if existing_table is not None:
            raise WaitlistConflictError(
                "This customer already has an active table"
            )

    active_queue_count = await session.scalar(
        select(func.count())
        .select_from(WaitlistEntry)
        .where(WaitlistEntry.status.in_(ACTIVE_WAITLIST_STATUSES))
    )
    free_table = (
        None
        if active_queue_count
        else await _find_seatable_table(session, data.party_size)
    )

    if free_table is not None:
        free_table.status = "waiting_order"
        free_table.customers = data.party_size
        free_table.customer_id = data.customer_id
        await service_session_service.ensure_active_session(session, free_table)
        await _upsert_reservation_tracking(
            session,
            customer_id=data.customer_id,
            table_id=free_table.id,
            party_size=data.party_size,
        )
        try:
            await session.commit()
        except Exception:
            await session.rollback()
            logger.warning(
                "Auto-seat race lost table_id=%s, falling back to queue",
                free_table.id,
            )
        else:
            await session.refresh(free_table)
            await portal_service.publish_table_event(
                "table.updated",
                {
                    "table_id": free_table.id,
                    "status": free_table.status,
                    "customers": free_table.customers,
                    "order_id": None,
                    "updated_at": free_table.updated_at.isoformat(),
                },
            )
            await portal_service.publish_state_event(
                {"resource": "table", "resource_id": free_table.id}
            )
            logger.info(
                "Waitlist join auto-seated table_id=%s party_size=%s",
                free_table.id,
                data.party_size,
            )
            return WaitlistJoinResponse(
                outcome="seated",
                table_id=free_table.id,
                estimated_wait_minutes=0,
            )

    _, estimated_wait = await estimate_wait(session, data.party_size)
    entry = await create_waitlist_entry(
        session,
        WaitlistEntryCreate(
            customer_id=data.customer_id,
            full_name=data.full_name,
            email=data.email,
            phone=data.phone,
            party_size=data.party_size,
            quoted_wait_minutes=estimated_wait,
        ),
    )
    return WaitlistJoinResponse(
        outcome="queued",
        entry=entry,
        estimated_wait_minutes=estimated_wait,
    )


async def list_waitlist_entries(
    session: AsyncSession,
    status: WaitlistStatus | None = None,
    active_only: bool = False,
) -> list[WaitlistEntry]:
    statement = select(WaitlistEntry)
    if active_only:
        statement = statement.where(
            WaitlistEntry.status.in_(("waiting", "notified"))
        )
    elif status is not None:
        statement = statement.where(WaitlistEntry.status == status)

    statement = statement.order_by(
        WaitlistEntry.created_at.asc(),
        WaitlistEntry.full_name.asc(),
    )
    result = await session.scalars(statement)
    return list(result.all())


async def get_waitlist_entry(
    session: AsyncSession, entry_id: UUID
) -> WaitlistEntry | None:
    return await session.get(WaitlistEntry, entry_id)


async def update_waitlist_entry(
    session: AsyncSession,
    entry_id: UUID,
    data: WaitlistEntryUpdate,
) -> WaitlistEntry | None:
    entry = await session.get(WaitlistEntry, entry_id)
    if entry is None:
        return None

    previous_status = entry.status
    previous_table_id = entry.table_id
    update_data = data.model_dump(exclude_unset=True)
    new_status = update_data.get("status", entry.status)
    new_table_id = update_data.get("table_id", entry.table_id)

    if previous_status in FINAL_WAITLIST_STATUSES and new_status != previous_status:
        raise WaitlistConflictError(
            f"Cannot change a waitlist entry after it is {previous_status}"
        )
    if new_status == "seated" and new_table_id is None:
        raise WaitlistConflictError("A seated waitlist entry requires a table_id")
    if new_status != "seated" and "table_id" in update_data and new_table_id is not None:
        raise WaitlistConflictError("table_id can only be assigned when status is seated")

    assigned_table: Table | None = None
    if new_table_id is not None:
        assigned_table = await session.get(Table, new_table_id)
        if assigned_table is None:
            raise WaitlistConflictError("Table not found")
        if new_status == "seated":
            if assigned_table.order_id is not None:
                raise WaitlistConflictError("Table already has an active order")
            if assigned_table.status != "empty":
                raise WaitlistConflictError("Table is not available")

    if "quoted_wait_minutes" in update_data:
        entry.quoted_wait_minutes = update_data["quoted_wait_minutes"]
    if "notes" in update_data:
        entry.notes = update_data["notes"]
    if "status" in update_data:
        entry.status = update_data["status"]
    if "table_id" in update_data:
        entry.table_id = update_data["table_id"]

    if entry.status == "notified" and previous_status != "notified":
        entry.notified_at = utc_now()
    if entry.status == "seated" and previous_status != "seated":
        entry.seated_at = utc_now()
        if assigned_table is not None:
            assigned_table.status = "waiting_order"
            assigned_table.customers = entry.party_size
            assigned_table.customer_id = entry.customer_id
            await service_session_service.ensure_active_session(session, assigned_table)
            await _upsert_reservation_tracking(
                session,
                customer_id=entry.customer_id,
                table_id=assigned_table.id,
                party_size=entry.party_size,
            )
    if entry.status == "cancelled":
        entry.table_id = None

    await session.commit()
    await session.refresh(entry)

    await portal_service.publish_state_event(
        {"resource": "waitlist_entry", "resource_id": str(entry.id)}
    )
    if entry.status == "notified" and previous_status != "notified":
        await portal_service.publish_notification(
            "notification.waitlist_called",
            {
                "waitlist_entry_id": str(entry.id),
                "full_name": entry.full_name,
                "table_id": entry.table_id,
            },
        )
    if entry.status == "seated" and previous_status != "seated":
        await portal_service.publish_notification(
            "notification.waitlist_seated",
            {
                "waitlist_entry_id": str(entry.id),
                "full_name": entry.full_name,
                "table_id": entry.table_id,
            },
        )
    logger.info(
        "Waitlist entry updated entry_id=%s status=%s table_id=%s previous_status=%s previous_table_id=%s",
        entry.id,
        entry.status,
        entry.table_id,
        previous_status,
        previous_table_id,
    )
    return entry
