"""
PostgreSQL async database connection using SQLAlchemy.
Call init_db() on startup and close_db() on shutdown.
"""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

Base = declarative_base()

engine = None
async_session_factory = None


async def _auto_seed_fallback():
    """Auto-seed basic users, tech companies, and jobs when running on SQLite fallback."""
    if async_session_factory is None:
        return
    try:
        from app.models.sqlalchemy_models import User
        from app.core.security import hash_password
        from seed_db import seed
        async with async_session_factory() as session:
            res = await session.execute(text("SELECT count(*) FROM users"))
            count = res.scalar_one_or_none() or 0
            if count == 0:
                print("SQLite database initialized empty — auto-seeding initial dataset...")
                await seed()
    except Exception as e:
        print(f"Auto-seed notification: {e}")


async def init_db():
    """Initialize the database engine and session factory with automatic SQLite fallback."""
    global engine, async_session_factory

    from app.models.sqlalchemy_models import (  # noqa: F401
        User, Company, Job, Application, Note, Goal, CVVersion,
        CalendarEvent, Email, Interview, Recruiter, LearningCourse,
        UserCourseProgress, JobSource, ApplicationStage, ChatSession, Notification
    )

    is_sqlite = False
    try:
        engine = create_async_engine(
            settings.database_url,
            echo=False,
            future=True,
            pool_pre_ping=True,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_recycle=1800,  # recycle connections every 30 min to prevent stale handles
        )
        async_session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as exc:
        print(f"WARNING: Database connection failed for '{settings.database_url}': {exc}")
        print("FALLBACK: Switching to local SQLite database (sqlite+aiosqlite:///./denno_dev.db)...")
        is_sqlite = True
        engine = create_async_engine(
            "sqlite+aiosqlite:///./denno_dev.db",
            echo=False,
            future=True,
            connect_args={"timeout": 30.0},
        )
        async_session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
        async with engine.begin() as conn:
            await conn.exec_driver_sql("PRAGMA journal_mode=WAL;")
            await conn.exec_driver_sql("PRAGMA busy_timeout=30000;")
            await conn.run_sync(Base.metadata.create_all)

    if not is_sqlite:
        try:
            async with engine.begin() as conn:
                await conn.exec_driver_sql("""
                    ALTER TABLE IF EXISTS job_sources
                    ADD COLUMN IF NOT EXISTS company_id integer,
                    ADD COLUMN IF NOT EXISTS scrape_method character varying(100) DEFAULT 'manual',
                    ADD COLUMN IF NOT EXISTS status character varying(50) DEFAULT 'recent',
                    ADD COLUMN IF NOT EXISTS jobs_found integer DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS last_checked_at timestamp with time zone DEFAULT now(),
                    ADD COLUMN IF NOT EXISTS description text DEFAULT '',
                    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

                    ALTER TABLE IF EXISTS cv_versions
                    ADD COLUMN IF NOT EXISTS name character varying(255) NOT NULL DEFAULT 'Untitled CV',
                    ADD COLUMN IF NOT EXISTS focus character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS ats_score integer DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS file_url character varying(500),
                    ADD COLUMN IF NOT EXISTS times_used integer DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone,
                    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
                    ADD COLUMN IF NOT EXISTS parsed_content text,
                    ADD COLUMN IF NOT EXISTS parsed_sections jsonb;

                    ALTER TABLE IF EXISTS goals
                    ADD COLUMN IF NOT EXISTS label character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS category character varying(100) DEFAULT 'Applications',
                    ADD COLUMN IF NOT EXISTS current integer DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS target integer DEFAULT 1,
                    ADD COLUMN IF NOT EXISTS deadline date,
                    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

                    ALTER TABLE IF EXISTS notes
                    ADD COLUMN IF NOT EXISTS body text DEFAULT '',
                    ADD COLUMN IF NOT EXISTS category character varying(100) DEFAULT 'Notes',
                    ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

                    ALTER TABLE IF EXISTS recruiters
                    ADD COLUMN IF NOT EXISTS company_name character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS email character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS linkedin character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
                    ADD COLUMN IF NOT EXISTS relationship_strength character varying(50) DEFAULT 'Warm',
                    ADD COLUMN IF NOT EXISTS last_contacted_at timestamp with time zone,
                    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

                    ALTER TABLE IF EXISTS emails
                    ADD COLUMN IF NOT EXISTS from_name character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS subject character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS category character varying(100) DEFAULT 'Application Received',
                    ADD COLUMN IF NOT EXISTS body text DEFAULT '',
                    ADD COLUMN IF NOT EXISTS received_at timestamp with time zone DEFAULT now(),
                    ADD COLUMN IF NOT EXISTS read boolean DEFAULT false,
                    ADD COLUMN IF NOT EXISTS recommended_action text DEFAULT '',
                    ADD COLUMN IF NOT EXISTS application_id integer,
                    ADD COLUMN IF NOT EXISTS source character varying(100) DEFAULT 'manual',
                    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

                    ALTER TABLE IF EXISTS interviews
                    ADD COLUMN IF NOT EXISTS application_id integer,
                    ADD COLUMN IF NOT EXISTS type character varying(50) DEFAULT 'Technical',
                    ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone DEFAULT now(),
                    ADD COLUMN IF NOT EXISTS location character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS behavioral_questions text[] DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS technical_questions text[] DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS status character varying(50) DEFAULT 'scheduled',
                    ADD COLUMN IF NOT EXISTS prep_checklist jsonb DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS post_interview_notes text DEFAULT '',
                    ADD COLUMN IF NOT EXISTS outcome character varying(50),
                    ADD COLUMN IF NOT EXISTS questions_asked jsonb DEFAULT '[]',
                    ADD COLUMN IF NOT EXISTS what_went_well text DEFAULT '',
                    ADD COLUMN IF NOT EXISTS what_to_improve text DEFAULT '',
                    ADD COLUMN IF NOT EXISTS overall_confidence integer,
                    ADD COLUMN IF NOT EXISTS follow_up_actions text[] DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS post_mortem_done boolean DEFAULT false,
                    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

                    ALTER TABLE IF EXISTS calendar_events
                    ADD COLUMN IF NOT EXISTS title character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS type character varying(50) DEFAULT 'Task',
                    ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE,
                    ADD COLUMN IF NOT EXISTS time character varying(50) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS color character varying(50) DEFAULT 'blue',
                    ADD COLUMN IF NOT EXISTS application_id integer,
                    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

                    ALTER TABLE IF EXISTS user_course_progress
                    ADD COLUMN IF NOT EXISTS lessons_completed integer DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS status character varying(50) DEFAULT 'not_started',
                    ADD COLUMN IF NOT EXISTS progress_percent integer DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS certificate_url character varying(500) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

                    ALTER TABLE IF EXISTS learning_courses
                    ADD COLUMN IF NOT EXISTS category character varying(100) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS level character varying(50) DEFAULT 'Beginner',
                    ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS lesson_count integer DEFAULT 1,
                    ADD COLUMN IF NOT EXISTS url character varying(500) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS linked_skill character varying(255) DEFAULT '';

                    ALTER TABLE IF EXISTS users
                    ADD COLUMN IF NOT EXISTS first_name character varying(100) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS last_name character varying(100) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS phone character varying(20) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS title character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS years_experience integer DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS linkedin character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS github character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS website character varying(255) DEFAULT '',
                    ADD COLUMN IF NOT EXISTS summary text DEFAULT '',
                    ADD COLUMN IF NOT EXISTS career_goal text DEFAULT '',
                    ADD COLUMN IF NOT EXISTS availability character varying(100) DEFAULT 'Immediately',
                    ADD COLUMN IF NOT EXISTS notice_period character varying(100) DEFAULT '1 month',
                    ADD COLUMN IF NOT EXISTS salary_min integer DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS salary_max integer DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS currency character varying(10) DEFAULT 'KES',
                    ADD COLUMN IF NOT EXISTS open_to text[] DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS theme character varying(20) DEFAULT 'light',
                    ADD COLUMN IF NOT EXISTS two_fa_enabled boolean DEFAULT false,
                    ADD COLUMN IF NOT EXISTS profile_public boolean DEFAULT false,
                    ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]',
                    ADD COLUMN IF NOT EXISTS experience_list jsonb DEFAULT '[]',
                    ADD COLUMN IF NOT EXISTS projects jsonb DEFAULT '[]',
                    ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"jobs":true,"deadlines":true,"interviews":true,"emails":true,"learning":true,"weekly_report":true}',
                    ADD COLUMN IF NOT EXISTS role character varying(20) DEFAULT 'user',
                    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

                    ALTER TABLE IF EXISTS jobs
                    ADD COLUMN IF NOT EXISTS is_expired boolean DEFAULT false,
                    ADD COLUMN IF NOT EXISTS requirements text[] DEFAULT '{}';

                    ALTER TABLE IF EXISTS applications
                    ADD COLUMN IF NOT EXISTS cv_snapshot jsonb,
                    ADD COLUMN IF NOT EXISTS app_letter_snapshot jsonb,
                    ADD COLUMN IF NOT EXISTS apply_method character varying(50) DEFAULT 'website';
                """)
        except Exception as e:
            print(f"PG Migration notice: {e}")
    else:
        try:
            async with engine.begin() as conn:
                for statement in [
                    "ALTER TABLE applications ADD COLUMN cv_snapshot JSON",
                    "ALTER TABLE applications ADD COLUMN app_letter_snapshot JSON",
                    "ALTER TABLE applications ADD COLUMN apply_method VARCHAR(50) DEFAULT 'website'",
                ]:
                    try:
                        await conn.exec_driver_sql(statement)
                    except Exception:
                        pass
        except Exception as e:
            print(f"SQLite migration notice: {e}")
        await _auto_seed_fallback()



async def close_db():
    """Close the database engine."""
    global engine
    if engine:
        await engine.dispose()


async def get_session() -> AsyncSession:
    """FastAPI dependency: yields an async database session with auto-commit on success."""
    if async_session_factory is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_session_for_user(user_id: int) -> AsyncSession:
    """
    Yields an async session with `app.current_user_id` set for this transaction.

    Use this (via a FastAPI dependency wrapping get_current_user_id) to activate
    the PostgreSQL Row-Level Security policies defined in rls_migrations.sql.
    The SET LOCAL is transaction-scoped and automatically cleared when the
    session is returned to the pool.

    Usage in a route dependency:
        from app.database.postgresql import get_session_for_user
        from app.core.deps import get_current_user_id

        async def get_rls_session(
            user_id: int = Depends(get_current_user_id),
        ) -> AsyncSession:
            async for session in get_session_for_user(user_id):
                yield session
    """
    if async_session_factory is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    async with async_session_factory() as session:
        try:
            # SET LOCAL is transaction-scoped: cleared automatically at end.
            await session.execute(
                text("SET LOCAL app.current_user_id = :uid"),
                {"uid": user_id},
            )
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
