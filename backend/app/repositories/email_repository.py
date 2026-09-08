from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.sqlalchemy_models import Email


class EmailRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> Email:
        """Create a new email."""
        email = Email(**data)
        self.session.add(email)
        await self.session.flush()
        return email

    async def get(self, email_id: int, user_id: int) -> Email | None:
        """Fetch email by ID, scoped to user."""
        result = await self.session.execute(
            select(Email).where((Email.id == email_id) & (Email.user_id == user_id))
        )
        return result.scalars().first()

    async def list_for_user(
        self, user_id: int, category: str | None = None, skip: int = 0, limit: int = 100
    ) -> list[Email]:

        """List emails for a user, optionally filtered by category."""
        query = select(Email).where(Email.user_id == user_id)
        
        if category:
            query = query.where(Email.category == category)
        
        query = query.order_by(Email.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def update(self, email_id: int, user_id: int, data: dict) -> Email | None:
        """Update email fields."""
        email = await self.get(email_id, user_id)
        if email:
            for key, value in data.items():
                if hasattr(email, key) and key not in ("id", "created_at", "user_id"):
                    setattr(email, key, value)
            email.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return email

    async def delete(self, email_id: int, user_id: int) -> bool:
        """Delete email by ID, scoped to user."""
        email = await self.get(email_id, user_id)
        if email:
            await self.session.delete(email)
            await self.session.flush()
            return True
        return False

    async def count_by_category(self, user_id: int, category: str) -> int:
        """Count emails with a specific category for a user."""
        result = await self.session.execute(
            select(func.count(Email.id)).where(
                (Email.user_id == user_id) & (Email.category == category)
            )
        )
        return result.scalar() or 0


    async def unread_count(self, user_id: int) -> int:
        """Count unread emails for a user (where read = False)."""
        result = await self.session.execute(
            select(func.count(Email.id)).where(
                (Email.user_id == user_id) & (Email.read == False)  # noqa: E712
            )
        )
        return result.scalar() or 0
