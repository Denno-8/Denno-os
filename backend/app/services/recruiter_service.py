from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.recruiter_repository import RecruiterRepository
from app.schemas.recruiter import RecruiterCreate, RecruiterUpdate


def _serialize(recruiter) -> dict:
    return {
        "id": str(recruiter.id),
        "name": recruiter.name,
        "company_name": getattr(recruiter, "company_name", "") or "",
        "email": getattr(recruiter, "email", "") or "",
        "linkedin": getattr(recruiter, "linkedin", "") or "",
        "notes": getattr(recruiter, "notes", "") or "",
        "relationship_strength": getattr(recruiter, "relationship_strength", "Warm") or "Warm",
        "last_contacted_at": getattr(recruiter, "last_contacted_at", None),
        "created_at": recruiter.created_at,
        "updated_at": getattr(recruiter, "updated_at", None),
    }


class RecruiterService:
    def __init__(self, db: AsyncSession):
        self.repo = RecruiterRepository(db)

    async def create(self, user_id: int | str, payload: RecruiterCreate) -> dict:
        doc = payload.model_dump()
        doc["user_id"] = int(user_id)
        created = await self.repo.create(doc)
        return _serialize(created)

    async def list(self, user_id: int | str, strength: str | None) -> list[dict]:
        recruiters = await self.repo.list_for_user(int(user_id), strength)
        return [_serialize(recruiter) for recruiter in recruiters]

    async def update(self, recruiter_id: int, user_id: int | str, payload: RecruiterUpdate) -> dict | None:
        patch = payload.model_dump(exclude_none=True)
        recruiter = await self.repo.update(recruiter_id, int(user_id), patch)
        return _serialize(recruiter) if recruiter else None

    async def delete(self, recruiter_id: int, user_id: int | str) -> bool:
        return await self.repo.delete(recruiter_id, int(user_id))
