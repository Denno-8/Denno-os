from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.calendar_event_repository import CalendarEventRepository
from app.schemas.calendar_event import CalendarEventCreate, CalendarEventUpdate


def _serialize(event) -> dict:
    return {
        "id": str(event.id),
        "title": event.title,
        "description": event.description,
        "date": event.date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "application_id": str(event.application_id) if event.application_id else None,
        "location": event.location,
        "notes": event.notes,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
    }


class CalendarEventService:
    def __init__(self, db: AsyncSession):
        self.repo = CalendarEventRepository(db)

    async def create(self, user_id: int, payload: CalendarEventCreate) -> dict:
        doc = payload.model_dump(exclude_none=True)
        doc["user_id"] = user_id
        if "application_id" in doc and doc["application_id"] is not None:
            doc["application_id"] = int(doc["application_id"])
        created = await self.repo.create(doc)
        return _serialize(created)

    async def list(self, user_id: int, month: int | None, year: int | None) -> list[dict]:
        events = await self.repo.list_for_user(user_id, month, year)
        return [_serialize(event) for event in events]

    async def update(self, event_id: int, user_id: int, payload: CalendarEventUpdate) -> dict | None:
        patch = payload.model_dump(exclude_none=True)
        if "application_id" in patch and patch["application_id"] is not None:
            patch["application_id"] = int(patch["application_id"])
        event = await self.repo.update(event_id, user_id, patch)
        return _serialize(event) if event else None

    async def delete(self, event_id: int, user_id: int) -> bool:
        return await self.repo.delete(event_id, user_id)
