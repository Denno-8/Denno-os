from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.sqlalchemy_models import Recruiter


class RecruiterRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> Recruiter:
        """Create a new recruiter contact."""
        recruiter = Recruiter(**data)
        self.session.add(recruiter)
        await self.session.flush()
        return recruiter

    async def list_for_user(self, user_id: int, company: str | None = None) -> list[Recruiter]:
        """List recruiters for a user, optionally filtered by company."""
        query = select(Recruiter).where(Recruiter.user_id == user_id)
        
        if company and company != "All":
            query = query.where(Recruiter.company == company)
        
        query = query.order_by(Recruiter.updated_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get(self, recruiter_id: int, user_id: int) -> Recruiter | None:
        """Fetch recruiter by ID, scoped to user."""
        result = await self.session.execute(
            select(Recruiter).where((Recruiter.id == recruiter_id) & (Recruiter.user_id == user_id))
        )
        return result.scalars().first()

    async def update(self, recruiter_id: int, user_id: int, data: dict) -> Recruiter | None:
        """Update recruiter fields."""
        recruiter = await self.get(recruiter_id, user_id)
        if recruiter:
            for key, value in data.items():
                if hasattr(recruiter, key) and key not in ("id", "created_at", "user_id"):
                    setattr(recruiter, key, value)
            recruiter.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return recruiter

    async def delete(self, recruiter_id: int, user_id: int) -> bool:
        """Delete recruiter by ID, scoped to user."""
        recruiter = await self.get(recruiter_id, user_id)
        if recruiter:
            await self.session.delete(recruiter)
            await self.session.flush()
            return True
        return False
