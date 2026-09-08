"""
Centralised, typed application settings.
Everything is read from environment variables (see .env and .env.example at repo root).
"""
from functools import lru_cache
from typing import List
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App General
    app_name: str = Field(default="Denno Career OS", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    debug: bool = Field(default=True, alias="DEBUG")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:password@localhost/denno",
        alias="DATABASE_URL",
        description="PostgreSQL connection string for SQLAlchemy async"
    )
    db_pool_size: int = Field(default=20, alias="DB_POOL_SIZE")
    db_max_overflow: int = Field(default=10, alias="DB_MAX_OVERFLOW")

    # Cache / Queue
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    # Security & Auth
    jwt_secret: str = Field(default="dev-secret-change-me", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=30, alias="REFRESH_TOKEN_EXPIRE_DAYS")
    # Comma-separated trusted hostnames; split into list at validation time.
    allowed_hosts_raw: str = Field(default="localhost,127.0.0.1", alias="ALLOWED_HOSTS")
    # True in production so the refresh-token httpOnly cookie uses Secure flag.
    cookie_secure: bool = Field(default=False, alias="COOKIE_SECURE")
    # Cloudflare Turnstile secret key — verified on /register AND /login when set.
    # Leave empty in local development to skip the CAPTCHA check.
    turnstile_secret_key: str = Field(default="", alias="TURNSTILE_SECRET_KEY")

    # Brute-force / account lockout settings
    brute_force_max_attempts: int = Field(default=10, alias="BRUTE_FORCE_MAX_ATTEMPTS")
    brute_force_lockout_minutes: int = Field(default=15, alias="BRUTE_FORCE_LOCKOUT_MINUTES")

    # BotShieldMiddleware — set to false only in automated test environments.
    bot_shield_enabled: bool = Field(default=True, alias="BOT_SHIELD_ENABLED")


    # AI / LLM Providers
    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    ai_model_name: str = Field(default="claude-3-5-sonnet-20241022", alias="AI_MODEL_NAME")

    # Email / SMTP
    smtp_host: str = Field(default="smtp.gmail.com", alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_user: str = Field(default="", alias="SMTP_USER")
    smtp_password: str = Field(default="", alias="SMTP_PASSWORD")
    smtp_from_email: str = Field(default="noreply@denno.app", alias="SMTP_FROM_EMAIL")
    smtp_from_name: str = Field(default="Denno Career OS", alias="SMTP_FROM_NAME")
    emails_enabled: bool = Field(default=False, alias="EMAILS_ENABLED")

    # CORS & Frontend
    frontend_origin: str = Field(default="http://localhost:5173", alias="FRONTEND_ORIGIN")
    frontend_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
    ]

    # File Uploads
    upload_dir: str = Field(default="uploads", alias="UPLOAD_DIR")
    max_upload_size_mb: int = Field(default=10, alias="MAX_UPLOAD_SIZE_MB")

    # Third-party Integrations / OAuth
    gmail_client_id: str = Field(default="", alias="GMAIL_CLIENT_ID")
    gmail_client_secret: str = Field(default="", alias="GMAIL_CLIENT_SECRET")
    linkedin_client_id: str = Field(default="", alias="LINKEDIN_CLIENT_ID")
    linkedin_client_secret: str = Field(default="", alias="LINKEDIN_CLIENT_SECRET")
    github_client_id: str = Field(default="", alias="GITHUB_CLIENT_ID")
    github_client_secret: str = Field(default="", alias="GITHUB_CLIENT_SECRET")
    google_client_id: str = Field(default="", alias="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(default="", alias="GOOGLE_CLIENT_SECRET")

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @model_validator(mode="after")
    def production_security_checks(self) -> "Settings":
        """Fail fast if dangerous defaults are used in production."""
        if self.app_env == "production":
            if self.debug:
                raise ValueError(
                    "DEBUG must be False in production. Set DEBUG=false in your environment."
                )
            _INSECURE_DEFAULTS = (
                "dev-secret-change-me",
                "denno-career-os-super-secret-jwt-signing-key-2026",
                "REPLACE_WITH_STRONG_SECRET_RUN_openssl_rand_hex_32",
                "REPLACE_WITH_OUTPUT_OF_openssl_rand_hex_32",
                "",
            )
            if self.jwt_secret in _INSECURE_DEFAULTS:
                raise ValueError(
                    "JWT_SECRET is set to an insecure default. "
                    "Generate a strong secret: openssl rand -hex 32"
                )
            if "localhost" in self.frontend_origin or "127.0.0.1" in self.frontend_origin:
                raise ValueError(
                    "FRONTEND_ORIGIN is pointing to localhost in production. "
                    "Set it to your real domain."
                )
            if not self.cookie_secure:
                raise ValueError(
                    "COOKIE_SECURE must be true in production. "
                    "Set COOKIE_SECURE=true in your environment."
                )
        return self

    @property
    def allowed_hosts(self) -> list[str]:
        """Return ALLOWED_HOSTS as a parsed list."""
        return [h.strip() for h in self.allowed_hosts_raw.split(",") if h.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
