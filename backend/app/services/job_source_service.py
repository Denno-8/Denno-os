import random
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.job_source_repository import JobSourceRepository
from app.schemas.job_source import JobSourceCreate
from app.services.real_job_fetcher import RealJobFetcher


def _serialize(source) -> dict:
    return {
        "id": str(source.id),
        "company_id": str(source.company_id) if source.company_id is not None else "",
        "company_name": source.company_name,
        "url": source.url,
        "scrape_method": source.scrape_method,
        "status": source.status,
        "jobs_found": source.jobs_found,
        "last_checked_at": source.last_checked_at,
        "created_at": source.created_at,
    }


class JobSourceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = JobSourceRepository(db)
        self.fetcher = RealJobFetcher(db)

    async def create(self, payload: JobSourceCreate) -> dict:
        doc = payload.model_dump()
        doc["company_id"] = int(doc["company_id"])
        created = await self.repo.create(doc)
        return _serialize(created)

    async def list(self, status: str | None) -> list[dict]:
        sources = await self.repo.list(status)
        return [_serialize(source) for source in sources]

    async def sync_all_real_jobs(self) -> dict:
        """Fetch and sync real live jobs from CampusBizz, Remotive, Arbeitnow, and company career sources."""
        return await self.fetcher.fetch_and_sync_all()

    async def verify(self, source_id: int) -> dict | None:
        source = await self.repo.get(source_id)
        if not source:
            return None

        status_str = "recent"
        jobs_found = source.jobs_found or 0

        # Trigger real job fetch for CampusBizz, Jobs Opened Kenya, or general feeds
        if "campusbizz" in source.company_name.lower() or "campusbizz" in source.url.lower():
            cb_res = await self.fetcher.fetch_campusbizz_jobs()
            jobs_found = cb_res.get("added", 0) + source.jobs_found
            status_str = "verified"
        elif "jobsopened" in source.company_name.lower() or "jobsopened" in source.url.lower() or "kenya" in source.company_name.lower():
            jk_res = await self.fetcher.fetch_jobs_opened_kenya()
            jobs_found = jk_res.get("added", 0) + source.jobs_found
            status_str = "verified"
        elif source.url and source.url.startswith("http"):
            try:
                import httpx, re
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                async with httpx.AsyncClient(timeout=6.0, follow_redirects=True, headers=headers) as client:
                    resp = await client.get(source.url)
                    if resp.status_code == 200:
                        status_str = "verified"
                        html_text = resp.text
                        matches = len(re.findall(r'\b(job|position|career|opening|vacancy)\b', html_text, re.IGNORECASE))
                        jobs_found = max(1, min(100, matches // 15))
                    else:
                        status_str = "expired"
            except Exception:
                status_str = "recent"
        else:
            status_str = "verified"

        updated = await self.repo.mark_checked(source_id, status_str, jobs_found)
        return _serialize(updated) if updated else None

    async def delete(self, source_id: int) -> bool:
        return await self.repo.delete(source_id)

