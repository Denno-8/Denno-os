from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_database
from app.schemas.recruiter import RecruiterCreate, RecruiterUpdate, RecruiterOut
from app.services.recruiter_service import RecruiterService

router = APIRouter(prefix="/recruiters", tags=["Networking"])


def get_service(db: AsyncSession = Depends(get_database)) -> RecruiterService:
    return RecruiterService(db)


@router.get("", response_model=list[RecruiterOut])
async def list_recruiters(
    strength: str | None = Query(default=None, description="Hot | Warm | Cold | New | All"),
    user_id: str = Depends(get_current_user_id),
    service: RecruiterService = Depends(get_service),
):
    return await service.list(user_id, strength)


@router.post("", response_model=RecruiterOut, status_code=status.HTTP_201_CREATED)
async def create_recruiter(
    payload: RecruiterCreate,
    user_id: str = Depends(get_current_user_id),
    service: RecruiterService = Depends(get_service),
):
    return await service.create(user_id, payload)


@router.patch("/{recruiter_id}", response_model=RecruiterOut)
async def update_recruiter(
    recruiter_id: int,
    payload: RecruiterUpdate,
    user_id: str = Depends(get_current_user_id),
    service: RecruiterService = Depends(get_service),
):
    doc = await service.update(recruiter_id, user_id, payload)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recruiter not found")
    return doc


@router.delete("/{recruiter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recruiter(
    recruiter_id: int,
    user_id: str = Depends(get_current_user_id),
    service: RecruiterService = Depends(get_service),
):
    deleted = await service.delete(recruiter_id, user_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recruiter not found")
