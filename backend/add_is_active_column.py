import asyncio
from sqlalchemy import text
from app.database.postgresql import init_db, close_db, async_session_factory

async def main():
    await init_db()
    async with async_session_factory() as session:
        print("Migrating PostgreSQL schema: checking `users.is_active` column...")
        await session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;"))
        await session.commit()
        print("Successfully added `is_active` column to `users` table!")
    await close_db()

if __name__ == "__main__":
    asyncio.run(main())
