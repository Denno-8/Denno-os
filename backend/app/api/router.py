from fastapi import APIRouter

from app.api.auth.routes import router as auth_router
from app.api.applications.routes import router as applications_router
from app.api.jobs.routes import router as jobs_router
from app.api.companies.routes import router as companies_router
from app.api.emails.routes import router as emails_router
from app.api.cv.routes import router as cv_router
from app.api.learning.routes import router as learning_router
from app.api.interviews.routes import router as interviews_router
from app.api.calendar.routes import router as calendar_router
from app.api.goals.routes import router as goals_router
from app.api.notes.routes import router as notes_router
from app.api.recruiters.routes import router as recruiters_router
from app.api.data_transfer.routes import router as data_transfer_router
from app.api.job_sources.routes import router as job_sources_router
from app.api.ai.routes import router as ai_router
from app.api.notifications.routes import router as notifications_router
from app.api.admin.routes import router as admin_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(applications_router)
api_router.include_router(jobs_router)
api_router.include_router(companies_router)
api_router.include_router(emails_router)
api_router.include_router(cv_router)
api_router.include_router(learning_router)
api_router.include_router(interviews_router)
api_router.include_router(calendar_router)
api_router.include_router(goals_router)
api_router.include_router(notes_router)
api_router.include_router(recruiters_router)
api_router.include_router(data_transfer_router)
api_router.include_router(job_sources_router)
api_router.include_router(ai_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_router)


