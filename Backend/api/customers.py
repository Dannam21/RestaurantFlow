from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Customer, ReservationTracking
from schemas.models import (
    CustomerLoginRequest,
    CustomerRegisterRequest,
    CustomerResponse,
    ReservationTrackingResponse,
)
from services import customer_service


router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.post(
    "/register",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_customer(
    customer_data: CustomerRegisterRequest,
    session: AsyncSession = Depends(get_db),
) -> CustomerResponse:
    try:
        customer = await customer_service.register_customer(session, customer_data)
    except customer_service.CustomerConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return CustomerResponse.model_validate(customer)


@router.post("/login", response_model=CustomerResponse)
async def login_customer(
    login_data: CustomerLoginRequest,
    session: AsyncSession = Depends(get_db),
) -> CustomerResponse:
    try:
        customer = await customer_service.login_customer(
            session, login_data.email, login_data.password
        )
    except customer_service.CustomerAuthenticationError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    return CustomerResponse.model_validate(customer)


@router.get(
    "/{customer_id}/reservations",
    response_model=list[ReservationTrackingResponse],
)
async def list_customer_reservations(
    customer_id: UUID,
    session: AsyncSession = Depends(get_db),
) -> list[ReservationTrackingResponse]:
    customer = await session.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    result = await session.scalars(
        select(ReservationTracking)
        .where(ReservationTracking.customer_id == customer_id)
        .order_by(ReservationTracking.reserved_at.desc())
    )
    return [ReservationTrackingResponse.model_validate(item) for item in result.all()]
