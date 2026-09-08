"""
Promotes a user to admin role directly in Mongo. Deliberately NOT an HTTP
endpoint — an API route that can create admins is itself a privilege
escalation risk. Run this from a trusted machine with DB access only.

Usage:
    python scripts/promote_admin.py user@example.com
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.repositories.user_repository import UserRepository  # noqa: E402


async def promote(email: str) -> None:
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db_name]
    repo = UserRepository(db)

    user = await repo.get_by_email(email)
    if not user:
        print(f"No user found with email {email}")
        client.close()
        return

    await repo.update_role(str(user["_id"]), "admin")
    print(f"{email} promoted to admin.")
    print("NOTE: they must log in again to get a fresh access token with role=admin —")
    print("existing sessions won't pick up the new role until their token is reissued.")
    client.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/promote_admin.py user@example.com")
        sys.exit(1)
    asyncio.run(promote(sys.argv[1]))
