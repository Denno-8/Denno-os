from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_database, require_admin
from app.schemas.job_source import JobSourceCreate, JobSourceOut, VerifyResult
from app.services.job_source_service import JobSourceService

router = APIRouter(prefix="/job-sources", tags=["Source Monitor"])


def get_service(db: AsyncSession = Depends(get_database)) -> JobSourceService:
    return JobSourceService(db)


@router.get("", response_model=list[JobSourceOut])
async def list_sources(
    status_filter: str | None = Query(default=None, alias="status", description="verified|recent|expired|archived|All"),
    service: JobSourceService = Depends(get_service),
):
    """Public — mirrors the prototype's SourceMonitorView table."""
    return await service.list(status_filter)


@router.post("", response_model=JobSourceOut, status_code=status.HTTP_201_CREATED)
async def create_source(
    payload: JobSourceCreate,
    _admin_id: str = Depends(require_admin),
    service: JobSourceService = Depends(get_service),
):
    return await service.create(payload)


@router.post("/sync-now")
async def sync_now(
    _admin_id: str = Depends(require_admin),
    service: JobSourceService = Depends(get_service),
):
    """Admin-only: Triggers live on-demand job scraping from external sources."""
    return await service.sync_all_real_jobs()


@router.post("/{source_id}/verify", response_model=VerifyResult)
async def verify_source(
    source_id: int,
    _user_id: str = Depends(get_current_user_id),
    service: JobSourceService = Depends(get_service),
):
    """Powers the 'Refresh All' / per-row refresh button. Any authenticated
    user can trigger a re-check and live fetch for this source."""
    doc = await service.verify(source_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Source not found")
    return doc


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source(
    source_id: int,
    _admin_id: str = Depends(require_admin),
    service: JobSourceService = Depends(get_service),
):
    deleted = await service.delete(source_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Source not found")
