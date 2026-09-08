from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_database
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationOut,
    ApplicationAnalytics,
)
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["Applications"])


def get_service(db: AsyncSession = Depends(get_database)) -> ApplicationService:
    return ApplicationService(db)


@router.get("", response_model=list[ApplicationOut])
async def list_applications(
    stage: str | None = Query(default=None, description="Filter by pipeline stage"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    user_id: str = Depends(get_current_user_id),
    service: ApplicationService = Depends(get_service),
):
    return await service.list(user_id, stage, skip, limit)


@router.get("/analytics", response_model=ApplicationAnalytics)
async def application_analytics(
    user_id: str = Depends(get_current_user_id),
    service: ApplicationService = Depends(get_service),
):
    return await service.analytics(user_id)


@router.get("/{app_id}", response_model=ApplicationOut)
async def get_application(
    app_id: int,
    user_id: str = Depends(get_current_user_id),
    service: ApplicationService = Depends(get_service),
):
    doc = await service.get(app_id, user_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    return doc


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: ApplicationCreate,
    user_id: str = Depends(get_current_user_id),
    service: ApplicationService = Depends(get_service),
):
    return await service.create(user_id, payload)


@router.patch("/{app_id}", response_model=ApplicationOut)
async def update_application(
    app_id: int,
    payload: ApplicationUpdate,
    user_id: str = Depends(get_current_user_id),
    service: ApplicationService = Depends(get_service),
):
    doc = await service.update(app_id, user_id, payload)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    return doc


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    app_id: int,
    user_id: str = Depends(get_current_user_id),
    service: ApplicationService = Depends(get_service),
):
    deleted = await service.delete(app_id, user_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")


@router.get("/followups/due")
async def get_due_followups(
    days: int = Query(default=7, ge=1, le=60),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_database),
):
    """Lists applications requiring follow-up action due to >= days inactivity."""
    from app.services.followup_service import FollowupService
    try:
        uid = int(user_id)
    except Exception:
        uid = 1
    svc = FollowupService(db)
    return await svc.get_due_followups(uid, days_threshold=days)


@router.get("/analytics/funnel")
async def application_funnel_analytics(
    user_id: str = Depends(get_current_user_id),
    service: ApplicationService = Depends(get_service),
):
    """Returns visual conversion funnel metrics and drop-off bottleneck diagnostic insights."""
    try:
        uid = int(user_id)
    except Exception:
        uid = 1
    return await service.get_pipeline_funnel_analytics(uid)


@router.post("/{app_id}/followup-draft")
async def generate_followup_draft(
    app_id: int,
    tone: str = Query(default="polite", description="polite | confident | technical"),
    user_id: str = Depends(get_current_user_id),
    service: ApplicationService = Depends(get_service),
):
    """Generates customized follow-up draft email and iCal reminder for an application."""
    try:
        uid = int(user_id)
    except Exception:
        uid = 1
    res = await service.generate_followup_draft(app_id, uid, tone=tone)
    if not res:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    return res


from pydantic import BaseModel


class BatchDispatchPayload(BaseModel):
    application_ids: list[int]


@router.post("/batch-dispatch")
async def batch_dispatch_applications(
    payload: BatchDispatchPayload,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_database),
):
    """Processes a batch queue of applications, sending tailored email dispatches with rate limiting."""
    from app.services.email_service import EmailService
    try:
        uid = int(user_id)
    except Exception:
        uid = 1
    svc = EmailService(db)
    return await svc.batch_send_applications(uid, payload.application_ids)


