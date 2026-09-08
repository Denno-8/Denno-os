from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.note_repository import NoteRepository
from app.schemas.note import NoteCreate, NoteUpdate


def _serialize(note) -> dict:
    return {
        "id": str(note.id),
        "user_id": note.user_id,
        "title": note.title,
        "body": getattr(note, "body", "") or "",
        "category": getattr(note, "category", "Notes") or "Notes",
        "tags": getattr(note, "tags", []) or [],
        "created_at": note.created_at,
        "updated_at": note.updated_at,
    }



class NoteService:
    def __init__(self, db: AsyncSession):
        self.repo = NoteRepository(db)

    async def create(self, user_id: int, payload: NoteCreate) -> dict:
        doc = payload.model_dump()
        doc["user_id"] = user_id
        created = await self.repo.create(doc)
        return _serialize(created)

    async def list(self, user_id: int, category: str | None, q: str | None) -> list[dict]:
        notes = await self.repo.list_for_user(user_id, category, q)
        return [_serialize(note) for note in notes]

    async def update(self, note_id: int, user_id: int, payload: NoteUpdate) -> dict | None:
        patch = payload.model_dump(exclude_none=True)
        note = await self.repo.update(note_id, user_id, patch)
        return _serialize(note) if note else None

    async def delete(self, note_id: int, user_id: int) -> bool:
        return await self.repo.delete(note_id, user_id)

    async def categories(self, user_id: int) -> list[str]:
        return sorted(await self.repo.categories(user_id))
