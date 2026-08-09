from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from api import (
    customers,
    dashboard,
    menu,
    messages,
    monitoring,
    orders,
    service_sessions,
    staff,
    stats,
    tables,
    waitlist,
)
from config import settings
from db.database import AsyncSessionLocal, engine
from services.monitoring_service import start_monitoring, stop_monitoring


logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    await start_monitoring()
    try:
        yield
    finally:
        await stop_monitoring()
        await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description="Real-time restaurant management API for RestaurantFlow.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders.router)
app.include_router(tables.router)
app.include_router(menu.router)
app.include_router(messages.router)
app.include_router(customers.router)
app.include_router(staff.router)
app.include_router(service_sessions.router)
app.include_router(waitlist.router)
app.include_router(monitoring.router)
app.include_router(stats.router)
app.include_router(dashboard.router)


@app.middleware("http")
async def add_security_headers(request: Request, call_next) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response


@app.exception_handler(Exception)
async def unexpected_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    logger.exception(
        "Unhandled request error method=%s path=%s",
        request.method,
        request.url.path,
        exc_info=exc,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": settings.app_name,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.app_env,
    }


@app.get("/health/ready", tags=["health"])
async def readiness(response: Response) -> dict[str, str | bool]:
    database_status = "ok"
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(select(1))
    except Exception:
        logger.exception("Readiness database check failed")
        database_status = "unavailable"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    portal_status = (
        "configured"
        if settings.portal_enabled and settings.portal_secret_key
        else "enabled_without_credentials"
        if settings.portal_enabled
        else "disabled"
    )
    ai_status = (
        "configured"
        if settings.ai_enabled and settings.anthropic_api_key
        else "enabled_without_credentials"
        if settings.ai_enabled
        else "disabled"
    )
    return {
        "status": "ready" if database_status == "ok" else "not_ready",
        "database": database_status,
        "portal": portal_status,
        "ai": ai_status,
        "monitoring_enabled": settings.monitoring_enabled,
    }
