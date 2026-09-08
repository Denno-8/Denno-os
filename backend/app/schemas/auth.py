import re
from typing import Annotated
from pydantic import BaseModel, EmailStr, Field, field_validator


# Password must be 8+ chars with at least one uppercase, one digit, one special char.
_PASSWORD_PATTERN = re.compile(
    r"^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]).{8,128}$"
)

_PASSWORD_RULES = (
    "Password must be 8–128 characters and contain at least one uppercase letter, "
    "one digit, and one special character."
)


def _validate_password_strength(v: str) -> str:
    if not _PASSWORD_PATTERN.match(v):
        raise ValueError(_PASSWORD_RULES)
    return v


class RegisterRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=128)]
    first_name: Annotated[str, Field(min_length=1, max_length=100, strip_whitespace=True)]
    last_name: Annotated[str, Field(min_length=1, max_length=100, strip_whitespace=True)]
    turnstile_token: str | None = None


    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        """Normalise to lowercase so 'User@Example.com' and 'user@example.com'
        are treated as the same account, preventing duplicate registrations."""
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        return _validate_password_strength(v)


class LoginRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(max_length=128)]
    # Optional Turnstile CAPTCHA token — verified server-side when TURNSTILE_SECRET_KEY is set.
    # The frontend should pass this on every login attempt after bot-protection is enabled.
    turnstile_token: str | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()


class RefreshRequest(BaseModel):
    refresh_token: Annotated[str, Field(max_length=2048)]


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: EmailStr
    first_name: str = ""
    last_name: str = ""
    title: str = ""
    location: str = ""
    phone: str = ""
    years_experience: int = 0
    linkedin: str = ""
    github: str = ""
    website: str = ""
    summary: str = ""
    career_goal: str = ""
    availability: str = "Immediately"
    notice_period: str = "1 month"
    salary_min: int = 0
    salary_max: int = 0
    currency: str = "KES"
    skills: list[str] = []
    notifications: dict = {}
    theme: str = "light"
    two_fa_enabled: bool = False
    profile_public: bool = False
    role: str = "user"


class UserProfileUpdate(BaseModel):
    email: EmailStr | None = None
    first_name: Annotated[str | None, Field(default=None, max_length=100, strip_whitespace=True)] = None
    last_name: Annotated[str | None, Field(default=None, max_length=100, strip_whitespace=True)] = None
    title: Annotated[str | None, Field(default=None, max_length=200, strip_whitespace=True)] = None
    location: Annotated[str | None, Field(default=None, max_length=200, strip_whitespace=True)] = None
    phone: Annotated[str | None, Field(default=None, max_length=30)] = None
    years_experience: Annotated[int | None, Field(default=None, ge=0, le=60)] = None
    linkedin: Annotated[str | None, Field(default=None, max_length=500)] = None
    github: Annotated[str | None, Field(default=None, max_length=500)] = None
    website: Annotated[str | None, Field(default=None, max_length=500)] = None
    summary: Annotated[str | None, Field(default=None, max_length=5000)] = None
    career_goal: Annotated[str | None, Field(default=None, max_length=2000)] = None
    availability: Annotated[str | None, Field(default=None, max_length=100)] = None
    notice_period: Annotated[str | None, Field(default=None, max_length=100)] = None
    salary_min: Annotated[int | None, Field(default=None, ge=0)] = None
    salary_max: Annotated[int | None, Field(default=None, ge=0)] = None
    currency: Annotated[str | None, Field(default=None, max_length=10)] = None
    skills: list[str] | None = None
    notifications: dict | None = None
    theme: Annotated[str | None, Field(default=None, max_length=20)] = None
    two_fa_enabled: bool | None = None
    profile_public: bool | None = None


class ChangePasswordRequest(BaseModel):
    current_password: Annotated[str, Field(max_length=128)]
    new_password: Annotated[str, Field(min_length=8, max_length=128)]

    @field_validator("new_password")
    @classmethod
    def strong_new_password(cls, v: str) -> str:
        return _validate_password_strength(v)


class PasswordResetRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()


class PasswordResetConfirm(BaseModel):
    token: Annotated[str, Field(max_length=2048)]
    new_password: Annotated[str, Field(min_length=8, max_length=128)]

    @field_validator("new_password")
    @classmethod
    def strong_new_password(cls, v: str) -> str:
        return _validate_password_strength(v)


class MessageResponse(BaseModel):
    message: str