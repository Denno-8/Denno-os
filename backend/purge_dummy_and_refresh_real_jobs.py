import asyncio
import re
from sqlalchemy import select, delete, update, or_
from app.database import postgresql
from app.models.sqlalchemy_models import Job, Company
from app.services.real_job_fetcher import RealJobFetcher

async def purge_and_refresh():
    await postgresql.init_db()
    async with postgresql.async_session_factory() as session:
        print("1. Purging dummy test companies and jobs...")
        
        # Purge dummy companies like Acme, TestCorp, FakeTech
        dummy_companies = ["Acme Corp", "TestCorp", "FakeTech", "Dummy Company", "Example Corp"]
        for dname in dummy_companies:
            await session.execute(delete(Job).where(Job.company_name.ilike(f"%{dname}%")))
            await session.execute(delete(Company).where(Company.name.ilike(f"%{dname}%")))

        # Purge jobs with placeholder emails like recruiter@acme.com or careers@company.com
        await session.execute(
            delete(Job).where(
                or_(
                    Job.contact_email.ilike("%acme.com%"),
                    Job.contact_email.ilike("%example.com%"),
                    Job.contact_email.ilike("%testcorp.com%"),
                )
            )
        )
        await session.commit()
        print("[OK] Purged dummy test jobs and companies!")

        print("\n2. Sanitizing contact_email for portal-based jobs...")
        # For jobs with valid source_url web portals, clear contact_email if it was auto-generated
        # so candidates use the official web portal application studio.
        res = await session.execute(select(Job))
        jobs = res.scalars().all()
        cleared = 0
        for j in jobs:
            if j.source_url and j.source_url.startswith("http"):
                # If contact_email is fake generated careers@...
                if j.contact_email and ("careers@" in j.contact_email or "security@" in j.contact_email):
                    # Check if domain has no custom MX or is auto-slugged
                    slug_cname = re.sub(r'[^a-z0-9]', '', j.company_name.lower())
                    if slug_cname in j.contact_email:
                        j.contact_email = ""
                        cleared += 1

        await session.commit()
        print(f"[OK] Cleared {cleared} auto-generated fallback emails for web portal jobs!")

        print("\n3. Ingesting fresh live jobs from real APIs (Remotive, Arbeitnow, CampusBizz, Jobs Opened Kenya)...")
        fetcher = RealJobFetcher(session)
        sync_res = await fetcher.fetch_and_sync_all()
        print("[OK] Real job sync completed:", sync_res)

        # Print summary of live jobs in database
        res_all = await session.execute(select(Job).where(Job.is_expired == False))
        active_jobs = res_all.scalars().all()
        print(f"\n[OK] Total Active Real Live Jobs in System Database: {len(active_jobs)}")
        for j in active_jobs[:10]:
            print(f"  • [{j.mode}] {j.title} at {j.company_name} (Portal: {j.source_url or 'N/A'})")

if __name__ == "__main__":
    asyncio.run(purge_and_refresh())
