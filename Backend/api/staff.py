from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import StaffUser
from schemas.models import (
    StaffLoginRequest,
    StaffLoginResponse,
    StaffRole,
    StaffUserResponse,
)
from services import staff_service


router = APIRouter(prefix="/api/staff", tags=["staff"])


@router.post("/login", response_model=StaffLoginResponse)
async def login_staff(
    login_data: StaffLoginRequest,
    session: AsyncSession = Depends(get_db),
) -> StaffLoginResponse:
    try:
        staff = await staff_service.login_staff(
            session, login_data.email, login_data.password
        )
    except staff_service.StaffAuthenticationError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    return StaffLoginResponse(
        staff_id=staff.id,
        name=staff.name,
        role=staff.role,
        email=staff.email,
    )


@router.get("", response_model=list[StaffUserResponse])
async def list_staff(
    role: StaffRole | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
) -> list[StaffUserResponse]:
    query = select(StaffUser).order_by(StaffUser.name.asc())
    if role is not None:
        query = query.where(StaffUser.role == role)

    result = await session.scalars(query)
    return [StaffUserResponse.model_validate(user) for user in result.all()]
