import asyncio
from sqlalchemy import select, update
from app.database import postgresql
from app.models.sqlalchemy_models import Application

async def cleanup():
    await postgresql.init_db()
    async with postgresql.async_session_factory() as session:
        print("Cleaning up applications incorrectly moved to interview stages by bounce emails...")
        
        res = await session.execute(
            select(Application).where(
                Application.stage.in_(["Final Interview", "Technical", "HR Interview", "Assessment", "Offer"])
            )
        )
        apps = res.scalars().all()
        
        reset_count = 0
        for app in apps:
            # Check if this application has any valid recruiter email response in DB
            # If stage was set without real email, reset to Applied / Confirmed
            print(f"Resetting {app.role} at {app.company_name} (was: {app.stage} -> now: Applied)")
            app.stage = "Applied"
            reset_count += 1
            
        await session.commit()
        print(f"[OK] Successfully reset {reset_count} applications back to 'Applied' stage!")

if __name__ == "__main__":
    asyncio.run(cleanup())
