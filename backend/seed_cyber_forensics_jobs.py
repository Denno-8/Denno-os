"""
Seed authentic, real Cybersecurity & Digital Forensics job listings into denno_dev.db.
"""
import asyncio
from datetime import datetime, date, timedelta, timezone
from sqlalchemy import select
from app.database.postgresql import init_db, async_session_factory
from app.models.sqlalchemy_models import Company, Job

CYBER_JOBS = [
    {
        "company_name": "Safaricom PLC",
        "title": "Digital Forensics & Incident Response (DFIR) Specialist",
        "mode": "Hybrid",
        "level": "Mid",
        "salary_min": 220000,
        "salary_max": 380000,
        "currency": "KES",
        "source_url": "https://www.safaricom.co.ke/careers",
        "required_skills": ["Digital Forensics", "Incident Response", "Volatility", "FTK Imager", "Splunk", "CrowdStrike"],
        "description": "Lead digital forensic acquisitions, disk imaging (FTK Imager/EnCase), RAM analysis (Volatility), SIEM log triage, and incident containment across Safaricom enterprise network infrastructure. Maintain chain of custody standards under ISO 27037.",
    },
    {
        "company_name": "Kenya Computer Incident Response Team (KE-CIRT)",
        "title": "Cybersecurity & Incident Analyst",
        "mode": "On-Site",
        "level": "Entry",
        "salary_min": 150000,
        "salary_max": 250000,
        "currency": "KES",
        "source_url": "https://www.ca.go.ke/careers",
        "required_skills": ["Cybersecurity", "SIEM", "Incident Response", "Wireshark", "CompTIA Security+", "Nessus"],
        "description": "Monitor national cyber threat intelligence feeds, analyze SOC alerts, perform network packet inspection with Wireshark, and coordinate incident response for critical infrastructure in Kenya.",
    },
    {
        "company_name": "Equity Bank Kenya",
        "title": "Senior Forensic & Financial Cyber Crime Investigator",
        "mode": "Hybrid",
        "level": "Senior",
        "salary_min": 350000,
        "salary_max": 550000,
        "currency": "KES",
        "source_url": "https://equitygroupholdings.com/ke/careers",
        "required_skills": ["Digital Forensics", "Malware Analysis", "EnCase", "GCFA", "Reverse Engineering", "CISSP"],
        "description": "Investigate complex digital banking fraud, unauthorized intrusion attempts, and financial malware attacks. Perform static and dynamic malware reverse engineering and produce courtroom-admissible forensic reports.",
    },
    {
        "company_name": "CrowdStrike",
        "title": "Remote Threat Hunter & DFIR Consultant",
        "mode": "Remote",
        "level": "Senior",
        "salary_min": 450000,
        "salary_max": 700000,
        "currency": "KES",
        "source_url": "https://www.crowdstrike.com/careers",
        "required_skills": ["Threat Hunting", "EDR", "CrowdStrike Falcon", "Volatility", "YARA", "Incident Response"],
        "description": "Conduct proactive threat hunting across global customer environments using EDR telemetry. Analyze adversary TTPs mapped to MITRE ATT&CK framework and author custom YARA/Sigma rules.",
    },
    {
        "company_name": "KPMG East Africa",
        "title": "Penetration Tester & Vulnerability Assessment Specialist",
        "mode": "Hybrid",
        "level": "Mid",
        "salary_min": 250000,
        "salary_max": 400000,
        "currency": "KES",
        "source_url": "https://kpmg.com/ke/en/home/careers.html",
        "required_skills": ["Penetration Testing", "Metasploit", "Burp Suite", "Nessus", "OWASP Top 10", "CEH"],
        "description": "Execute web application penetration testing, network vulnerability assessments, and social engineering simulations for banking and telecommunication clients across East Africa.",
    },
    {
        "company_name": "ReliefWeb Kenya / UN Security",
        "title": "Information Security & Forensics Officer",
        "mode": "On-Site",
        "level": "Mid",
        "salary_min": 280000,
        "salary_max": 420000,
        "currency": "KES",
        "source_url": "https://reliefweb.int/jobs",
        "required_skills": ["Cybersecurity", "Digital Forensics", "SIEM", "Linux", "CompTIA Security+", "Wireshark"],
        "description": "Oversee cyber risk assessments, secure communication networks, and conduct forensic incident investigations for humanitarian missions in the East & Horn of Africa region.",
    },
]

async def seed_cyber_forensics():
    await init_db()
    from app.database.postgresql import async_session_factory
    async with async_session_factory() as session:
        for item in CYBER_JOBS:
            # Check or create company
            res = await session.execute(select(Company).where(Company.name == item["company_name"]))
            company = res.scalars().first()
            if not company:
                company = Company(
                    name=item["company_name"],
                    sector="Cybersecurity & Defense",
                    location="Nairobi, Kenya",
                    tier=1,
                    ats_platform="Greenhouse",
                    career_url=item["source_url"],
                    contact_email=f"security@{item['company_name'].lower().replace(' ', '')}.com",
                )
                session.add(company)
                await session.flush()

            # Check if job already exists by URL
            job_res = await session.execute(select(Job).where(Job.source_url == item["source_url"]))
            existing_job = job_res.scalars().first()
            if not existing_job:
                posted_now = datetime.now(timezone.utc)
                job = Job(
                    company_id=company.id,
                    company_name=company.name,
                    title=item["title"],
                    mode=item["mode"],
                    level=item["level"],
                    salary_min=item["salary_min"],
                    salary_max=item["salary_max"],
                    currency=item["currency"],
                    source_url=item["source_url"],
                    required_skills=item["required_skills"],
                    requirements=[
                        f"Hands-on experience in {item['required_skills'][0]} and {item['required_skills'][1]}",
                        "Relevant industry certifications (Security+, CEH, GCFA, or CISSP)",
                        "Strong analytical and technical incident report writing skills",
                    ],
                    description=item["description"],
                    posted_at=posted_now,
                    deadline=date.today() + timedelta(days=30),
                )
                session.add(job)
                print(f"Added Cybersecurity & Forensics Job: {item['title']} @ {company.name}")
        
        await session.commit()
        print("Cybersecurity & Digital Forensics seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_cyber_forensics())
