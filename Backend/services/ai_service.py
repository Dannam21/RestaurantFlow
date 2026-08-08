import asyncio
import logging
from typing import TypeVar
from uuid import UUID

from anthropic import AsyncAnthropic
from pydantic import BaseModel

from config import settings
from services import portal_service


logger = logging.getLogger(__name__)
ResponseModel = TypeVar("ResponseModel", bound=BaseModel)


class AIUnavailableError(RuntimeError):
    pass


async def generate_structured_response(
    *,
    system_prompt: str,
    user_prompt: str,
    response_model: type[ResponseModel],
) -> ResponseModel:
    if not settings.ai_enabled:
        raise AIUnavailableError("AI is disabled")
    if not settings.anthropic_api_key:
        raise AIUnavailableError("ANTHROPIC_API_KEY is not configured")

    try:
        async with AsyncAnthropic(
            api_key=settings.anthropic_api_key,
            timeout=settings.ai_timeout_seconds,
        ) as client:
            response = await asyncio.wait_for(
                client.messages.parse(
                    model=settings.ai_model,
                    max_tokens=1024,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_prompt}],
                    output_format=response_model,
                ),
                timeout=settings.ai_timeout_seconds,
            )
        result = response.parsed_output
        if result is None:
            raise AIUnavailableError(
                "AI response did not contain structured output"
            )
        return response_model.model_validate(result)
    except Exception as exc:
        logger.exception("AI request failed model=%s", settings.ai_model)
        raise AIUnavailableError("AI request failed") from exc


async def process_new_order(order_id: UUID) -> None:
    from agents.analyzer import analyze_order
    from agents.prioritizer import prioritize_orders
    from db.database import AsyncSessionLocal
    from db.models import Order

    async with AsyncSessionLocal() as session:
        try:
            order = await session.get(Order, order_id)
            if order is None:
                logger.error("AI workflow order not found order_id=%s", order_id)
                return
            await analyze_order(session, order)
        except Exception:
            await session.rollback()
            logger.exception("Analyzer workflow failed order_id=%s", order_id)
            await portal_service.publish_agent_event(
                "agent.failed",
                {
                    "agent": "analyzer",
                    "order_id": str(order_id),
                    "status": "failed",
                    "message": "Analyzer workflow failed",
                },
            )

        try:
            await prioritize_orders(session)
        except Exception:
            await session.rollback()
            logger.exception("Prioritizer workflow failed order_id=%s", order_id)
            await portal_service.publish_agent_event(
                "agent.failed",
                {
                    "agent": "prioritizer",
                    "status": "failed",
                    "message": "Prioritizer workflow failed",
                },
            )
