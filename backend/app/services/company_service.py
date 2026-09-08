from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.company_repository import CompanyRepository
from app.schemas.company import CompanyCreate, CompanyUpdate


def _serialize(company) -> dict:
    return {
        "id": str(company.id),
        "name": company.name,
        "sector": company.sector,
        "location": company.location,
        "ats_platform": company.ats_platform,
        "career_url": company.career_url,
        "contact_email": company.contact_email,
        "tech_stack": company.tech_stack or [],
        "open_roles_count": company.open_roles_count,
        "tier": int(company.tier) if isinstance(company.tier, (int, str)) and str(company.tier).isdigit() else company.tier,
        "verification_status": getattr(company, "verification_status", "recent"),
        "created_at": company.created_at,
    }


class CompanyService:
    def __init__(self, db: AsyncSession):
        self.repo = CompanyRepository(db)

    async def create(self, payload: CompanyCreate) -> dict:
        created = await self.repo.create(payload.model_dump())
        return _serialize(created)

    async def get(self, company_id: int) -> dict | None:
        company = await self.repo.get(company_id)
        return _serialize(company) if company else None

    async def list(self, q: str | None, sector: str | None, skip: int, limit: int) -> list[dict]:
        companies = await self.repo.list(q, sector, skip, limit)
        return [_serialize(c) for c in companies]

    async def sectors(self) -> list[str]:
        return sorted(await self.repo.sectors())

    async def update(self, company_id: int, payload: CompanyUpdate) -> dict | None:
        patch = payload.model_dump(exclude_none=True)
        company = await self.repo.update(company_id, patch)
        return _serialize(company) if company else None

    async def delete(self, company_id: int) -> bool:
        return await self.repo.delete(company_id)
