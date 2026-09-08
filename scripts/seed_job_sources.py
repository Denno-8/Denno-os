"""
Populates the `job_sources` collection with one entry per already-seeded
company — derives scrape_method from ats_platform and gives each a
plausible starting verification status. Run seed_companies.py first.

Usage:
    python scripts/seed_job_sources.py
"""
import asyncio
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402
from app.core.config import settings  # noqa: E402

ATS_TO_SCRAPE_METHOD = {
    "Workday": "api",
    "Greenhouse": "api",
    "Lever": "api",
    "SmartRecruiters": "api",
    "Google Hire": "api",
    "Oracle Taleo": "html_scrape",
    "SuccessFactors": "html_scrape",
    "BambooHR": "api",
    "IBM Kenexa": "html_scrape",
    "Inspira": "html_scrape",
    "Taleo": "html_scrape",
}


async def seed() -> None:
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db_name]

    companies = [doc async for doc in db.companies.find({})]
    if not companies:
        print("No companies found — run seed_companies.py first.")
        client.close()
        return

    docs = []
    for co in companies:
        ats = co.get("ats_platform", "Internal")
        method = ATS_TO_SCRAPE_METHOD.get(ats, "manual")
        status = random.choices(
            ["verified", "recent", "expired", "archived"],
            weights=[55, 30, 10, 5],
        )[0]
        docs.append({
            "company_id": co["_id"],
            "company_name": co["name"],
            "url": co.get("career_url", ""),
            "scrape_method": method,
            "status": status,
            "jobs_found": co.get("open_roles_count", 0),
        })

    from app.repositories.job_source_repository import JobSourceRepository
    repo = JobSourceRepository(db)
    written = await repo.bulk_upsert_by_company(docs)
    print(f"Seeded/updated {written} of {len(docs)} job sources.")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
