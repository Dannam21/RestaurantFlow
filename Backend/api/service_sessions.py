from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Table
from schemas.models import (
    ServiceSessionAssignmentUpdate,
    ServiceSessionResponse,
    WaiterTableActionRequest,
)
from services import order_service, portal_service, service_session_service


router = APIRouter(prefix="/api/service-sessions", tags=["service-sessions"])


@router.get("", response_model=list[ServiceSessionResponse])
async def list_service_sessions(
    active_only: bool = Query(default=True),
    session: AsyncSession = Depends(get_db),
) -> list[ServiceSessionResponse]:
    sessions = await service_session_service.list_service_sessions(
        session, active_only=active_only
    )
    return [ServiceSessionResponse.model_validate(item) for item in sessions]


@router.put("/tables/{table_id}/assignment", response_model=ServiceSessionResponse)
async def assign_waiter(
    table_id: int,
    payload: ServiceSessionAssignmentUpdate,
    session: AsyncSession = Depends(get_db),
) -> ServiceSessionResponse:
    try:
        service_session = await service_session_service.assign_waiter(
            session, table_id, payload.waiter_id
        )
    except service_session_service.ServiceSessionConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return ServiceSessionResponse.model_validate(service_session)


@router.post("/tables/{table_id}/waiter-actions", response_model=ServiceSessionResponse)
async def apply_waiter_action(
    table_id: int,
    payload: WaiterTableActionRequest,
    session: AsyncSession = Depends(get_db),
) -> ServiceSessionResponse:
    try:
        table, service_session = await service_session_service.require_waiter_session(
            session, table_id=table_id, waiter_id=payload.waiter_id
        )
    except service_session_service.ServiceSessionConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    if table.order_id is None:
        raise HTTPException(status_code=409, detail="Table has no active order")

    try:
        if payload.action == "ready":
            order = await order_service.update_order_progress(
                session, table.order_id, 100
            )
            if order is None:
                raise HTTPException(status_code=404, detail="Order not found")
            await session.refresh(service_session)
        elif payload.action == "served":
            order = await order_service.update_order_status(
                session, table.order_id, "served"
            )
            if order is None:
                raise HTTPException(status_code=404, detail="Order not found")
            table.status = "eating"
            await session.commit()
            await session.refresh(service_session)
            await portal_service.publish_table_event(
                "table.updated",
                {
                    "table_id": table.id,
                    "status": table.status,
                    "customers": table.customers,
                    "order_id": str(table.order_id) if table.order_id else None,
                },
            )
        elif payload.action == "paying":
            table.status = "paying"
            await session.commit()
            await session.refresh(service_session)
            await portal_service.publish_table_event(
                "table.updated",
                {
                    "table_id": table.id,
                    "status": table.status,
                    "customers": table.customers,
                    "order_id": str(table.order_id) if table.order_id else None,
                },
            )
        elif payload.action == "paid":
            order = await order_service.update_order_status(
                session, table.order_id, "paid"
            )
            if order is None:
                raise HTTPException(status_code=404, detail="Order not found")
            await session.refresh(service_session)
        else:
            raise HTTPException(status_code=400, detail="Unsupported waiter action")
    except order_service.OrderConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return ServiceSessionResponse.model_validate(service_session)
