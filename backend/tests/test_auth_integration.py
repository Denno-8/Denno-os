import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from jose import jwt
from app.services.auth_service import AuthService
from app.schemas.auth import RegisterRequest
from app.core.security import verify_password, create_access_token
from app.core.config import settings

@pytest.mark.asyncio
async def test_register_and_password_hashing(mock_db):
    service = AuthService(mock_db)
    
    with patch.object(service.repo, "get_by_email", new_callable=AsyncMock) as mock_get_by_email, \
         patch.object(service.repo, "create", new_callable=AsyncMock) as mock_create:
        
        mock_get_by_email.return_value = None
        mock_user = MagicMock()
        mock_user.id = 1
        mock_user.email = "test@example.com"
        mock_user.role = "user"
        mock_user.first_name = "Test"
        mock_user.last_name = "User"
        mock_create.return_value = mock_user

        req = RegisterRequest(
            email="test@example.com",
            password="SecurePassword123!",
            first_name="Test",
            last_name="User"
        )
        
        token_res = await service.register(req)
        assert token_res.access_token is not None
        assert mock_create.called
        created_doc = mock_create.call_args[0][0]
        assert verify_password("SecurePassword123!", created_doc["password_hash"])

@pytest.mark.asyncio
async def test_access_token_creation_and_decoding():
    user_id = "42"
    role = "user"
    token = create_access_token(user_id, role=role)
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    assert payload is not None
    assert payload.get("sub") == "42"
    assert payload.get("role") == "user"


@pytest.mark.asyncio
async def test_password_reset_flow(mock_db):
    from app.core.security import create_reset_token

    service = AuthService(mock_db)
    mock_user = MagicMock()
    mock_user.id = 123
    mock_user.email = "reset@example.com"
    mock_user.first_name = "Jane"

    with patch.object(service.repo, "get_by_email", new_callable=AsyncMock) as mock_get_by_email, \
         patch.object(service.repo, "get_by_id", new_callable=AsyncMock) as mock_get_by_id, \
         patch.object(service.repo, "update_password", new_callable=AsyncMock) as mock_update_pw, \
         patch("app.core.email_sender.send_password_reset", new_callable=AsyncMock) as mock_email:

        mock_get_by_email.return_value = mock_user
        mock_get_by_id.return_value = mock_user

        # 1. Request reset
        await service.request_password_reset("reset@example.com")
        assert mock_email.called
        token_sent = mock_email.call_args[0][1]
        assert token_sent is not None

        # 2. Confirm reset
        await service.confirm_password_reset(token_sent, "NewStrongPass1!")
        assert mock_update_pw.called
        updated_id, new_hash = mock_update_pw.call_args[0]
        assert updated_id == 123
        assert verify_password("NewStrongPass1!", new_hash)

