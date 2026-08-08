from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AgentLog, Message, Order, Table
from schemas.models import (
    AgentActivityResponse,
    DashboardResponse,
    MessageResponse,
    OrderResponse,
    TableResponse,
)
from services.stats_service import ACTIVE_ORDER_STATUSES, get_stats


async def get_dashboard(session: AsyncSession) -> DashboardResponse:
    stats = await get_stats(session)

    orders = list(
        (
            await session.scalars(
                select(Order)
                .where(Order.status.in_(ACTIVE_ORDER_STATUSES))
                .order_by(Order.created_at.desc())
                .limit(20)
            )
        ).all()
    )
    tables = list(
        (await session.scalars(select(Table).order_by(Table.id.asc()))).all()
    )
    alerts = list(
        (
            await session.scalars(
                select(AgentLog)
                .where(
                    AgentLog.agent_name == "supervisor",
                    AgentLog.action == "operational_alert",
                )
                .order_by(AgentLog.created_at.desc())
                .limit(10)
            )
        ).all()
    )
    activity = list(
        (
            await session.scalars(
                select(AgentLog)
                .order_by(AgentLog.created_at.desc())
                .limit(10)
            )
        ).all()
    )
    requests = list(
        reversed(
            (
                await session.scalars(
                    select(Message)
                    .where(Message.message_type == "customer_request")
                    .order_by(Message.created_at.desc())
                    .limit(10)
                )
            ).all()
        )
    )

    return DashboardResponse(
        stats=stats,
        orders=[OrderResponse.model_validate(order) for order in orders],
        tables=[TableResponse.model_validate(table) for table in tables],
        alerts=[
            AgentActivityResponse(
                id=log.id,
                agent_name=log.agent_name,
                action=log.action,
                output_data=log.output_data,
                created_at=log.created_at,
            )
            for log in alerts
        ],
        agent_activity=[
            AgentActivityResponse(
                id=log.id,
                agent_name=log.agent_name,
                action=log.action,
                output_data=log.output_data,
                created_at=log.created_at,
            )
            for log in activity
        ],
        recent_requests=[
            MessageResponse.model_validate(message) for message in requests
        ],
    )
