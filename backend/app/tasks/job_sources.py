"""
Background task version of what POST /job-sources/{id}/verify does on
demand — this runs it for every source automatically, on the schedule
defined in core/celery_app.py's beat_schedule.

Celery tasks are synchronous by contract; the actual work is async (Motor),
so each task run creates its own short-lived event loop and Mongo client
rather than sharing the FastAPI process's connection pool — Celery workers
are separate processes and can't reach into the API server's asyncio loop.
"""
import asyncio
import logging

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.celery_app import celery_app
from app.core.config import settings
from app.services.job_source_service import JobSourceService

logger = logging.getLogger("denno.tasks.job_sources")


@celery_app.task(name="app.tasks.job_sources.verify_all_sources")
def verify_all_sources() -> dict:
    return asyncio.run(_verify_all_sources())


async def _verify_all_sources() -> dict:
    engine = create_async_engine(settings.database_url, future=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        service = JobSourceService(session)
        # 1. Run live real job fetcher (CampusBizz + Remotive + Arbeitnow + Feeds)
        fetch_summary = await service.sync_all_real_jobs()
        
        # 2. Verify all source monitors
        sources = await service.list(None)
        verified = 0
        for s in sources:
            result = await service.verify(int(s["id"]))
            if result:
                verified += 1
        logger.info("Verified %d/%d job sources and synced live jobs", verified, len(sources))
        return {"total_sources": len(sources), "verified": verified, "fetch_summary": fetch_summary}
