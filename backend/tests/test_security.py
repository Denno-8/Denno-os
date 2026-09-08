from jose import jwt

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, create_reset_token


def test_password_hash_roundtrip():
    hashed = hash_password("supersecret123")
    assert hashed != "supersecret123"
    assert verify_password("supersecret123", hashed)
    assert not verify_password("wrong-password", hashed)


def test_access_token_contains_role_and_jti():
    token = create_access_token("user-123", role="admin")
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])

    assert payload["sub"] == "user-123"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"
    assert "jti" in payload  # required for logout/revocation to work


def test_access_token_defaults_to_user_role():
    token = create_access_token("user-456")
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    assert payload["role"] == "user"


def test_reset_token_has_reset_type_not_access():
    """A reset token must never be usable as an access token — deps.py's
    get_token_payload() checks payload['type'] == 'access', so a reset
    token presented as a Bearer token must be rejected."""
    token = create_reset_token("user-123")
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])

    assert payload["type"] == "reset"
    assert payload["sub"] == "user-123"
