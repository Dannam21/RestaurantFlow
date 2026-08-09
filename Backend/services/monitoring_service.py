import asyncio
import logging

from agents.predictor import run_predictor
from agents.supervisor import run_supervisor
from config import settings
from db.database import AsyncSessionLocal


logger = logging.getLogger(__name__)
_monitoring_tasks: set[asyncio.Task[None]] = set()


async def run_predictor_cycle() -> int:
    async with AsyncSessionLocal() as session:
        return await run_predictor(session)


async def run_supervisor_cycle() -> int:
    async with AsyncSessionLocal() as session:
        return await run_supervisor(session)


async def _predictor_loop() -> None:
    while True:
        try:
            await run_predictor_cycle()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Predictor cycle failed")
        await asyncio.sleep(settings.predictor_interval_seconds)


async def _supervisor_loop() -> None:
    while True:
        try:
            await run_supervisor_cycle()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Supervisor cycle failed")
        await asyncio.sleep(settings.supervisor_interval_seconds)


async def start_monitoring() -> None:
    if not settings.monitoring_enabled:
        logger.info("Monitoring disabled")
        return
    if any(not task.done() for task in _monitoring_tasks):
        logger.warning("Monitoring tasks already running")
        return

    _monitoring_tasks.clear()
    _monitoring_tasks.update(
        {
            asyncio.create_task(_predictor_loop(), name="restaurantflow-predictor"),
            asyncio.create_task(_supervisor_loop(), name="restaurantflow-supervisor"),
        }
    )
    logger.info("Monitoring tasks started")


async def stop_monitoring() -> None:
    if not _monitoring_tasks:
        return

    for task in _monitoring_tasks:
        task.cancel()
    await asyncio.gather(*_monitoring_tasks, return_exceptions=True)
    _monitoring_tasks.clear()
    logger.info("Monitoring tasks stopped")


def get_monitoring_status() -> dict[str, int | bool]:
    return {
        "enabled": settings.monitoring_enabled,
        "predictor_interval": settings.predictor_interval_seconds,
        "supervisor_interval": settings.supervisor_interval_seconds,
    }
