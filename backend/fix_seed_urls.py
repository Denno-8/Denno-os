"""
Fixes invalid or broken seeded source_urls in the SQLite database by updating them
to the actual company career portal URLs or verified search links.
"""
import asyncio
from sqlalchemy import select
from app.database.postgresql import init_db
from app.models.sqlalchemy_models import Job, Company

COMPANY_CAREER_URLS = {
    "Safaricom PLC": "https://www.safaricom.co.ke/careers",
    "Microsoft ADC": "https://careers.microsoft.com",
    "Google Africa Center": "https://careers.google.com/locations/nairobi",
    "M-KOPA": "https://m-kopa.com/careers",
    "Andela": "https://andela.com/careers",
    "Equity Bank Group": "https://equitygroupholdings.com/careers",
    "Cellulant": "https://www.cellulant.io/careers",
    "Flutterwave": "https://flutterwave.com/careers",
    "Twiga Foods": "https://twiga.com/careers",
    "Kopo Kopo Inc": "https://kopokopo.co.ke/careers",
    "AZA Finance": "https://azafinance.com/careers",
    "Craft Silicon": "https://www.craftsilicon.com/careers",
    "Vercel": "https://vercel.com/careers",
    "Stripe": "https://stripe.com/jobs",
    "GitLab": "https://about.gitlab.com/jobs",
    "Notion": "https://www.notion.so/careers",
    "Linear": "https://linear.app/careers",
    "Shopify": "https://www.shopify.com/careers",
    "Cloudflare": "https://www.cloudflare.com/careers",
    "HashiCorp": "https://www.hashicorp.com/jobs",
    "Interswitch Group": "https://www.interswitchgroup.com/careers",
    "BRCK Inc": "https://www.brck.com/careers",
    "Apollo Agriculture": "https://apolloagriculture.com/careers",
    "Nairobi Garage": "https://nairobigarage.com/jobs",
}

async def fix_urls():
    await init_db()
    from app.database.postgresql import async_session_factory
    async with async_session_factory() as session:
        jobs_res = await session.execute(select(Job))
        jobs = jobs_res.scalars().all()

        updated = 0
        for j in jobs:
            url = j.source_url or ""
            # If URL is broken/fake (e.g. contains careers.microsoftadc.com or invalid slug)
            if "microsoftadc" in url or "careers." in url or not url.startswith("http"):
                cname = j.company_name
                new_url = COMPANY_CAREER_URLS.get(cname)
                if not new_url:
                    # Look up in Company table
                    c_res = await session.execute(select(Company).where(Company.name == cname))
                    comp = c_res.scalars().first()
                    if comp and comp.career_url:
                        new_url = comp.career_url
                    else:
                        new_url = f"https://www.google.com/search?q={cname.replace(' ', '+')}+careers"
                
                if j.source_url != new_url:
                    j.source_url = new_url
                    updated += 1

        await session.commit()
        print(f"Successfully updated {updated} jobs with real, working career portal URLs.")

if __name__ == "__main__":
    asyncio.run(fix_urls())
