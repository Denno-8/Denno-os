from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_
from app.models.sqlalchemy_models import Company


class CompanyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> Company:
        """Create a new company."""
        company = Company(**data)
        self.session.add(company)
        await self.session.flush()
        return company

    async def get(self, company_id: int) -> Company | None:
        """Fetch company by ID."""
        return await self.session.get(Company, company_id)

    async def list(
        self,
        q: str | None = None,
        sector: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Company]:
        """List companies with optional filters."""
        query = select(Company)
        
        if sector and sector != "All":
            query = query.where(Company.sector == sector)
        
        if q:
            # Simple name/location search (PostgreSQL doesn't have $text like Mongo)
            query = query.where(
                or_(
                    Company.name.ilike(f"%{q}%"),
                    Company.location.ilike(f"%{q}%")
                )
            )
        
        query = query.order_by(Company.open_roles_count.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def sectors(self) -> list[str]:
        """Get list of unique sectors."""
        result = await self.session.execute(
            select(Company.sector).distinct()
        )
        return [row[0] for row in result.all() if row[0]]

    async def update(self, company_id: int, data: dict) -> Company | None:
        """Update company fields."""
        company = await self.get(company_id)
        if company:
            for key, value in data.items():
                if hasattr(company, key) and key not in ("id", "created_at"):
                    setattr(company, key, value)
            company.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return company

    async def delete(self, company_id: int) -> bool:
        """Delete a company by ID."""
        company = await self.get(company_id)
        if company:
            await self.session.delete(company)
            await self.session.flush()
            return True
        return False

    async def bulk_upsert_by_name(self, docs: list[dict]) -> int:
        """Idempotent upsert by company name (used by seed scripts)."""
        count = 0
        now = datetime.now(timezone.utc)
        
        for doc in docs:
            # Check if company already exists by name
            existing = await self.session.execute(
                select(Company).where(Company.name == doc.get("name"))
            )
            company = existing.scalars().first()
            
            if company:
                # Update existing
                for key, value in doc.items():
                    if key not in ("id", "created_at"):
                        setattr(company, key, value)
                company.updated_at = now
                count += 1
            else:
                # Create new
                doc["created_at"] = now
                doc["updated_at"] = now
                company = Company(**doc)
                self.session.add(company)
                count += 1
        
        await self.session.flush()
        return count
