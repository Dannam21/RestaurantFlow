from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from schemas.models import (
    CookingTimeEntry,
    PeakHourEntry,
    SalesByCategoryEntry,
    SalesByHourEntry,
    StatsResponse,
    TopDishEntry,
)
from services import stats_service


router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=StatsResponse)
async def stats(session: AsyncSession = Depends(get_db)) -> StatsResponse:
    return await stats_service.get_stats(session)


@router.get("/sales-by-hour", response_model=list[SalesByHourEntry])
async def sales_by_hour(
    session: AsyncSession = Depends(get_db),
) -> list[SalesByHourEntry]:
    return await stats_service.get_sales_by_hour(session)


@router.get("/top-dishes", response_model=list[TopDishEntry])
async def top_dishes(session: AsyncSession = Depends(get_db)) -> list[TopDishEntry]:
    return await stats_service.get_top_dishes(session)


@router.get("/sales-by-category", response_model=list[SalesByCategoryEntry])
async def sales_by_category(
    session: AsyncSession = Depends(get_db),
) -> list[SalesByCategoryEntry]:
    return await stats_service.get_sales_by_category(session)


@router.get("/orders-by-status", response_model=dict[str, int])
async def orders_by_status(session: AsyncSession = Depends(get_db)) -> dict[str, int]:
    return await stats_service.get_orders_by_status(session)


@router.get("/peak-hours", response_model=list[PeakHourEntry])
async def peak_hours(session: AsyncSession = Depends(get_db)) -> list[PeakHourEntry]:
    return await stats_service.get_peak_hours(session)


@router.get("/cooking-time-by-hour", response_model=list[CookingTimeEntry])
async def cooking_time_by_hour(
    session: AsyncSession = Depends(get_db),
) -> list[CookingTimeEntry]:
    return await stats_service.get_cooking_time_by_hour(session)
