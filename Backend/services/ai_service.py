import asyncio
import logging
from typing import TypeVar
from uuid import UUID

from anthropic import AsyncAnthropic
from google import genai
from pydantic import BaseModel

from config import settings
from services import portal_service


logger = logging.getLogger(__name__)
ResponseModel = TypeVar("ResponseModel", bound=BaseModel)

_gemini_client: genai.Client | None = None
BOT_SYSTEM_PROMPT = (
    "Eres un bot amable de restaurante que ayuda a clientes en español. "
    "Responde de manera breve y amigable."
)
BOT_FALLBACK_RESPONSE = "Disculpa, el sistema está ocupado. Intenta de nuevo en un momento."


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


def _build_bot_prompt(message: str, order_context: dict | None) -> str:
    prompt_lines = [BOT_SYSTEM_PROMPT]
    if order_context:
        details = ", ".join(
            f"{key}: {value}"
            for key, value in order_context.items()
            if value is not None
        )
        if details:
            prompt_lines.append(f"Contexto: {details}")
    prompt_lines.append(f"Cliente dice: {message}")
    prompt_lines.append("Bot:")
    return "\n".join(prompt_lines)


def _get_gemini_client() -> genai.Client:
    global _gemini_client
    if _gemini_client is None:
        if not settings.google_api_key:
            raise AIUnavailableError("GOOGLE_API_KEY is not configured")
        _gemini_client = genai.Client(api_key=settings.google_api_key)
    return _gemini_client


def _call_gemini_sync(prompt: str) -> str:
    client = _get_gemini_client()
    response = client.models.generate_content(
        model=settings.chat_ai_model,
        contents=prompt,
    )
    reply = (response.text or "").strip()
    if not reply:
        raise ValueError("Gemini returned an empty response")
    return reply


async def get_bot_response(message: str, order_context: dict | None = None) -> str:
    prompt = _build_bot_prompt(message, order_context)
    try:
        return await asyncio.to_thread(_call_gemini_sync, prompt)
    except Exception:
        logger.exception("Gemini request failed model=%s", settings.chat_ai_model)
        return BOT_FALLBACK_RESPONSE


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
