from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.database import get_db
from schemas.models import (
    CustomerLoginRequest,
    CustomerRegisterRequest,
    CustomerRegisterResponse,
    CustomerResponse,
    CustomerVerifyRequest,
)
from services import customer_service
from services.email_service import EmailDeliveryError


router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.post(
    "/register",
    response_model=CustomerRegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_customer(
    customer_data: CustomerRegisterRequest,
    session: AsyncSession = Depends(get_db),
) -> CustomerRegisterResponse:
    try:
        customer = await customer_service.register_customer(session, customer_data)
    except customer_service.CustomerConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except EmailDeliveryError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return CustomerRegisterResponse(
        message="Verification code sent to email",
        customer_id=customer.id,
        email=customer.email,
        expires_in_minutes=settings.customer_verification_code_ttl_minutes,
    )


@router.post("/verify", response_model=CustomerResponse)
async def verify_customer(
    verification_data: CustomerVerifyRequest,
    session: AsyncSession = Depends(get_db),
) -> CustomerResponse:
    try:
        customer = await customer_service.verify_customer(session, verification_data)
    except customer_service.CustomerVerificationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

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
