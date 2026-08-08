from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from schemas.models import MessageCreate, MessageResponse, MessageSender
from services import message_service


router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.post(
    "", response_model=MessageResponse, status_code=status.HTTP_201_CREATED
)
async def create_message(
    message_data: MessageCreate,
    session: AsyncSession = Depends(get_db),
) -> MessageResponse:
    message = await message_service.create_message(session, message_data)
    return MessageResponse.model_validate(message)


@router.get("", response_model=list[MessageResponse])
async def list_messages(
    table_id: int | None = Query(default=None, gt=0),
    order_id: UUID | None = None,
    sender: MessageSender | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
) -> list[MessageResponse]:
    messages = await message_service.get_messages(
        session,
        table_id=table_id,
        order_id=order_id,
        sender=sender,
        limit=limit,
    )
    return [MessageResponse.model_validate(message) for message in messages]
