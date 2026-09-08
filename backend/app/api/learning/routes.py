from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_database, require_admin
from app.schemas.learning import CourseCreate, CourseUpdate, ProgressUpdate, CourseWithProgressOut
from app.services.learning_service import LearningService

router = APIRouter(prefix="/learning", tags=["Learning"])


def get_service(db: AsyncSession = Depends(get_database)) -> LearningService:
    return LearningService(db)


@router.get("", response_model=list[CourseWithProgressOut])
async def list_courses(
    category: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    service: LearningService = Depends(get_service),
):
    return await service.list_for_user(user_id, category)


@router.get("/categories", response_model=list[str])
async def list_categories(
    service: LearningService = Depends(get_service),
):
    return await service.categories()


@router.get("/skill-gap-heatmap")
async def get_skill_gap_heatmap(
    user_id: str = Depends(get_current_user_id),
    service: LearningService = Depends(get_service),
):
    """Calculates missing skill frequency across target jobs vs candidate's CV profile."""
    try:
        uid = int(user_id)
    except Exception:
        uid = 1
    return await service.get_skill_gap_heatmap(uid)



@router.post("", response_model=CourseWithProgressOut, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreate,
    _admin_id: str = Depends(require_admin),
    service: LearningService = Depends(get_service),
):
    """Admin-only: the course catalog is shared across all users."""
    return await service.create_course(payload)


@router.patch("/{course_id}", response_model=CourseWithProgressOut)
async def update_course(
    course_id: int,
    payload: CourseUpdate,
    _admin_id: str = Depends(require_admin),
    service: LearningService = Depends(get_service),
):
    doc = await service.update_course(course_id, payload)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")
    return doc


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    _admin_id: str = Depends(require_admin),
    service: LearningService = Depends(get_service),
):
    """Cascades: also removes every user's progress record for this course."""
    deleted = await service.delete_course(course_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")


@router.post("/{course_id}/progress", response_model=CourseWithProgressOut)
async def update_progress(
    course_id: int,
    payload: ProgressUpdate,
    user_id: str = Depends(get_current_user_id),
    service: LearningService = Depends(get_service),
):
    try:
        return await service.update_progress(user_id, course_id, payload.lessons_completed)
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
