import asyncio
from sqlalchemy import select, delete
from app.database import postgresql
from app.models.sqlalchemy_models import Email, Application

async def purge_synthetic():
    await postgresql.init_db()
    async with postgresql.async_session_factory() as session:
        print("1. Purging synthetic test email records from emails table...")
        
        # Delete synthetic test email records created during test runs
        res = await session.execute(
            delete(Email).where(
                (Email.source == "gmail_sync") | 
                (Email.from_name.ilike("%Talent Acquisition%")) |
                (Email.from_name.ilike("%Engineering Lead%"))
            )
        )
        await session.commit()
        print("[OK] Purged synthetic test email records!")

        print("\n2. Resetting all application stages back to 'Applied' stage...")
        res_apps = await session.execute(select(Application))
        apps = res_apps.scalars().all()
        
        for app in apps:
            print(f"  • Resetting {app.role} at {app.company_name} (was: {app.stage} -> now: Applied)")
            app.stage = "Applied"
            
        await session.commit()
        print("[OK] Successfully reset all applications to 'Applied' stage!")

if __name__ == "__main__":
    asyncio.run(purge_synthetic())
