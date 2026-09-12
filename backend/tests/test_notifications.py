import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate
import app.core.sse_manager as sse_module

@pytest.mark.asyncio
async def test_notification_creation(mock_db):
    service = NotificationService(mock_db)
    
    with patch.object(service.repo, "create", new_callable=AsyncMock) as mock_create, \
         patch.object(sse_module, "publish_notification", new_callable=AsyncMock) as mock_publish:
        
        mock_notif = MagicMock()
        mock_notif.id = "notif_100"
        mock_notif.user_id = 1
        mock_notif.title = "Application Update"
        mock_notif.message = "Interview scheduled"
        mock_notif.type = "application"
        mock_notif.link = ""
        mock_notif.read = False
        mock_notif.created_at = "2026-09-12T10:00:00Z"
        mock_create.return_value = mock_notif

        created = await service.create(
            user_id=1,
            payload=NotificationCreate(
                title="Application Update",
                message="Interview scheduled",
                type="application"
            )
        )
        
        assert created["id"] == "notif_100"

@pytest.mark.asyncio
async def test_publish_notification_handles_exceptions():
    with patch("app.core.redis_client.get_redis", side_effect=Exception("Redis connection error")):
        # Should execute silently without raising uncaught exception
        await sse_module.publish_notification(user_id=99, payload={"title": "Test"})
