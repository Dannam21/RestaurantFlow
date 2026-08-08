from fastapi import APIRouter

from services.monitoring_service import get_monitoring_status


router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


@router.get("/status")
async def monitoring_status() -> dict[str, int | bool]:
    return get_monitoring_status()
