from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, update, delete
from app.models.sqlalchemy_models import Notification


class NotificationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> Notification:
        notification = Notification(**data)
        self.session.add(notification)
        await self.session.flush()
        return notification

    async def list_for_user(self, user_id: int, limit: int = 50) -> list[Notification]:
        result = await self.session.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def mark_read(self, notification_id: int, user_id: int) -> bool:
        result = await self.session.execute(
            select(Notification).where(
                (Notification.id == notification_id) & (Notification.user_id == user_id)
            )
        )
        notif = result.scalars().first()
        if notif:
            notif.read = True
            await self.session.flush()
            return True
        return False

    async def clear_all(self, user_id: int) -> bool:
        await self.session.execute(
            delete(Notification).where(Notification.user_id == user_id)
        )
        await self.session.flush()
        return True

    async def unread_count(self, user_id: int) -> int:
        result = await self.session.execute(
            select(func.count(Notification.id)).where(
                (Notification.user_id == user_id) & (Notification.read == False)  # noqa: E712
            )
        )
        return result.scalar() or 0
