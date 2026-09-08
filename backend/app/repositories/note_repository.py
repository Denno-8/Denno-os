from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from app.models.sqlalchemy_models import Note


class NoteRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> Note:
        """Create a new note."""
        note = Note(**data)
        self.session.add(note)
        await self.session.flush()
        return note

    async def list_for_user(self, user_id: int, tag: str | None = None, q: str | None = None) -> list[Note]:
        """List notes for a user, optionally filtered by tag or search query."""
        query = select(Note).where(Note.user_id == user_id)
        
        if tag and tag != "All":
            # Filter by tag in ARRAY column
            query = query.where(Note.tags.contains([tag]))
        
        if q:
            # Simple search in title and body
            query = query.where(
                or_(
                    Note.title.ilike(f"%{q}%"),
                    Note.body.ilike(f"%{q}%")
                )
            )
        
        query = query.order_by(Note.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get(self, note_id: int, user_id: int) -> Note | None:
        """Fetch note by ID, scoped to user."""
        result = await self.session.execute(
            select(Note).where((Note.id == note_id) & (Note.user_id == user_id))
        )
        return result.scalars().first()

    async def update(self, note_id: int, user_id: int, data: dict) -> Note | None:
        """Update note fields."""
        note = await self.get(note_id, user_id)
        if note:
            for key, value in data.items():
                if hasattr(note, key) and key not in ("id", "created_at", "user_id"):
                    setattr(note, key, value)
            note.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return note

    async def delete(self, note_id: int, user_id: int) -> bool:
        """Delete note by ID, scoped to user."""
        note = await self.get(note_id, user_id)
        if note:
            await self.session.delete(note)
            await self.session.flush()
            return True
        return False

    async def tags(self, user_id: int) -> list[str]:
        """Get all unique tags for a user's notes. Works on both SQLite and PostgreSQL."""
        # Fetch all tag arrays as raw values, then flatten in Python
        # (avoids PostgreSQL-only unnest() which breaks SQLite dev fallback)
        result = await self.session.execute(
            select(Note.tags).where(Note.user_id == user_id)
        )
        rows = result.scalars().all()
        seen: set[str] = set()
        unique: list[str] = []
        for row in rows:
            tags_val = row or []
            # row may be a list (PG ARRAY) or a JSON list (SQLite JSON fallback)
            if isinstance(tags_val, str):
                import json as _json
                try:
                    tags_val = _json.loads(tags_val)
                except Exception:
                    tags_val = []
            for tag in tags_val:
                if tag and tag not in seen:
                    seen.add(tag)
                    unique.append(tag)
        return sorted(unique)

    async def categories(self, user_id: int) -> list[str]:
        """Alias for tags() — note_service calls this to fetch available note categories."""
        return await self.tags(user_id)

