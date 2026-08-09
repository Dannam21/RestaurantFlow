from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import AsyncSessionLocal, get_db
from schemas.models import MessageCreate, MessageResponse, MessageSender
from services import ai_service, message_service, waitlist_service


router = APIRouter(prefix="/api/messages", tags=["messages"])

RESERVATION_KEYWORDS = ("reserv", "separar", "mesa disponible", "hay mesa", "hay mesas")


def _mentions_reservation(text: str) -> bool:
    normalized = text.lower()
    return any(keyword in normalized for keyword in RESERVATION_KEYWORDS)


async def _create_bot_reply(
    client_text: str, table_id: int | None, sender_id: str | None
) -> None:
    order_context: dict[str, object] = {"table_id": table_id}

    if _mentions_reservation(client_text):
        async with AsyncSessionLocal() as availability_session:
            order_context["disponibilidad"] = (
                await waitlist_service.describe_availability_for_chat(
                    availability_session
                )
            )

    reply_text = await ai_service.get_bot_response(
        client_text, order_context=order_context
    )

    async with AsyncSessionLocal() as session:
        await message_service.create_message(
            session,
            MessageCreate(
                sender="bot",
                sender_id=sender_id,
                recipient_role="client",
                table_id=table_id,
                text=reply_text,
                message_type="message",
            ),
        )


@router.post(
    "", response_model=MessageResponse, status_code=status.HTTP_201_CREATED
)
async def create_message(
    message_data: MessageCreate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
) -> MessageResponse:
    message = await message_service.create_message(session, message_data)

    if message.sender == "client" and message.message_type == "message":
        background_tasks.add_task(
            _create_bot_reply,
            message.text,
            message.table_id,
            message.sender_id,
        )

    return MessageResponse.model_validate(message)


@router.get("", response_model=list[MessageResponse])
async def list_messages(
    table_id: int | None = Query(default=None, gt=0),
    order_id: UUID | None = None,
    sender: MessageSender | None = None,
    sender_id: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
) -> list[MessageResponse]:
    messages = await message_service.get_messages(
        session,
        table_id=table_id,
        order_id=order_id,
        sender=sender,
        sender_id=sender_id,
        limit=limit,
    )
    return [MessageResponse.model_validate(message) for message in messages]
