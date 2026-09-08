from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_database
from app.schemas.calendar_event import CalendarEventCreate, CalendarEventUpdate, CalendarEventOut
from app.services.calendar_event_service import CalendarEventService

router = APIRouter(prefix="/calendar", tags=["Calendar"])


def get_service(db: AsyncSession = Depends(get_database)) -> CalendarEventService:
    return CalendarEventService(db)


@router.get("", response_model=list[CalendarEventOut])
async def list_events(
    month: int | None = Query(default=None, ge=1, le=12),
    year: int | None = Query(default=None, ge=2000),
    user_id: str = Depends(get_current_user_id),
    service: CalendarEventService = Depends(get_service),
):
    return await service.list(user_id, month, year)


@router.post("", response_model=CalendarEventOut, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: CalendarEventCreate,
    user_id: str = Depends(get_current_user_id),
    service: CalendarEventService = Depends(get_service),
):
    return await service.create(user_id, payload)


@router.patch("/{event_id}", response_model=CalendarEventOut)
async def update_event(
    event_id: int,
    payload: CalendarEventUpdate,
    user_id: str = Depends(get_current_user_id),
    service: CalendarEventService = Depends(get_service),
):
    doc = await service.update(event_id, user_id, payload)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    return doc


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    user_id: str = Depends(get_current_user_id),
    service: CalendarEventService = Depends(get_service),
):
    deleted = await service.delete(event_id, user_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
