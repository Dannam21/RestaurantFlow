from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from schemas.models import DashboardResponse
from services.dashboard_service import get_dashboard


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
async def dashboard(
    session: AsyncSession = Depends(get_db),
) -> DashboardResponse:
    return await get_dashboard(session)
