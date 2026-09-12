from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_database
from app.schemas.notification import NotificationCreate, NotificationOut
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_service(db: AsyncSession = Depends(get_database)) -> NotificationService:
    return NotificationService(db)


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    user_id: str = Depends(get_current_user_id),
    service: NotificationService = Depends(get_service),
):
    return await service.list(int(user_id))


@router.get("/unread-count")
async def unread_count(
    user_id: str = Depends(get_current_user_id),
    service: NotificationService = Depends(get_service),
):
    count = await service.unread_count(int(user_id))
    return {"count": count}


@router.post("", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
async def create_notification(
    payload: NotificationCreate,
    user_id: str = Depends(get_current_user_id),
    service: NotificationService = Depends(get_service),
):
    return await service.create(int(user_id), payload)


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    user_id: str = Depends(get_current_user_id),
    service: NotificationService = Depends(get_service),
):
    success = await service.mark_read(notification_id, int(user_id))
    if not success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    return {"status": "read"}


@router.post("/clear")
async def clear_notifications(
    user_id: str = Depends(get_current_user_id),
    service: NotificationService = Depends(get_service),
):
    await service.clear_all(int(user_id))
    return {"status": "cleared"}


@router.get("/stream")
async def notification_stream(
    user_id: str = Depends(get_current_user_id),
):
    """
    SSE endpoint — client connects once, server pushes events whenever a new
    notification is created for this user. No polling required.

    Event format:
        data: {"type": "notification", "title": "...", "message": "...", "count": N}

    A keepalive comment line is sent every 30 seconds so that reverse
    proxies (Nginx) and browser clients don't time out idle connections.
    """
    from fastapi.responses import StreamingResponse
    from app.core.sse_manager import event_stream

    return StreamingResponse(
        event_stream(int(user_id)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable Nginx proxy buffering for SSE
            "Connection": "keep-alive",
        },
    )
