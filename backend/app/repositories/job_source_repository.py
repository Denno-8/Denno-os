from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.sqlalchemy_models import JobSource


class JobSourceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> JobSource:
        """Create a new job source."""
        source = JobSource(**data)
        self.session.add(source)
        await self.session.flush()
        return source

    async def get(self, source_id: int) -> JobSource | None:
        """Fetch job source by ID."""
        return await self.session.get(JobSource, source_id)

    async def list(self, status: str | None = None) -> list[JobSource]:
        """List job sources, optionally filtered by status."""
        query = select(JobSource)

        if status and status != "All":
            query = query.where(JobSource.status == status)

        query = query.order_by(JobSource.updated_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()

    async def bulk_upsert_by_name(self, docs: list[dict]) -> int:
        """Idempotent upsert by source name."""
        count = 0
        now = datetime.now(timezone.utc)

        for doc in docs:
            source_name = doc.get("company_name") or doc.get("name")
            existing = await self.session.execute(
                select(JobSource).where(JobSource.company_name == source_name)
            )
            source = existing.scalars().first()

            if source:
                # Update existing
                for key, value in doc.items():
                    if key not in ("id", "created_at"):
                        setattr(source, key, value)
                source.updated_at = now
                count += 1
            else:
                # Create new
                doc.setdefault("created_at", now)
                doc["updated_at"] = now
                source = JobSource(**doc)
                self.session.add(source)
                count += 1
        
        await self.session.flush()
        return count

    async def update(self, source_id: int, data: dict) -> JobSource | None:
        """Update job source fields."""
        source = await self.get(source_id)
        if source:
            for key, value in data.items():
                if hasattr(source, key) and key not in ("id", "created_at"):
                    setattr(source, key, value)
            source.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return source

    async def delete(self, source_id: int) -> bool:
        """Delete job source by ID."""
        source = await self.get(source_id)
        if source:
            await self.session.delete(source)
            await self.session.flush()
            return True
        return False

    async def mark_checked(self, source_id: int, status: str, jobs_found: int) -> JobSource | None:
        """Update status, jobs_found, and last_checked_at after a verification pass."""
        source = await self.get(source_id)
        if source:
            source.status = status
            source.jobs_found = jobs_found
            source.last_checked_at = datetime.now(timezone.utc)
            source.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return source
