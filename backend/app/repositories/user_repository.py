import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.sqlalchemy_models import User

logger = logging.getLogger("denno.user")


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_email(self, email: str) -> User | None:
        """Fetch user by email (case-insensitive)."""
        result = await self.session.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalars().first()

    async def get_by_id(self, user_id: int) -> User | None:
        """Fetch user by ID."""
        return await self.session.get(User, user_id)

    async def create(self, data: dict) -> User:
        """Create a new user."""
        data["email"] = data["email"].lower()
        user = User(**data)
        self.session.add(user)
        logger.debug("Creating user email=%s", data["email"])
        await self.session.flush()
        await self.session.commit()
        logger.debug("Committed user id=%s", user.id)
        return user

    async def update_password(self, user_id: int, password_hash: str) -> None:
        """Update user's password hash."""
        user = await self.get_by_id(user_id)
        if user:
            user.password_hash = password_hash
            user.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
            await self.session.commit()

    async def update_role(self, user_id: int, role: str) -> None:
        """Update user's role (admin or user)."""
        user = await self.get_by_id(user_id)
        if user:
            user.role = role
            user.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
            await self.session.commit()

    async def update(self, user_id: int, data: dict) -> User | None:
        """Update user fields."""
        user = await self.get_by_id(user_id)
        if user:
            for key, value in data.items():
                if hasattr(user, key) and key not in ("id", "created_at"):
                    setattr(user, key, value)
            user.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
            await self.session.commit()
        return user

    async def list(self, skip: int = 0, limit: int = 100) -> list[User]:
        """List all users with pagination."""
        result = await self.session.execute(
            select(User).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def delete(self, user_id: int) -> None:
        """Delete a user by ID."""
        user = await self.get_by_id(user_id)
        if user:
            await self.session.delete(user)
            await self.session.flush()
