from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings


app = FastAPI(
    title=settings.app_name,
    description="Real-time restaurant management API for RestaurantFlow.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": settings.app_name,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.app_env,
    }
