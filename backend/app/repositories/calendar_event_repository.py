from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import extract
from app.models.sqlalchemy_models import CalendarEvent


class CalendarEventRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> CalendarEvent:
        """Create a new calendar event."""
        event = CalendarEvent(**data)
        self.session.add(event)
        await self.session.flush()
        return event

    async def get(self, event_id: int, user_id: int) -> CalendarEvent | None:
        """Fetch calendar event by ID, scoped to user."""
        result = await self.session.execute(
            select(CalendarEvent).where(
                (CalendarEvent.id == event_id) & (CalendarEvent.user_id == user_id)
            )
        )
        return result.scalars().first()

    async def list_for_user(self, user_id: int, month: int | None = None, year: int | None = None) -> list[CalendarEvent]:
        """List calendar events for a user, optionally filtered by month and year."""
        query = select(CalendarEvent).where(CalendarEvent.user_id == user_id).order_by(CalendarEvent.date)
        
        if month and year:
            query = query.where(
                (extract("month", CalendarEvent.date) == month) &
                (extract("year", CalendarEvent.date) == year)
            )
        
        result = await self.session.execute(query)
        return result.scalars().all()


    async def update(self, event_id: int, user_id: int, data: dict) -> CalendarEvent | None:
        """Update calendar event fields."""
        event = await self.get(event_id, user_id)
        if event:
            for key, value in data.items():
                if hasattr(event, key) and key not in ("id", "created_at", "user_id"):
                    setattr(event, key, value)
            await self.session.flush()
        return event

    async def delete(self, event_id: int, user_id: int) -> bool:
        """Delete calendar event by ID, scoped to user."""
        event = await self.get(event_id, user_id)
        if event:
            await self.session.delete(event)
            await self.session.flush()
            return True
        return False
