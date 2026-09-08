"""
Purges dummy/mock seeded jobs from the database and runs the RealJobAggregatorService
to populate the feed strictly with 100% authentic, live job postings with verified URLs.
"""
import asyncio
from sqlalchemy import select, delete
from app.database.postgresql import init_db
from app.models.sqlalchemy_models import Job
from app.services.real_job_aggregator import RealJobAggregatorService

async def purge_and_sync_real_jobs():
    await init_db()
    from app.database.postgresql import async_session_factory
    async with async_session_factory() as session:
        # Delete any dummy/mock jobs with placeholder URLs or missing live URLs
        stmt = select(Job)
        res = await session.execute(stmt)
        all_jobs = res.scalars().all()

        deleted_count = 0
        for job in all_jobs:
            url = job.source_url or ""
            # If source_url is missing, invalid, or fake search link, remove it
            if not url.startswith("http") or "google.com/search" in url or "careers.safaricom.co.ke" in url and job.company_name == "Safaricom PLC" and "M-PESA Cloud" in job.title:
                await session.delete(job)
                deleted_count += 1
        
        await session.commit()
        print(f"Purged {deleted_count} dummy/mock job entries.")

        # Run real-time aggregator sync across 10 live feeds
        print("Fetching authentic real-time live jobs from 10 live endpoints (Kenya + Global)...")
        aggregator = RealJobAggregatorService(session)
        summary = await aggregator.sync_all_live_jobs()
        print(f"Live Sync Complete!")
        print(f"  - Total Real Jobs Fetched: {summary['total_fetched']}")
        print(f"  - New Real Jobs Added:     {summary['added_count']}")
        print(f"  - Refreshed Jobs:          {summary['updated_count']}")
        print(f"  - Intern / Entry Level:    {summary['intern_entry_count']}")

if __name__ == "__main__":
    asyncio.run(purge_and_sync_real_jobs())
