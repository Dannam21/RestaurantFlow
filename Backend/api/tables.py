import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Order, Table
from schemas.models import TableResponse, TableUpdate
from services import portal_service


router = APIRouter(prefix="/api/tables", tags=["tables"])
logger = logging.getLogger(__name__)


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

    previous_status = table.status
    previous_customers = table.customers
    previous_order_id = table.order_id
    update_data = update.model_dump(exclude_unset=True)

    proposed_status = update_data.get("status", table.status)
    proposed_customers = update_data.get("customers", table.customers)
    proposed_order_id = update_data.get("order_id", table.order_id)

    if proposed_status == "empty":
        if previous_order_id is not None:
            raise HTTPException(
                status_code=409,
                detail="A table with an active order is released when the order is paid",
            )
        if proposed_customers != 0:
            raise HTTPException(
                status_code=409,
                detail="An empty table cannot have customers",
            )
        if proposed_order_id is not None:
            raise HTTPException(
                status_code=409,
                detail="An empty table cannot have an active order",
            )
    elif (
        proposed_status in {"cooking", "eating", "paying"}
        and proposed_order_id is None
    ):
        raise HTTPException(
            status_code=409,
            detail=f"A table in {proposed_status} status requires an active order",
        )
    elif proposed_order_id is not None:
        order = await session.get(Order, proposed_order_id)
        if order is None or order.table_id != table_id:
            raise HTTPException(
                status_code=409,
                detail="order_id must reference an order for this table",
            )
        if order.status == "paid":
            raise HTTPException(
                status_code=409,
                detail="A paid order cannot be assigned to a table",
            )

    if update_data.get("status") is not None:
        table.status = update_data["status"]
    if update_data.get("customers") is not None:
        table.customers = update_data["customers"]
    if "order_id" in update_data:
        table.order_id = update_data["order_id"]

    changed = (
        table.status != previous_status
        or table.customers != previous_customers
        or table.order_id != previous_order_id
    )
    if not changed:
        return TableResponse.model_validate(table)

    await session.commit()
    await session.refresh(table)

    await portal_service.publish_table_event(
        "table.updated",
        {
            "table_id": table.id,
            "status": table.status,
            "customers": table.customers,
            "order_id": str(table.order_id) if table.order_id else None,
            "updated_at": table.updated_at.isoformat(),
        },
    )
    if table.status == "empty" and previous_status != "empty":
        await portal_service.publish_table_available_notification(table.id)
    await portal_service.publish_state_event(
        {"resource": "table", "resource_id": table.id}
    )
    logger.info("Table updated table_id=%s status=%s", table.id, table.status)
    return TableResponse.model_validate(table)
