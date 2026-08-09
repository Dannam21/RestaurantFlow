import logging

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import StaffUser


logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class StaffAuthenticationError(ValueError):
    pass


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


async def login_staff(session: AsyncSession, email: str, password: str) -> StaffUser:
    staff = await session.scalar(select(StaffUser).where(StaffUser.email == email))
    if staff is None or not verify_password(password, staff.password_hash):
        raise StaffAuthenticationError("Invalid email or password")

    logger.info("Staff logged in staff_id=%s role=%s", staff.id, staff.role)
    return staff
