from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationCreate


def _serialize(notif) -> dict:
    return {
        "id": str(notif.id),
        "user_id": notif.user_id,
        "title": notif.title,
        "message": notif.message,
        "type": notif.type,
        "link": notif.link or "",
        "read": notif.read,
        "created_at": notif.created_at,
    }


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.repo = NotificationRepository(db)

    async def create(self, user_id: int, payload: NotificationCreate) -> dict:
        doc = payload.model_dump()
        doc["user_id"] = user_id
        created = await self.repo.create(doc)
        return _serialize(created)

    async def list(self, user_id: int, limit: int = 50) -> list[dict]:
        items = await self.repo.list_for_user(user_id, limit)
        return [_serialize(item) for item in items]

    async def mark_read(self, notification_id: int, user_id: int) -> bool:
        return await self.repo.mark_read(notification_id, user_id)

    async def clear_all(self, user_id: int) -> bool:
        return await self.repo.clear_all(user_id)

    async def unread_count(self, user_id: int) -> int:
        return await self.repo.unread_count(user_id)
