"""
Weekly report generation. Computes real analytics (via ApplicationService,
already-tested) for every user and logs a summary — this is the compute
half of the "weekly progress report" notification preference in the user
profile; it does NOT send anything yet (no email integration wired up,
same limitation noted in AuthService.request_password_reset).
"""
import asyncio
import logging

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

from app.core.celery_app import celery_app
from app.core.config import settings
from app.models.sqlalchemy_models import User
from app.services.application_service import ApplicationService

logger = logging.getLogger("denno.tasks.reports")


@celery_app.task(name="app.tasks.reports.generate_weekly_reports")
def generate_weekly_reports() -> dict:
    return asyncio.run(_generate_weekly_reports())


async def _generate_weekly_reports() -> dict:
    engine = create_async_engine(settings.database_url, future=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        service = ApplicationService(session)
        result = await session.execute(select(User.id))
        user_ids = [row[0] for row in result.fetchall()]

        generated = 0
        for uid in user_ids:
            analytics = await service.analytics(uid)
            logger.info(
                "Weekly report for user %s: %d applications, %d%% response rate",
                uid, analytics.total, analytics.response_rate,
            )
            generated += 1

        return {"users": len(user_ids), "reports_generated": generated}
