from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationCreate


def _serialize(notif) -> dict:
    created_at = getattr(notif, "created_at", None) or datetime.now(timezone.utc)
    return {
        "id": str(getattr(notif, "id", 0)),
        "user_id": getattr(notif, "user_id", 0),
        "title": getattr(notif, "title", "") or "",
        "message": getattr(notif, "message", "") or "",
        "type": getattr(notif, "type", "info") or "info",
        "link": getattr(notif, "link", "") or "",
        "read": bool(getattr(notif, "read", False)),
        "created_at": created_at,
    }


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.repo = NotificationRepository(db)

    async def create(self, user_id: int, payload: NotificationCreate) -> dict:
        doc = payload.model_dump()
        doc["user_id"] = user_id
        created = await self.repo.create(doc)
        serialized = _serialize(created)

        # Push real-time SSE event to any connected browser client
        try:
            from app.core.sse_manager import publish_notification
            await publish_notification(user_id, {
                "type": "notification",
                "title": serialized["title"],
                "message": serialized["message"],
                "link": serialized["link"],
                "notification_type": serialized["type"],
            })
        except Exception:
            pass  # SSE publish is non-critical — DB write already succeeded

        return serialized

    async def list(self, user_id: int, limit: int = 50) -> List[dict]:
        items = await self.repo.list_for_user(user_id, limit)
        return [_serialize(item) for item in items]

    async def mark_read(self, notification_id: int, user_id: int, read: bool = True) -> bool:
        return await self.repo.mark_read(notification_id, user_id, read)

    async def mark_all_read(self, user_id: int) -> bool:
        return await self.repo.mark_all_read(user_id)

    async def batch_mark_read(self, notification_ids: list[int], user_id: int, read: bool = True) -> bool:
        return await self.repo.batch_update_read(notification_ids, user_id, read)

    async def delete_one(self, notification_id: int, user_id: int) -> bool:
        return await self.repo.delete_one(notification_id, user_id)

    async def batch_delete(self, notification_ids: list[int], user_id: int) -> bool:
        return await self.repo.batch_delete(notification_ids, user_id)

    async def clear_all(self, user_id: int) -> bool:
        return await self.repo.clear_all(user_id)


    async def unread_count(self, user_id: int) -> int:
        return await self.repo.unread_count(user_id)

    async def send_daily_digest_alert(self, user_id: int, user_email: str, user_name: str, top_jobs: List[dict]) -> dict:

        if not top_jobs:
            return {"sent": False, "reason": "No jobs to digest"}

        title = f"🎯 Daily Digest: {len(top_jobs)} New Matching Jobs"
        message = f"Fresh postings ingested today! Top match: {top_jobs[0].get('title')} at {top_jobs[0].get('company_name')} ({top_jobs[0].get('match_score')}% Match)."
        notif_payload = NotificationCreate(
            title=title,
            message=message,
            type="job_alert",
            link="/jobs?date_filter=today"
        )
        await self.create(user_id, notif_payload)

        from app.services.email_service import EmailService
        email_svc = EmailService(self.repo.session)
        email_res = await email_svc.send_daily_digest_email(
            user_email=user_email,
            user_name=user_name,
            top_jobs=top_jobs
        )

        return {"in_app": True, "email_dispatch": email_res}

