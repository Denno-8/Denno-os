from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.recruiter_repository import RecruiterRepository
from app.schemas.recruiter import RecruiterCreate, RecruiterUpdate


def _serialize(recruiter) -> dict:
    return {
        "id": str(recruiter.id),
        "name": recruiter.name,
        "title": recruiter.title,
        "company": recruiter.company,
        "email": recruiter.email,
        "phone": recruiter.phone,
        "strength": recruiter.strength,
        "notes": recruiter.notes,
        "created_at": recruiter.created_at,
        "updated_at": recruiter.updated_at,
    }


class RecruiterService:
    def __init__(self, db: AsyncSession):
        self.repo = RecruiterRepository(db)

    async def create(self, user_id: int, payload: RecruiterCreate) -> dict:
        doc = payload.model_dump()
        doc["user_id"] = user_id
        created = await self.repo.create(doc)
        return _serialize(created)

    async def list(self, user_id: int, strength: str | None) -> list[dict]:
        recruiters = await self.repo.list_for_user(user_id, strength)
        return [_serialize(recruiter) for recruiter in recruiters]

    async def update(self, recruiter_id: int, user_id: int, payload: RecruiterUpdate) -> dict | None:
        patch = payload.model_dump(exclude_none=True)
        recruiter = await self.repo.update(recruiter_id, user_id, patch)
        return _serialize(recruiter) if recruiter else None

    async def delete(self, recruiter_id: int, user_id: int) -> bool:
        return await self.repo.delete(recruiter_id, user_id)
