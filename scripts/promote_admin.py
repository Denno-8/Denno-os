"""
Promotes a user to admin role directly in PostgreSQL. Run from CLI.

Usage:
    python scripts/promote_admin.py user@example.com
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.database.postgresql import init_db, get_session  # noqa: E402
from app.repositories.user_repository import UserRepository  # noqa: E402


async def promote(email: str) -> None:
    email_clean = email.strip().lower()
    await init_db()
    async for db in get_session():
        repo = UserRepository(db)
        user = await repo.get_by_email(email_clean)
        if not user:
            print(f"[!] No user found with email: {email_clean}")
            return

        await repo.update_role(user.id, "admin")
        print(f"[OK] User '{email_clean}' (ID: {user.id}) has been promoted to 'admin' role.")
        print("NOTE: The user must log in again to get a fresh JWT access token with role=admin.")
        return


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/promote_admin.py user@example.com")
        sys.exit(1)
    asyncio.run(promote(sys.argv[1]))
