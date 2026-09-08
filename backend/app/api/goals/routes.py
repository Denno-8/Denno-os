from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.deps import get_current_user_id, get_database
from app.schemas.goal import GoalCreate, GoalUpdate, GoalOut
from app.services.goal_service import GoalService

router = APIRouter(prefix="/goals", tags=["Goals"])


class IncrementRequest(BaseModel):
    delta: int = 1


def get_service(db: AsyncSession = Depends(get_database)) -> GoalService:
    return GoalService(db)


@router.get("", response_model=list[GoalOut])
async def list_goals(
    user_id: str = Depends(get_current_user_id),
    service: GoalService = Depends(get_service),
):
    return await service.list(user_id)


@router.get("/velocity-projection")
async def get_velocity_projections(
    user_id: str = Depends(get_current_user_id),
    service: GoalService = Depends(get_service),
):
    """Calculates weekly application submission velocity, conversion rates, and time-to-offer projection."""
    try:
        uid = int(user_id)
    except Exception:
        uid = 1
    return await service.get_velocity_projections(uid)


@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
async def create_goal(
    payload: GoalCreate,
    user_id: str = Depends(get_current_user_id),
    service: GoalService = Depends(get_service),
):
    return await service.create(user_id, payload)


@router.patch("/{goal_id}", response_model=GoalOut)
async def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    user_id: str = Depends(get_current_user_id),
    service: GoalService = Depends(get_service),
):
    doc = await service.update(goal_id, user_id, payload)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")
    return doc


@router.post("/{goal_id}/increment", response_model=GoalOut)
async def increment_goal(
    goal_id: int,
    payload: IncrementRequest,
    user_id: str = Depends(get_current_user_id),
    service: GoalService = Depends(get_service),
):
    """Powers the +/- buttons on the Goals board (delta can be negative)."""
    doc = await service.increment(goal_id, user_id, payload.delta)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")
    return doc


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    user_id: str = Depends(get_current_user_id),
    service: GoalService = Depends(get_service),
):
    deleted = await service.delete(goal_id, user_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")
