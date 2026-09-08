import asyncio
from sqlalchemy import select, func
from app.database.postgresql import init_db
from app.models.sqlalchemy_models import Job

async def check():
    await init_db()
    from app.database.postgresql import async_session_factory
    async with async_session_factory() as session:
        total = (await session.execute(select(func.count(Job.id)))).scalar()
        intern_entry = (await session.execute(select(func.count(Job.id)).where(Job.level.in_(["Intern", "Entry"])))).scalar()
        valid_http = (await session.execute(select(func.count(Job.id)).where(Job.source_url.like("http%")))).scalar()
        print(f"Total jobs: {total} | Valid HTTP URLs: {valid_http} | Intern/Entry jobs: {intern_entry}")

if __name__ == "__main__":
    asyncio.run(check())
