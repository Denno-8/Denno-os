import asyncio
import sys
import os
from urllib.parse import urlparse
import asyncpg

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.database.postgresql import init_db, close_db
from seed_db import seed


async def setup_postgresql(custom_password: str = None):
    # Parse configured DATABASE_URL
    db_url = settings.database_url
    # e.g. postgresql+asyncpg://postgres:password@localhost:5432/denno
    clean_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    parsed = urlparse(clean_url)

    db_user = parsed.username or "postgres"
    db_password = custom_password or parsed.password or "password"
    db_host = parsed.hostname or "127.0.0.1"
    db_port = parsed.port or 5432
    db_name = parsed.path.lstrip("/") or "denno"

    print(f"Connecting to PostgreSQL server at {db_host}:{db_port} as user '{db_user}'...")

    conn = None
    try:
        # Connect to system database 'postgres' first to verify / create target database
        conn = await asyncpg.connect(
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port,
            database="postgres"
        )
        print(f"Connected to PostgreSQL server successfully!")

        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", db_name)
        if not exists:
            await conn.execute(f'CREATE DATABASE "{db_name}";')
            print(f"Created database '{db_name}' on PostgreSQL!")
        else:
            print(f"Database '{db_name}' already exists.")
        await conn.close()

    except Exception as exc:
        print(f"Failed to connect to PostgreSQL: {exc}")
        print("\nPlease ensure:")
        print(f"1. PostgreSQL service is running on {db_host}:{db_port}")
        print(f"2. Your credentials in .env (DATABASE_URL) or passed argument are correct.")
        print(f"Usage: python backend/setup_db.py [pg_password]")
        return False

    print("\nInitializing SQLAlchemy tables & migrations...")
    await init_db()
    
    print("\nSeeding initial data into PostgreSQL...")
    await seed()
    await close_db()
    
    print("\nPostgreSQL Database Setup & Seeding Completed Successfully!")
    return True


if __name__ == "__main__":
    pwd = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(setup_postgresql(pwd))

