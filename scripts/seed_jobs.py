"""
Populates the `jobs` collection with listings tied to real seeded companies
(via a name -> _id lookup, since Job.company_id is a real Mongo reference,
not a denormalized string). Run seed_companies.py first.

Idempotent-ish: clears jobs whose company_name is in this script's list
before re-inserting, so re-running doesn't pile up duplicates.

Usage:
    python scripts/seed_jobs.py
"""
import asyncio
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402
from app.core.config import settings  # noqa: E402

# (company_name, title, mode, level, employment_type, salary_min, salary_max,
#  required_skills, match_score, ats_score, days_until_deadline, is_hot, description)
JOBS: list[tuple] = [
    ("Safaricom", "Senior SWE - M-Pesa", "Hybrid", "Senior", "Full-time", 280000, 380000,
     ["Java", "Spring Boot", "Kafka", "AWS"], 94, 91, 25, True,
     "Lead M-Pesa next-gen payment infrastructure for 30M+ customers."),
    ("Safaricom", "Cloud Engineer - AWS", "Hybrid", "Mid", "Full-time", 220000, 320000,
     ["AWS", "Terraform", "Kubernetes", "Python"], 87, 84, 20, True,
     "Manage AWS cloud infrastructure for M-Pesa enterprise workloads."),
    ("M-KOPA", "Flutter Mobile Developer", "Remote", "Mid", "Full-time", 180000, 260000,
     ["Flutter", "Dart", "Firebase", "BLoC"], 88, 85, 17, True,
     "Build M-KOPA's Flutter app serving 3M+ users across East Africa."),
    ("Andela", "DevOps / SRE Engineer", "Remote", "Senior", "Contract", 320000, 500000,
     ["Kubernetes", "Terraform", "AWS", "CI/CD"], 82, 79, 27, False,
     "Scale K8s infrastructure for 2,000+ global engineers."),
    ("Microsoft ADC", "AI/ML Engineer", "Hybrid", "Senior", "Full-time", 400000, 600000,
     ["Python", "PyTorch", "Azure ML", "LLMs"], 76, 73, 33, True,
     "Research ML for African languages at Microsoft Africa Development Centre."),
    ("Flutterwave", "Data Engineer - Analytics", "Remote", "Mid", "Full-time", 200000, 300000,
     ["dbt", "Airflow", "BigQuery", "Python"], 85, 82, 15, False,
     "Build ELT pipelines for analytics across 34 African countries."),
    ("Bolt", "Backend Engineer - Node.js", "Remote", "Mid", "Full-time", 200000, 290000,
     ["Node.js", "TypeScript", "PostgreSQL", "Kafka"], 83, 80, 13, True,
     "Build backend for Bolt ride-hailing and food delivery in Nairobi."),
    ("Wasoko", "Full Stack Engineer", "Hybrid", "Junior", "Full-time", 120000, 200000,
     ["React", "Node.js", "PostgreSQL", "Redis"], 80, 77, 11, True,
     "Build the Wasoko B2B platform serving informal retailers across East Africa."),
    ("Sama", "Python Developer - AI", "Onsite", "Mid", "Full-time", 150000, 220000,
     ["Python", "TensorFlow", "CVAT", "AWS"], 78, 75, 9, True,
     "Build AI training data pipelines supporting Fortune 500 companies."),
    ("Glovo Kenya", "React Native Developer", "Remote", "Mid", "Full-time", 160000, 260000,
     ["React Native", "TypeScript", "Redux", "REST APIs"], 82, 79, 15, True,
     "Build Glovo customer and courier mobile apps for the Nairobi market."),
    ("CloudFactory Kenya", "Platform Engineer - K8s", "Remote", "Senior", "Full-time", 280000, 420000,
     ["Kubernetes", "Terraform", "AWS", "Python"], 84, 81, 12, True,
     "Build Kubernetes infrastructure for AI annotation workloads."),
    ("Branch International", "Backend Engineer - Kotlin", "Hybrid", "Mid", "Full-time", 200000, 300000,
     ["Kotlin", "Python", "Go", "AWS"], 79, 76, 18, False,
     "Build backend lending infrastructure serving millions of borrowers."),
    ("Tala", "Mobile Engineer - Android", "Hybrid", "Mid", "Full-time", 190000, 290000,
     ["Kotlin", "Java", "Android", "REST APIs"], 77, 74, 21, False,
     "Build Tala's Android lending app used across emerging markets."),
    ("Chipper Cash", "Backend Engineer - Go", "Remote", "Senior", "Full-time", 300000, 450000,
     ["Go", "PostgreSQL", "AWS", "gRPC"], 81, 78, 19, True,
     "Build cross-border payment rails across African markets."),
    ("Turaco", "Full Stack Engineer - InsurTech", "Hybrid", "Mid", "Full-time", 170000, 260000,
     ["Python", "React", "PostgreSQL", "AWS"], 76, 73, 16, False,
     "Build embedded micro-insurance products for underserved markets."),
    ("Uber Kenya", "Backend Engineer - Marketplace", "Hybrid", "Senior", "Full-time", 350000, 550000,
     ["Go", "Python", "Kafka", "PostgreSQL"], 80, 77, 23, True,
     "Build marketplace matching systems for the Nairobi mobility platform."),
    ("GitLab", "Backend Engineer - Remote", "Remote", "Senior", "Full-time", 0, 0,
     ["Go", "Ruby", "Kubernetes", "PostgreSQL"], 74, 71, 30, False,
     "Fully remote role on GitLab's core platform team (USD-denominated, global band)."),
    ("Turing", "Full Stack Developer - US Client", "Remote", "Mid", "Contract", 0, 0,
     ["React", "Node.js", "Python", "AWS"], 72, 69, 14, False,
     "Matched with a US-based client team via Turing's remote talent network."),

    # ── 15 more jobs (batch 2), tied to newly seeded companies ──
    ("Ilara Health", "Full Stack Engineer - Diagnostics", "Hybrid", "Mid", "Full-time", 170000, 260000,
     ["Python", "React", "PostgreSQL", "IoT"], 78, 75, 16, True,
     "Build software connecting low-cost diagnostic devices to primary care clinics."),
    ("LipaLater", "Backend Engineer - BNPL", "Hybrid", "Mid", "Full-time", 190000, 280000,
     ["Python", "Django", "PostgreSQL", "AWS"], 79, 76, 14, True,
     "Build buy-now-pay-later checkout and credit risk infrastructure."),
    ("Kwara", "Frontend Engineer - React", "Remote", "Mid", "Full-time", 180000, 270000,
     ["TypeScript", "React", "Node.js"], 80, 77, 12, True,
     "Build the member-facing web app for SACCO banking software used across Africa."),
    ("Ajua", "NLP Engineer - Customer Insights", "Hybrid", "Senior", "Full-time", 250000, 380000,
     ["Python", "NLP", "TensorFlow", "AWS"], 77, 74, 20, False,
     "Build sentiment analysis and customer-feedback NLP pipelines for enterprise clients."),
    ("Amitruck", "Mobile Engineer - React Native", "Hybrid", "Mid", "Full-time", 170000, 260000,
     ["React Native", "Python", "GIS", "AWS"], 76, 73, 15, False,
     "Build driver and shipper apps for East Africa's on-demand trucking marketplace."),
    ("Diamond Trust Bank", "Core Banking Developer", "Hybrid", "Mid", "Full-time", 150000, 240000,
     ["Java", "Oracle", "Temenos T24", "SQL"], 70, 67, 22, False,
     "Maintain and extend DTB's core banking platform across 5 East African markets."),
    ("Kenya Revenue Authority", "Cybersecurity Analyst", "Onsite", "Mid", "Full-time", 140000, 210000,
     ["SIEM", "Cybersecurity", "Oracle", "Linux"], 68, 65, 19, False,
     "Secure KRA's tax collection and iTax systems against fraud and intrusion."),
    ("Konza Technopolis", "Smart City Systems Engineer", "Onsite", "Senior", "Full-time", 220000, 340000,
     ["Networking", "IoT", "GIS", "Python"], 71, 68, 28, False,
     "Design smart-city sensor and connectivity infrastructure for Konza Technopolis."),
    ("BRCK", "Embedded Systems Engineer", "Hybrid", "Mid", "Full-time", 180000, 270000,
     ["Embedded C", "IoT", "Linux", "Python"], 75, 72, 17, True,
     "Build connectivity hardware and firmware for BRCK's rugged internet devices."),
    ("Ushahidi", "Full Stack Engineer - Civic Tech", "Remote", "Mid", "Full-time", 160000, 250000,
     ["PHP", "React", "PostgreSQL"], 74, 71, 13, False,
     "Build open-source crowdsourcing and crisis-mapping tools used worldwide."),
    ("Amref Health Africa", "Health Data Analyst", "Hybrid", "Mid", "Full-time", 130000, 210000,
     ["PowerBI", "Python", "DHIS2", "SQL"], 66, 63, 24, False,
     "Analyse public health program data across Amref's East Africa operations."),
    ("Living Goods", "Mobile Developer - Community Health", "Hybrid", "Mid", "Full-time", 140000, 220000,
     ["Android", "Python", "PostgreSQL"], 69, 66, 21, False,
     "Build the Android app used by community health workers across Kenya and Uganda."),
    ("Copia Global", "Backend Engineer - E-commerce", "Hybrid", "Mid", "Full-time", 170000, 260000,
     ["Python", "PostgreSQL", "AWS", "Django"], 78, 75, 15, True,
     "Build order and fulfillment systems for last-mile e-commerce across Kenya."),
    ("SunCulture", "IoT Engineer - Solar Irrigation", "Hybrid", "Mid", "Full-time", 170000, 260000,
     ["Python", "IoT", "Embedded C", "React"], 75, 72, 18, False,
     "Build IoT monitoring for solar-powered irrigation systems used by smallholder farmers."),
    ("Stanbic Bank Kenya", "Cloud Engineer - Azure", "Hybrid", "Senior", "Full-time", 260000, 400000,
     ["Azure", "Java", "React", "Terraform"], 79, 76, 20, True,
     "Migrate Stanbic Kenya's core digital banking workloads onto Azure."),

     # ── 15 newly added Kenyan Tech Jobs (batch 3) ──
     ("Workpay Kenya", "Senior Full Stack Engineer (Python & React)", "Hybrid", "Senior", "Full-time", 320000, 480000,
      ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "AWS"], 93, 90, 28, True,
      "Build Workpay's pan-African payroll processing engine and multi-currency employee benefits API."),
     ("Safaricom", "Principal M-PESA API Architect", "Hybrid", "Senior", "Full-time", 450000, 750000,
      ["Java", "Spring Boot", "Kafka", "AWS", "OAuth2", "ISO8583"], 96, 94, 30, True,
      "Lead M-PESA next-generation open API platform processing 30M+ daily financial transactions across Africa."),
     ("NCBA Bank", "Senior Cloud DevOps & Site Reliability Engineer", "Hybrid", "Senior", "Full-time", 380000, 580000,
      ["AWS", "Docker", "Kubernetes", "Terraform", "Python", "CI/CD"], 91, 88, 25, True,
      "Manage NCBA Loop digital banking cloud infrastructure, Kubernetes clusters, and automated deployment pipelines."),
     ("Pezesha", "Fintech Credit Risk AI & Data Scientist", "Remote", "Senior", "Full-time", 350000, 550000,
      ["Python", "Machine Learning", "pandas", "PostgreSQL", "XGBoost"], 89, 86, 22, True,
      "Develop automated credit scoring algorithms and alternative data telemetry models for MSME lending in Kenya."),
     ("MyDawa", "HealthTech Mobile Engineer", "Remote", "Mid", "Full-time", 200000, 320000,
      ["React Native", "TypeScript", "Node.js", "PostgreSQL", "Redux"], 86, 83, 19, True,
      "Build MyDawa's e-pharmacy and tele-consultation mobile apps serving millions of health consumers in Kenya."),
     ("SunKing Kenya", "Data Engineering & Analytics Lead", "Hybrid", "Lead", "Full-time", 400000, 620000,
      ["Python", "dbt", "BigQuery", "SQL", "Airflow", "GCP"], 92, 89, 31, True,
      "Lead data platform architecture, IoT device analytics pipelines, and business intelligence for SunKing solar energy across East Africa."),
     ("Little Cab", "Backend Systems & Fleet Engineer", "Hybrid", "Mid", "Full-time", 240000, 380000,
      ["Go", "Node.js", "PostgreSQL", "Redis", "Kafka", "AWS"], 85, 82, 16, True,
      "Build real-time dispatch matching algorithms, driver wallet payouts, and location telemetry APIs for Little Cab."),
     ("Zanifu", "Junior Frontend Developer (React & TypeScript)", "Remote", "Junior", "Full-time", 140000, 220000,
      ["React", "TypeScript", "TailwindCSS", "REST APIs", "Git"], 82, 79, 14, True,
      "Develop responsive merchant portal features and inventory financing dashboards for small business retailers in Kenya."),
     ("Roam Electric", "EV Firmware & Embedded Systems Engineer", "Onsite", "Mid", "Full-time", 220000, 350000,
      ["Embedded C", "C++", "Linux", "IoT", "CAN Bus", "Python"], 88, 85, 27, True,
      "Design electric vehicle telemetry firmware, battery management software, and IoT connectivity for Roam Electric buses in Nairobi."),
     ("Cellulant", "Lead Payment Security & Compliance Engineer", "Hybrid", "Lead", "Full-time", 420000, 650000,
      ["Cybersecurity", "Java", "PCI-DSS", "SIEM", "OAuth2", "Linux"], 90, 87, 24, True,
      "Architect PCI-DSS compliant security controls, vulnerability management, and threat prevention for Tingg payment gateway."),
     ("Equity Bank", "Senior Data Warehouse & BI Developer", "Onsite", "Senior", "Full-time", 320000, 500000,
      ["Oracle", "PL/SQL", "PowerBI", "Python", "ETL"], 84, 81, 21, False,
      "Architect Equity Group's enterprise data warehouse and executive reporting dashboards across 6 subsidiaries."),
     ("Shortlist Kenya", "Tech Talent & Developer Ecosystem Lead", "Hybrid", "Senior", "Full-time", 300000, 450000,
      ["Python", "Data Analysis", "React", "Tech Talent"], 83, 80, 18, False,
      "Lead senior tech talent recruitment, developer skill assessments, and engineering placements for top African tech scale-ups."),
     ("Access Afya", "HealthTech Full Stack Developer", "Hybrid", "Mid", "Full-time", 180000, 280000,
      ["Python", "React", "PostgreSQL", "REST APIs"], 81, 78, 15, False,
      "Build digital health clinic management systems and patient electronic medical record tools for low-income urban communities."),
     ("KCB Group", "Cybersecurity Threat Intelligence Analyst", "Onsite", "Senior", "Full-time", 320000, 500000,
      ["Cybersecurity", "SIEM", "Pentesting", "Linux", "Network Security"], 87, 84, 23, True,
      "Perform threat hunting, SOC monitoring, and vulnerability assessments across KCB Group's digital banking channels."),
     ("Wasoko", "Senior DevOps & Cloud Engineer", "Hybrid", "Senior", "Full-time", 360000, 540000,
      ["AWS", "Terraform", "Kubernetes", "Python", "Docker", "CI/CD"], 92, 89, 29, True,
      "Manage cloud infrastructure, container orchestration, and automated deployment pipelines for Wasoko e-commerce across Africa."),
]


async def seed() -> None:
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db_name]

    company_ids = {
        doc["name"]: doc["_id"]
        async for doc in db.companies.find({}, {"name": 1})
    }

    missing = [name for name, *_ in JOBS if name not in company_ids]
    if missing:
        print(f"WARNING: {len(missing)} companies not found — run seed_companies.py first: {missing}")

    docs = []
    today = date.today()
    for (name, title, mode, level, etype, smin, smax, skills, match, ats,
         days_out, hot, desc) in JOBS:
        if name not in company_ids:
            continue
        docs.append({
            "company_id": company_ids[name],
            "company_name": name,
            "title": title,
            "mode": mode,
            "level": level,
            "employment_type": etype,
            "salary_min": smin,
            "salary_max": smax,
            "currency": "KES",
            "required_skills": skills,
            "match_score": match,
            "ats_score": ats,
            "deadline": today + timedelta(days=days_out),
            "source_url": "",
            "contact_email": "",
            "is_hot": hot,
            "description": desc,
        })

    # Clear previously seeded jobs for these companies so re-running doesn't duplicate.
    seeded_names = list({d["company_name"] for d in docs})
    if seeded_names:
        deleted = await db.jobs.delete_many({"company_name": {"$in": seeded_names}, "source_url": ""})
        print(f"Cleared {deleted.deleted_count} previously-seeded jobs.")

    if docs:
        from app.repositories.job_repository import JobRepository
        repo = JobRepository(db)
        inserted = await repo.bulk_insert(docs)
        print(f"Inserted {inserted} jobs across {len(seeded_names)} companies.")
    else:
        print("Nothing to insert — did seed_companies.py run successfully?")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
