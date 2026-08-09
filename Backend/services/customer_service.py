import logging
import secrets
import hashlib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Customer
from db.models import utc_now
from schemas.models import CustomerLoginRequest, CustomerRegisterRequest


logger = logging.getLogger(__name__)


class CustomerConflictError(ValueError):
    pass


class CustomerAuthenticationError(ValueError):
    pass


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000
    )
    return f"{salt}${derived_key.hex()}"


def _verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, expected_hash = password_hash.split("$", maxsplit=1)
    except ValueError:
        return False

    derived_key = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000
    )
    return secrets.compare_digest(derived_key.hex(), expected_hash)


async def register_customer(
    session: AsyncSession, data: CustomerRegisterRequest
) -> Customer:
    result = await session.scalar(select(Customer).where(Customer.email == data.email))

    if result is not None and result.is_verified:
        raise CustomerConflictError("Email is already registered")

    if result is None:
        customer = Customer(
            full_name=data.full_name,
            email=data.email,
            password_hash=_hash_password(data.password),
            is_verified=True,
            verification_code=None,
            verification_code_expires_at=None,
            verified_at=utc_now(),
        )
        session.add(customer)
    else:
        customer = result
        customer.full_name = data.full_name
        customer.password_hash = _hash_password(data.password)
        customer.is_verified = True
        customer.verification_code = None
        customer.verification_code_expires_at = None
        customer.verified_at = utc_now()

    await session.commit()
    await session.refresh(customer)
    logger.info("Customer registered customer_id=%s", customer.id)
    return customer


async def login_customer(session: AsyncSession, email: str, password: str) -> Customer:
    customer = await session.scalar(select(Customer).where(Customer.email == email))
    if customer is None:
        raise CustomerAuthenticationError("Invalid email or password")
    if not customer.is_verified:
        raise CustomerAuthenticationError("Email is not verified")
    if not _verify_password(password, customer.password_hash):
        raise CustomerAuthenticationError("Invalid email or password")
    logger.info("Customer logged in customer_id=%s", customer.id)
    return customer
