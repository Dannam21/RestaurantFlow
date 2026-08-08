from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Table
from schemas.models import TableResponse, TableUpdate


router = APIRouter(prefix="/api/tables", tags=["tables"])


@router.get("", response_model=list[TableResponse])
async def list_tables(
    session: AsyncSession = Depends(get_db),
) -> list[TableResponse]:
    result = await session.scalars(select(Table).order_by(Table.id.asc()))
    return [TableResponse.model_validate(table) for table in result.all()]


@router.get("/{table_id}", response_model=TableResponse)
async def get_table(
    table_id: int,
    session: AsyncSession = Depends(get_db),
) -> TableResponse:
    table = await session.get(Table, table_id)
    if table is None:
        raise HTTPException(status_code=404, detail="Table not found")
    return TableResponse.model_validate(table)


@router.put("/{table_id}", response_model=TableResponse)
async def update_table(
    table_id: int,
    update: TableUpdate,
    session: AsyncSession = Depends(get_db),
) -> TableResponse:
    table = await session.get(Table, table_id)
    if table is None:
        raise HTTPException(status_code=404, detail="Table not found")

    update_data = update.model_dump(exclude_unset=True)
    if update_data.get("status") is not None:
        table.status = update_data["status"]
    if update_data.get("customers") is not None:
        table.customers = update_data["customers"]
    if "order_id" in update_data:
        table.order_id = update_data["order_id"]

    await session.commit()
    await session.refresh(table)
    return TableResponse.model_validate(table)
