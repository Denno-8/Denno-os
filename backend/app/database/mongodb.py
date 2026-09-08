"""
Single shared Motor client for the whole app lifecycle.
Call connect_to_mongo() on startup and close_mongo_connection() on shutdown
(wired up in app/main.py's lifespan handler).
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings


class MongoManager:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


mongo = MongoManager()


async def connect_to_mongo() -> None:
    mongo.client = AsyncIOMotorClient(
        settings.mongo_uri,
        connectTimeoutMS=settings.mongo_connect_timeout_ms,
        serverSelectionTimeoutMS=settings.mongo_server_selection_timeout_ms,
    )
    mongo.db = mongo.client[settings.mongo_db_name]
    await ensure_indexes(mongo.db)


async def close_mongo_connection() -> None:
    if mongo.client:
        mongo.client.close()


def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency: yields the active database handle."""
    assert mongo.db is not None, "Mongo connection not initialised"
    return mongo.db


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    """
    Create indexes idempotently on startup. Safe to call every boot —
    Mongo no-ops if the index already exists with the same spec.
    """
    await db.users.create_index("email", unique=True)

    await db.applications.create_index([("user_id", 1), ("stage", 1)])
    await db.applications.create_index([("user_id", 1), ("date_applied", -1)])
    await db.applications.create_index([("company_name", "text"), ("role", "text")])

    await db.jobs.create_index([("title", "text"), ("company_name", "text")])
    await db.jobs.create_index([("match_score", -1)])
    await db.jobs.create_index("company_id")

    await db.companies.create_index([("name", "text"), ("sector", "text")])

    await db.emails.create_index([("user_id", 1), ("read", 1)])
    await db.emails.create_index([("user_id", 1), ("received_at", -1)])

    await db.notes.create_index([("user_id", 1), ("category", 1)])
    await db.notes.create_index([("title", "text"), ("body", "text")])

    await db.calendar_events.create_index([("user_id", 1), ("date", 1)])

    await db.recruiters.create_index([("user_id", 1), ("company_name", 1)])

    await db.cv_versions.create_index([("user_id", 1), ("last_used_at", -1)])

    await db.learning_courses.create_index("category")
    await db.user_course_progress.create_index([("user_id", 1), ("course_id", 1)], unique=True)

    await db.interviews.create_index([("user_id", 1), ("scheduled_at", 1)])
    await db.interviews.create_index("application_id")

    await db.goals.create_index([("user_id", 1), ("deadline", 1)])

    await db.job_sources.create_index("company_id", unique=True)
    await db.job_sources.create_index("status")
