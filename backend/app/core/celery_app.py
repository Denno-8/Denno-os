"""
Celery app instance. Previously listed in requirements.txt but never
actually configured or used — this wires it in for two real background
jobs: periodic job-source verification and weekly report generation.

Run a worker with:
    celery -A app.core.celery_app worker --loglevel=info
Run the scheduler (for the periodic tasks below) with:
    celery -A app.core.celery_app beat --loglevel=info
"""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "denno",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.job_sources", "app.tasks.reports"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

celery_app.conf.beat_schedule = {
    "verify-job-sources-daily": {
        "task": "app.tasks.job_sources.verify_all_sources",
        "schedule": crontab(hour=3, minute=0),  # 03:00 UTC daily — off-peak
    },
    "generate-weekly-reports": {
        "task": "app.tasks.reports.generate_weekly_reports",
        "schedule": crontab(day_of_week="monday", hour=6, minute=0),
    },
}
