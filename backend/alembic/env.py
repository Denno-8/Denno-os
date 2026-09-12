"""
Alembic environment configuration for Denno Career OS.

Uses the async SQLAlchemy engine (asyncpg) so migrations run in the same
environment as the application. The DATABASE_URL is read from settings so
it automatically picks up .env values.

Run migrations:
    cd backend
    alembic upgrade head        # Apply all pending migrations
    alembic revision --autogenerate -m "add new table"  # Generate a new migration
    alembic downgrade -1        # Roll back one migration
"""
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

# ── Import the app's declarative Base so Alembic can inspect metadata ─────────
# All models must be imported (directly or transitively) before autogenerate.
from app.models.sqlalchemy_models import (  # noqa: F401  — import for side-effects
    Base,
    User, Company, Job, Application, Note, Goal, CVVersion,
    CalendarEvent, Email, Interview, Recruiter, LearningCourse,
    UserCourseProgress, JobSource, Notification, ChatSession,
)

# ── Alembic config ─────────────────────────────────────────────────────────────
config = context.config

# Interpret the config file's logging section
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Attach app metadata for --autogenerate support
target_metadata = Base.metadata


def _get_db_url() -> str:
    """Return DATABASE_URL from app settings, overriding alembic.ini value."""
    try:
        import sys
        from pathlib import Path
        # Make sure the backend/ package is on sys.path
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from app.core.config import settings
        return settings.database_url
    except Exception:
        # Fall back to the URL in alembic.ini if settings can't be loaded
        return config.get_main_option("sqlalchemy.url")


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generates SQL without connecting)."""
    url = _get_db_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations against a live async database connection."""
    url = _get_db_url()
    connectable = create_async_engine(url, poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
