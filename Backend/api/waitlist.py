from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from schemas.models import (
    WaitlistAvailabilityResponse,
    WaitlistEntryResponse,
    WaitlistEntryCreate,
    WaitlistEntryUpdate,
    WaitlistJoinRequest,
    WaitlistJoinResponse,
    WaitlistStatus,
)
from services import waitlist_service


router = APIRouter(prefix="/api/waitlist", tags=["waitlist"])


@router.get("/availability", response_model=WaitlistAvailabilityResponse)
async def get_waitlist_availability(
    party_size: int = Query(..., ge=1, le=20),
    session: AsyncSession = Depends(get_db),
) -> WaitlistAvailabilityResponse:
    available, estimated_wait_minutes = await waitlist_service.estimate_wait(
        session, party_size
    )
    return WaitlistAvailabilityResponse(
        available=available, estimated_wait_minutes=estimated_wait_minutes
    )


@router.post(
    "/join", response_model=WaitlistJoinResponse, status_code=status.HTTP_201_CREATED
)
async def join_waitlist(
    join_data: WaitlistJoinRequest,
    session: AsyncSession = Depends(get_db),
) -> WaitlistJoinResponse:
    try:
        return await waitlist_service.join_queue(session, join_data)
    except waitlist_service.WaitlistConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post(
    "",
    response_model=WaitlistEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_waitlist_entry(
    waitlist_data: WaitlistEntryCreate,
    session: AsyncSession = Depends(get_db),
) -> WaitlistEntryResponse:
    try:
        entry = await waitlist_service.create_waitlist_entry(session, waitlist_data)
    except waitlist_service.WaitlistConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return WaitlistEntryResponse.model_validate(entry)


@router.get("", response_model=list[WaitlistEntryResponse])
async def list_waitlist_entries(
    status: WaitlistStatus | None = None,
    active_only: bool = Query(default=False),
    session: AsyncSession = Depends(get_db),
) -> list[WaitlistEntryResponse]:
    entries = await waitlist_service.list_waitlist_entries(
        session,
        status=status,
        active_only=active_only,
    )
    return [WaitlistEntryResponse.model_validate(entry) for entry in entries]


@router.get("/{entry_id}", response_model=WaitlistEntryResponse)
async def get_waitlist_entry(
    entry_id: UUID,
    session: AsyncSession = Depends(get_db),
) -> WaitlistEntryResponse:
    entry = await waitlist_service.get_waitlist_entry(session, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")
    return WaitlistEntryResponse.model_validate(entry)


@router.put("/{entry_id}", response_model=WaitlistEntryResponse)
async def update_waitlist_entry(
    entry_id: UUID,
    waitlist_data: WaitlistEntryUpdate,
    session: AsyncSession = Depends(get_db),
) -> WaitlistEntryResponse:
    try:
        entry = await waitlist_service.update_waitlist_entry(
            session, entry_id, waitlist_data
        )
    except waitlist_service.WaitlistConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    if entry is None:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")
    return WaitlistEntryResponse.model_validate(entry)
