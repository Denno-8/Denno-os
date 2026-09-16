import logging
import re
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.job_source_repository import JobSourceRepository
from app.schemas.job_source import JobSourceCreate

logger = logging.getLogger("denno.services.job_source_service")


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

    def _get_fetcher(self):
        from app.services.real_job_fetcher import RealJobFetcher
        return RealJobFetcher(self.db)

    def _get_aggregator(self):
        from app.services.real_job_aggregator import RealJobAggregatorService
        return RealJobAggregatorService(self.db)

    async def create(self, payload: JobSourceCreate) -> dict:
        doc = payload.model_dump()
        doc["company_id"] = int(doc["company_id"])
        created = await self.repo.create(doc)
        return _serialize(created)

    async def list(self, status: str | None) -> list[dict]:
        sources = await self.repo.list(status)
        return [_serialize(source) for source in sources]

    async def update(self, source_id: int, data: dict) -> dict | None:
        updated = await self.repo.update(source_id, data)
        return _serialize(updated) if updated else None

    async def sync_all_real_jobs(self) -> dict:
        """Fetch and sync real live jobs from all sources including Remotive, Arbeitnow, CampusBizz, and aggregator."""
        fetcher = self._get_fetcher()
        return await fetcher.fetch_and_sync_all()

    async def verify(self, source_id: int) -> dict | None:
        """
        Verify a specific job source by triggering its live scraper.
        Routes to the correct fetcher based on source type.
        """
        source = await self.repo.get(source_id)
        if not source:
            return None

        status_str = "verified"
        jobs_found = source.jobs_found or 0
        name_lower = (source.company_name or "").lower()
        url_lower = (source.url or "").lower()
        method_lower = (source.scrape_method or "").lower()

        try:
            fetcher = self._get_fetcher()
            aggregator = self._get_aggregator()

            if "campusbizz" in name_lower or "campusbizz" in url_lower:
                # CampusBizz: fetcher has a dedicated method
                result = await fetcher.fetch_campusbizz_jobs()
                jobs_found = max(jobs_found, result.get("added", 0) + result.get("skipped", 0))
                status_str = "verified"

            elif "jobsopened" in name_lower or "jobsopened" in url_lower or "kenya" in name_lower:
                # Jobs Opened Kenya: fetcher has dedicated method
                result = await fetcher.fetch_jobs_opened_kenya()
                jobs_found = max(jobs_found, result.get("added", 0) + result.get("skipped", 0))
                status_str = "verified"

            elif "remotive" in method_lower or "remotive" in url_lower or "remotive" in name_lower:
                # Remotive: fetcher has dedicated method
                result = await fetcher.fetch_remotive_jobs(limit=25)
                jobs_found = max(jobs_found, result.get("added", 0) + result.get("skipped", 0))
                status_str = "verified"

            elif "arbeitnow" in method_lower or "arbeitnow" in url_lower or "arbeitnow" in name_lower:
                # Arbeitnow: fetcher has dedicated method
                result = await fetcher.fetch_arbeitnow_jobs(limit=25)
                jobs_found = max(jobs_found, result.get("added", 0) + result.get("skipped", 0))
                status_str = "verified"

            elif any(k in method_lower or k in url_lower for k in ["greenhouse", "lever", "workday", "ashby", "smartrecruiters"]):
                # ATS platform: use the aggregator sync (it covers Greenhouse, Ashby, etc.)
                agg_result = await aggregator.sync_all_live_jobs(force=True)
                jobs_found = max(jobs_found, agg_result.get("added_count", 0))
                status_str = "verified"

            elif source.url and source.url.startswith("http"):
                # Generic HTTP URL: attempt a live HTTP check
                import httpx
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                }
                async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers) as client:
                    resp = await client.get(source.url)
                    if resp.status_code == 200:
                        status_str = "verified"
                        text = resp.text
                        # Count job-related keyword occurrences as a rough jobs_found estimate
                        matches = len(re.findall(
                            r'\b(job|position|career|opening|vacancy|hiring|role|opportunity|recruitment)\b',
                            text, re.IGNORECASE
                        ))
                        jobs_found = max(1, min(200, matches // 6))
                    elif resp.status_code in (404, 410):
                        status_str = "expired"
                    else:
                        status_str = "recent"
            else:
                status_str = "verified"

        except Exception as exc:
            logger.warning("verify(%s) error – marking as recent: %s", source_id, exc)
            status_str = "recent"

        updated = await self.repo.mark_checked(source_id, status_str, jobs_found)
        return _serialize(updated) if updated else None

    async def delete(self, source_id: int) -> bool:
        return await self.repo.delete(source_id)
