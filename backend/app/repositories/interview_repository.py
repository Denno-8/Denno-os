from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.sqlalchemy_models import Interview


class InterviewRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> Interview:
        """Create a new interview."""
        interview = Interview(**data)
        self.session.add(interview)
        await self.session.flush()
        return interview

    async def get(self, interview_id: int, user_id: int) -> Interview | None:
        """Fetch interview by ID, scoped to user."""
        result = await self.session.execute(
            select(Interview).where((Interview.id == interview_id) & (Interview.user_id == user_id))
        )
        return result.scalars().first()

    async def list_for_user(self, user_id: int, upcoming_only: bool = False) -> list[Interview]:
        """List interviews for a user, optionally filter to upcoming only."""
        query = select(Interview).where(Interview.user_id == user_id)
        
        if upcoming_only:
            query = query.where(Interview.scheduled_at >= datetime.now(timezone.utc))
        
        query = query.order_by(Interview.scheduled_at)
        result = await self.session.execute(query)
        return result.scalars().all()


    async def update(self, interview_id: int, user_id: int, data: dict) -> Interview | None:
        """Update interview fields."""
        interview = await self.get(interview_id, user_id)
        if interview:
            for key, value in data.items():
                if hasattr(interview, key) and key not in ("id", "created_at", "user_id"):
                    setattr(interview, key, value)
            interview.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return interview

    async def delete(self, interview_id: int, user_id: int) -> bool:
        """Delete interview by ID, scoped to user."""
        interview = await self.get(interview_id, user_id)
        if interview:
            await self.session.delete(interview)
            await self.session.flush()
            return True
        return False
