from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from schemas.models import StatsResponse
from services.stats_service import get_stats


router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=StatsResponse)
async def stats(session: AsyncSession = Depends(get_db)) -> StatsResponse:
    return await get_stats(session)
