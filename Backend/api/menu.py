from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import MenuItem
from schemas.models import MenuItemResponse


router = APIRouter(prefix="/api/menu", tags=["menu"])


@router.get("", response_model=list[MenuItemResponse])
async def list_menu_items(
    available_only: bool = Query(default=False),
    session: AsyncSession = Depends(get_db),
) -> list[MenuItemResponse]:
    query = select(MenuItem).order_by(
        MenuItem.category.asc(),
        MenuItem.name.asc(),
    )
    if available_only:
        query = query.where(MenuItem.is_available.is_(True))

    result = await session.scalars(query)
    return [MenuItemResponse.model_validate(item) for item in result.all()]
