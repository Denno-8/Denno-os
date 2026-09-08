import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.admin_service import AdminService


@pytest.mark.asyncio
async def test_admin_list_users_serializes_application_counts():
    mock_db = AsyncMock()
    service = AdminService(mock_db)

    user1 = MagicMock()
    user1.id = 1
    user1.email = "admin@example.com"
    user1.first_name = "Admin"
    user1.last_name = "User"
    user1.role = "admin"
    user1.is_active = True
    user1.title = "Lead"
    user1.location = "Nairobi"
    user1.created_at = None

    service.repo.list_users = AsyncMock(return_value=[user1])
    service.repo.user_application_count = AsyncMock(return_value=5)

    result = await service.list_users(skip=0, limit=10, q="")
    assert len(result) == 1
    assert result[0]["email"] == "admin@example.com"
    assert result[0]["role"] == "admin"
    assert result[0]["application_count"] == 5


@pytest.mark.asyncio
async def test_admin_update_user_role_validates_role():
    mock_db = AsyncMock()
    service = AdminService(mock_db)

    user = MagicMock()
    user.id = 2
    user.email = "test@example.com"
    user.first_name = "Test"
    user.last_name = "User"
    user.role = "admin"
    user.is_active = True
    user.title = ""
    user.location = ""
    user.created_at = None

    service.repo.update_user = AsyncMock(return_value=user)

    updated = await service.update_user_role(2, "admin")
    assert updated["role"] == "admin"

    with pytest.raises(Exception):
        await service.update_user_role(2, "invalid_role")


@pytest.mark.asyncio
async def test_admin_export_excel_format():
    mock_db = AsyncMock()
    service = AdminService(mock_db)

    service.list_users = AsyncMock(return_value=[
        {
            "id": 1,
            "email": "user@example.com",
            "first_name": "Jane",
            "last_name": "Doe",
            "role": "user",
            "is_active": True,
            "title": "Engineer",
            "application_count": 3,
            "created_at": "2026-01-01T00:00:00"
        }
    ])

    bytes_out, media_type, filename = await service.export_data("users", "excel")
    assert media_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert filename == "admin_users.xlsx"
    assert len(bytes_out) > 0


@pytest.mark.asyncio
async def test_admin_get_and_update_email_settings():
    mock_db = AsyncMock()
    service = AdminService(mock_db)

    settings_data = await service.get_email_settings()
    assert "smtp_host" in settings_data
    assert "emails_enabled" in settings_data

    updated = await service.update_email_settings({
        "smtp_host": "smtp.gmail.com",
        "smtp_port": 587,
        "smtp_from_name": "Test Admin",
        "emails_enabled": True
    })
    assert updated["smtp_host"] == "smtp.gmail.com"
    assert updated["smtp_port"] == 587
    assert updated["smtp_from_name"] == "Test Admin"
    assert updated["emails_enabled"] is True

