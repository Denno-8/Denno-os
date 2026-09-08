from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.sqlalchemy_models import CVVersion


class CVVersionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> CVVersion:
        """Create a new CV version."""
        cv = CVVersion(**data)
        self.session.add(cv)
        await self.session.flush()
        return cv

    async def get(self, cv_id: int, user_id: int) -> CVVersion | None:
        """Fetch CV version by ID, scoped to user."""
        result = await self.session.execute(
            select(CVVersion).where((CVVersion.id == cv_id) & (CVVersion.user_id == user_id))
        )
        return result.scalars().first()

    async def list_for_user(self, user_id: int) -> list[CVVersion]:
        """List all CV versions for a user, sorted by most recently updated."""
        result = await self.session.execute(
            select(CVVersion).where(CVVersion.user_id == user_id).order_by(CVVersion.updated_at.desc())
        )
        return result.scalars().all()

    async def update(self, cv_id: int, user_id: int, data: dict) -> CVVersion | None:
        """Update CV version fields."""
        cv = await self.get(cv_id, user_id)
        if cv:
            for key, value in data.items():
                if hasattr(cv, key) and key not in ("id", "created_at", "user_id"):
                    setattr(cv, key, value)
            cv.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return cv

    async def delete(self, cv_id: int, user_id: int) -> bool:
        """Delete CV version by ID, scoped to user."""
        cv = await self.get(cv_id, user_id)
        if cv:
            await self.session.delete(cv)
            await self.session.flush()
            return True
        return False

    async def record_usage(self, cv_id: int, user_id: int) -> CVVersion | None:
        """Increment times_used and stamp last_used_at for a CV version."""
        cv = await self.get(cv_id, user_id)
        if cv:
            cv.times_used = (cv.times_used or 0) + 1
            cv.last_used_at = datetime.now(timezone.utc)
            cv.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return cv
