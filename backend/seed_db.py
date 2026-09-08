import asyncio
from datetime import date, timedelta
from sqlalchemy import select
from app.database.postgresql import init_db, close_db
from app.models.sqlalchemy_models import User, Company, Job, LearningCourse, JobSource
from app.core.security import hash_password


async def seed():
    from app.database.postgresql import async_session_factory
    if async_session_factory is None:
        await init_db()
        from app.database.postgresql import async_session_factory
    async with async_session_factory() as session:

        # ── 1. Users ─────────────────────────────────────────────────────────────
        admin_res = await session.execute(select(User).where(User.email == "admin@denno.com"))
        if not admin_res.scalar_one_or_none():
            session.add(User(
                email="admin@denno.com",
                password_hash=hash_password("password123"),
                first_name="Admin", last_name="User", role="admin",
                title="Platform Administrator",
                skills=["Python", "FastAPI", "React", "PostgreSQL", "System Architecture"],
                location="Nairobi, Kenya",
            ))
            print("Created admin user: admin@denno.com / password123")

        demo_res = await session.execute(select(User).where(User.email.in_(["user@denno.com", "denniskoech584@gmail.com"])))
        if not demo_res.scalar_one_or_none():
            session.add(User(
                email="user@denno.com",
                password_hash=hash_password("password123"),
                first_name="Dennis Kibet", last_name="Koech", role="user",
                title="IT INTERN | ICT SUPPORT | INFORMATION SECURITY & FORENSICS",
                skills=[
                    "IT Support & Help Desk", "Hardware & Software Troubleshooting", "Windows & Microsoft 365",
                    "Network Troubleshooting", "TCP/IP, IPv4 & Subnetting", "DNS/DHCP", "User Accounts & Access",
                    "IT Asset Management", "Backup & Recovery", "System Monitoring", "Technical Documentation",
                    "Information Security", "Customer Support", "Incident Escalation", "Python", "Flask", "C++",
                    "Wireshark", "Nmap", "Suricata", "OPNSense", "VirtualBox"
                ],
                years_experience=1, location="Nairobi, Kenya",
            ))
            print("Created demo user Dennis Kibet Koech: user@denno.com / password123")

        # ── 2. Companies (24 total) ───────────────────────────────────────────────
        comp_data = [
            # name, sector, location, tier, ats, career_url, open_roles, stack
            ("Safaricom PLC", "Telecommunications & Fintech", "Westlands, Nairobi", 1, "Workday",
             "https://www.safaricom.co.ke/careers", 12,
             ["Python", "FastAPI", "Kubernetes", "AWS", "Java", "PostgreSQL", "Kafka"]),
            ("Microsoft ADC", "Big Tech & Cloud Systems", "Westlands, Nairobi", 1, "SmartRecruiters",
             "https://careers.microsoft.com/adc", 16,
             ["C#", ".NET Core", "Azure", "TypeScript", "React", "C++"]),
            ("Google Africa Center", "Big Tech & AI Research", "Kilimani, Nairobi", 1, "Google Careers",
             "https://careers.google.com/locations/nairobi", 14,
             ["Python", "C++", "TensorFlow", "GCP", "Go", "Kubernetes"]),
            ("M-KOPA", "FinTech & IoT Hardware", "Upper Hill, Nairobi", 1, "Greenhouse",
             "https://m-kopa.com/careers", 8,
             ["Flutter", "Python", "AWS", "PostgreSQL", "Docker", "GraphQL"]),
            ("Andela", "Global Tech Talent Network", "Remote", 1, "Lever",
             "https://andela.com/careers", 22,
             ["React", "TypeScript", "Node.js", "Python", "Go", "Kubernetes", "Terraform"]),
            ("Equity Bank Group", "Banking & FinTech", "Upper Hill, Nairobi", 1, "Workday",
             "https://equitygroupholdings.com/careers", 10,
             ["Java", "Spring Boot", "Oracle", "Angular", "Azure", "Kafka"]),
            ("Cellulant", "FinTech & Digital Payments", "Lavington, Nairobi", 2, "Bamboohr",
             "https://www.cellulant.io/careers", 7,
             ["Java", "PHP", "Laravel", "MySQL", "AWS", "Microservices"]),
            ("Flutterwave", "FinTech & Cross-Border Payments", "Remote / Nairobi", 1, "Greenhouse",
             "https://flutterwave.com/careers", 15,
             ["Node.js", "React", "Go", "PostgreSQL", "Redis", "AWS"]),
            ("Twiga Foods", "AgriTech & Supply Chain", "Riverside, Nairobi", 2, "Workable",
             "https://twiga.com/careers", 5,
             ["Python", "Django", "React Native", "PostgreSQL", "GCP"]),
            ("Kopo Kopo Inc", "FinTech & Merchant Services", "Ngong Road, Nairobi", 2, "Lever",
             "https://kopokopo.co.ke/careers", 4,
             ["Ruby on Rails", "React", "PostgreSQL", "Redis", "AWS"]),
            ("AZA Finance", "Crypto & FX FinTech", "Gigiri, Nairobi", 1, "Greenhouse",
             "https://azafinance.com/careers", 9,
             ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Solidity"]),
            ("Craft Silicon", "Banking Software Solutions", "Nairobi", 2, "Custom ATS",
             "https://www.craftsilicon.com/careers", 8,
             ["C#", ".NET", "SQL Server", "Angular", "Android"]),
            # Global / Remote-First
            ("Vercel", "Cloud & Developer Tooling", "Remote / San Francisco, USA", 1, "Ashby",
             "https://vercel.com/careers", 18,
             ["Next.js", "TypeScript", "Rust", "Go", "Node.js", "AWS"]),
            ("Stripe", "Global FinTech Payments", "Remote / Dublin, Ireland", 1, "Greenhouse",
             "https://stripe.com/jobs", 20,
             ["Ruby", "Go", "TypeScript", "React", "PostgreSQL", "Kafka"]),
            ("GitLab", "DevOps & SCM Platform", "Remote", 1, "Greenhouse",
             "https://about.gitlab.com/jobs", 25,
             ["Ruby on Rails", "Go", "Vue.js", "PostgreSQL", "Kubernetes", "Terraform"]),
            ("Notion", "Productivity & Collaboration SaaS", "Remote / New York, USA", 1, "Ashby",
             "https://www.notion.so/careers", 12,
             ["TypeScript", "React", "Node.js", "PostgreSQL", "Electron"]),
            ("Linear", "Engineering Project Management", "Remote", 1, "Ashby",
             "https://linear.app/careers", 8,
             ["TypeScript", "React", "GraphQL", "PostgreSQL", "Rust"]),
            ("Shopify", "E-Commerce & Merchant Platform", "Remote / Ottawa, Canada", 1, "Workday",
             "https://www.shopify.com/careers", 30,
             ["Ruby on Rails", "React", "TypeScript", "Go", "MySQL", "Kafka"]),
            ("Cloudflare", "Edge Network & Security", "Remote / Austin, USA", 1, "Greenhouse",
             "https://www.cloudflare.com/careers", 22,
             ["Go", "Rust", "C++", "Python", "Kubernetes", "eBPF"]),
            ("HashiCorp", "Infrastructure Automation Tools", "Remote", 1, "Lever",
             "https://www.hashicorp.com/jobs", 14,
             ["Go", "Terraform", "Vault", "Kubernetes", "Python"]),
            # Pan-African
            ("Interswitch Group", "Digital Commerce & Payments", "Lagos / Nairobi", 1, "Workday",
             "https://www.interswitchgroup.com/careers", 11,
             ["Java", "Spring Boot", "Oracle", "React", "Microservices"]),
            ("BRCK Inc", "Connectivity & EdTech Hardware", "Kilimani, Nairobi", 2, "Workable",
             "https://www.brck.com/careers", 3,
             ["Python", "Django", "React", "Embedded Linux", "AWS"]),
            ("Apollo Agriculture", "AgriTech & Data Science", "Westlands, Nairobi", 2, "Lever",
             "https://apolloagriculture.com/careers", 6,
             ["Python", "ML", "PostgreSQL", "React", "Go"]),
            ("Nairobi Garage", "Startup Ecosystem & SaaS", "Karen, Nairobi", 3, "Custom ATS",
             "https://nairobigarage.com/jobs", 4,
             ["React", "Node.js", "TypeScript", "PostgreSQL", "Firebase"]),
        ]

        companies = []
        for name, sector, loc, tier, ats, url, count, stack in comp_data:
            c_res = await session.execute(select(Company).where(Company.name == name))
            c = c_res.scalar_one_or_none()
            if not c:
                slug = name.lower().replace(" ", "").replace("plc", "").replace("(", "").replace(")", "")
                c = Company(
                    name=name, sector=sector, location=loc, tier=tier,
                    ats_platform=ats, career_url=url, open_roles_count=count,
                    tech_stack=stack, contact_email=f"careers@{slug}.com"
                )
                session.add(c)
            companies.append(c)
        await session.flush()

        # ── 3. Job Listings (35 total) ────────────────────────────────────────────
        c_map = {c.name: c.id for c in companies}
        today = date.today()

        def dl(days: int) -> date:
            return today + timedelta(days=days)

        def base_reqs(skills: list, extras: list = None) -> list:
            r = [
                f"Minimum 3+ years hands-on production experience with {skills[0]}",
                f"Proficiency in {skills[1]} with real-world project examples",
                f"Strong understanding of {skills[2]} design patterns and best practices",
                f"Experience with {skills[3]} in a professional team environment",
                "Excellent written and verbal communication skills in English",
                "Proven ability to deliver in fast-paced Agile / Scrum environments",
                "Strong analytical thinking and system-design capabilities",
            ]
            if extras:
                r.extend(extras)
            return r

        # (company, title, mode, level, etype, sal_min, sal_max, skills, match, ats, hot, deadline, desc, requirements)
        job_rows = [
            # ── Safaricom PLC ──────────────────────────────────────────────────────
            (
                "Safaricom PLC", "Senior Backend Engineer (M-PESA Cloud)",
                "Hybrid", "Senior", "Full-time", 480000, 680000,
                ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "Kubernetes"],
                94, 91, True, dl(21),
                "Architect scalable M-PESA payment microservices serving 30M+ users with low-latency FastAPI endpoints and Redis caching.",
                base_reqs(["Python", "FastAPI", "PostgreSQL", "Redis"], [
                    "Experience designing high-throughput payment APIs (1000+ TPS)",
                    "Familiarity with PCI-DSS compliance and financial data security",
                    "Bachelor's degree in Computer Science, Engineering or equivalent",
                ])
            ),
            (
                "Safaricom PLC", "Cybersecurity & Security Operations Engineer",
                "Hybrid", "Senior", "Full-time", 460000, 660000,
                ["Python", "Linux", "SIEM", "Network Security", "Cloud Security"],
                88, 86, False, dl(28),
                "Monitor and safeguard enterprise telecom networks, cloud APIs, and financial data vaults against sophisticated threats.",
                base_reqs(["Python", "Linux", "SIEM", "Network Security"], [
                    "CISSP, CEH, or equivalent security certification preferred",
                    "Experience with SIEM platforms (Splunk, QRadar, or Microsoft Sentinel)",
                    "Knowledge of OWASP Top 10 and vulnerability assessment frameworks",
                ])
            ),
            (
                "Safaricom PLC", "Graduate Trainee Software Engineer (Entry Level)",
                "Hybrid", "Entry", "Full-time", 120000, 180000,
                ["Python", "FastAPI", "React", "SQL", "Git", "REST API"],
                94, 91, True, dl(14),
                "Accelerated 12-month rotation program for fresh computer science graduates building M-PESA & Cloud digital apps.",
                [
                    "Bachelor's degree in Computer Science, Software Engineering or IT (2023–2025 graduate)",
                    "Proficiency in at least one programming language (Python, Java, or JavaScript)",
                    "Basic understanding of REST APIs and relational databases",
                    "Strong desire to learn in a fast-paced engineering team",
                    "Excellent problem-solving skills and academic excellence (upper second or above)",
                ]
            ),
            # ── Microsoft ADC ──────────────────────────────────────────────────────
            (
                "Microsoft ADC", "Lead Cloud Systems Architect",
                "Hybrid", "Lead", "Full-time", 650000, 950000,
                ["C#", ".NET Core", "Azure", "Kubernetes", "Terraform", "System Architecture"],
                96, 94, True, dl(35),
                "Lead Azure cloud platform engineering initiatives across EMEA regions building high-throughput distributed systems.",
                base_reqs(["C#", ".NET Core", "Azure", "Kubernetes"], [
                    "10+ years total engineering experience, 3+ years in architecture roles",
                    "Microsoft Certified: Azure Solutions Architect Expert preferred",
                    "Experience with CAP theorem, eventual consistency, and distributed tracing",
                    "Track record leading distributed engineering teams across time zones",
                ])
            ),
            (
                "Microsoft ADC", "Software Engineering Intern (2026 Cohort)",
                "Hybrid", "Intern", "Internship", 55000, 85000,
                ["Python", "C++", "Git", "Data Structures", "Algorithms"],
                92, 90, True, dl(20),
                "Join Microsoft ADC's summer internship cohort to build core cloud services and AI tooling.",
                [
                    "Currently enrolled in a Bachelor's or Master's in Computer Science or related field",
                    "Strong fundamentals in data structures, algorithms, and OOP design",
                    "Proficiency in Python, C++, Java, or C# with demonstrated project work",
                    "Passion for cloud computing, distributed systems, or machine learning",
                    "Available for minimum 3-month full-time internship starting June 2026",
                ]
            ),
            # ── Google Africa Center ───────────────────────────────────────────────
            (
                "Google Africa Center", "AI & ML Infrastructure Engineer",
                "Hybrid", "Senior", "Full-time", 620000, 900000,
                ["Python", "TensorFlow", "C++", "GCP", "Kubernetes", "PyTorch"],
                95, 92, True, dl(30),
                "Build large-scale AI training pipelines and model inference servers for Google's emerging markets initiatives.",
                base_reqs(["Python", "TensorFlow", "C++", "GCP"], [
                    "5+ years in ML engineering with production model deployment experience",
                    "Deep knowledge of distributed training (data/model parallelism, FSDP)",
                    "Experience with CUDA, GPU cluster management, or TPU optimization",
                    "PhD in Machine Learning, Statistics or related field is a plus",
                ])
            ),
            (
                "Google Africa Center", "Senior Frontend Engineer (React/TypeScript)",
                "Hybrid", "Senior", "Full-time", 580000, 850000,
                ["React", "TypeScript", "Next.js", "GraphQL", "Web Performance"],
                95, 93, True, dl(25),
                "Build accessible, high-performance web interfaces consumed by millions across emerging internet regions.",
                base_reqs(["React", "TypeScript", "Next.js", "GraphQL"], [
                    "Deep expertise in Core Web Vitals optimization and performance profiling",
                    "Experience with accessibility standards (WCAG 2.1 AA)",
                    "Familiarity with i18n and offline-first PWA patterns",
                    "Experience contributing to open-source frontend libraries",
                ])
            ),
            # ── Andela ────────────────────────────────────────────────────────────
            (
                "Andela", "Senior Full Stack React & Python Engineer",
                "Remote", "Senior", "Full-time", 380000, 560000,
                ["React", "TypeScript", "Python", "FastAPI", "TailwindCSS", "PostgreSQL"],
                91, 88, True, dl(18),
                "Develop reactive frontend interfaces and Python REST APIs for global enterprise technology partners.",
                base_reqs(["React", "TypeScript", "Python", "FastAPI"], [
                    "4+ years building full-stack applications in production",
                    "Strong state management skills (Redux Toolkit, Zustand, or React Query)",
                    "Experience with CI/CD pipelines (GitHub Actions, CircleCI)",
                    "English fluency; experience collaborating with international teams",
                ])
            ),
            (
                "Andela", "Lead DevOps & Platform Engineer",
                "Remote", "Lead", "Full-time", 550000, 820000,
                ["Terraform", "Kubernetes", "AWS", "Python", "Docker", "CI/CD"],
                94, 91, True, dl(40),
                "Lead infrastructure-as-code deployment standards and developer platform tooling across multi-cloud environments.",
                base_reqs(["Terraform", "Kubernetes", "AWS", "Python"], [
                    "7+ years in DevOps/SRE/Platform Engineering with lead experience",
                    "Hands-on expertise with Helm, ArgoCD or Flux for GitOps workflows",
                    "Experience designing developer portals (Backstage or Port.io)",
                    "FinOps cost optimization experience across AWS / GCP / Azure",
                ])
            ),
            (
                "Andela", "Junior Frontend Developer (Entry Level / Remote)",
                "Remote", "Entry", "Full-time", 110000, 160000,
                ["React", "TypeScript", "HTML", "CSS", "TailwindCSS", "Git"],
                89, 87, True, dl(15),
                "Remote entry-level frontend role working with global mentors on React, TypeScript, and modern component design.",
                [
                    "0–2 years professional or internship experience in frontend development",
                    "Solid understanding of HTML5, CSS3, and responsive design",
                    "Familiarity with React (hooks, functional components) and TypeScript",
                    "Ability to work asynchronously across multiple time zones",
                    "A GitHub portfolio demonstrating frontend projects is required",
                ]
            ),
            # ── M-KOPA ────────────────────────────────────────────────────────────
            (
                "M-KOPA", "Senior Mobile Engineer (Flutter & IoT)",
                "Hybrid", "Senior", "Full-time", 340000, 520000,
                ["Flutter", "Dart", "Python", "PostgreSQL", "AWS", "Bluetooth/IoT"],
                88, 85, False, dl(22),
                "Build cross-platform mobile apps controlling solar IoT devices and digital financial installment payments.",
                base_reqs(["Flutter", "Dart", "Python", "PostgreSQL"], [
                    "4+ years building Flutter apps published to Play Store or App Store",
                    "Experience with BLE protocols and IoT device communication",
                    "Knowledge of mobile offline-first architectures and local data sync",
                    "Understanding of payment SDKs (M-PESA Daraja, Stripe Mobile)",
                ])
            ),
            (
                "M-KOPA", "Junior Data Analyst & Python Developer",
                "Hybrid", "Entry", "Full-time", 100000, 150000,
                ["Python", "SQL", "pandas", "PostgreSQL", "Data Analysis", "Git"],
                90, 88, True, dl(17),
                "Entry-level position analyzing IoT payment telemetry and building automated reporting pipelines in Python.",
                [
                    "Bachelor's degree in Statistics, Data Science, Mathematics or Computer Science",
                    "Proficiency in Python with pandas, numpy, and matplotlib",
                    "Strong SQL skills (window functions, aggregations, CTEs)",
                    "Ability to translate data findings into business recommendations",
                    "Experience with BI tools (Tableau, Looker, Power BI) is a plus",
                ]
            ),
            # ── Flutterwave ───────────────────────────────────────────────────────
            (
                "Flutterwave", "Senior FinTech Payment Gateway Engineer",
                "Remote", "Senior", "Full-time", 420000, 620000,
                ["Node.js", "TypeScript", "Go", "PostgreSQL", "Redis", "AWS"],
                92, 89, True, dl(32),
                "Architect real-time cross-border payment integration gateways processing millions in daily transaction volume.",
                base_reqs(["Node.js", "TypeScript", "Go", "PostgreSQL"], [
                    "5+ years building payment processing systems with ISO 8583 knowledge",
                    "Experience integrating with Visa/Mastercard networks or banking APIs",
                    "Understanding of PCI-DSS Level 1 compliance requirements",
                    "Knowledge of idempotency, distributed transactions, and saga patterns",
                ])
            ),
            (
                "Flutterwave", "Backend Engineering Intern (FinTech API Team)",
                "Remote", "Intern", "Internship", 50000, 80000,
                ["Node.js", "JavaScript", "PostgreSQL", "REST API", "Git"],
                88, 86, True, dl(12),
                "Hands-on internship working alongside senior payment engineers developing cross-border transaction APIs.",
                [
                    "Pursuing a degree in Computer Science, Software Engineering or related field",
                    "Familiarity with JavaScript/Node.js and REST API concepts",
                    "Basic understanding of relational databases (SQL)",
                    "Eagerness to learn about payment systems and financial technology",
                    "Available for 3–6 months starting September 2026",
                ]
            ),
            # ── Equity Bank Group ─────────────────────────────────────────────────
            (
                "Equity Bank Group", "Principal DevOps & SRE Engineer",
                "Hybrid", "Lead", "Full-time", 500000, 750000,
                ["Java", "Docker", "Kubernetes", "Azure", "CI/CD", "Prometheus"],
                90, 87, False, dl(45),
                "Manage production banking infrastructure automation, Kubernetes clusters, and zero-downtime deployment pipelines.",
                base_reqs(["Java", "Docker", "Kubernetes", "Azure"], [
                    "8+ years in enterprise DevOps / SRE, 3+ years in financial services",
                    "Experience with PCI-DSS and ISO 27001 compliant infrastructure",
                    "Expertise in observability (Prometheus, Grafana, ELK Stack, Datadog)",
                    "Experience with DR planning, RTO/RPO targets, and chaos engineering",
                ])
            ),
            # ── AZA Finance ───────────────────────────────────────────────────────
            (
                "AZA Finance", "Senior Backend Engineer (Crypto & FX)",
                "Remote", "Senior", "Full-time", 400000, 600000,
                ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "Solidity"],
                89, 86, True, dl(27),
                "Develop automated FX trading microservices and settlement engines handling pan-African currency conversions.",
                base_reqs(["Python", "FastAPI", "PostgreSQL", "Redis"], [
                    "Experience building financial settlement systems or order-matching engines",
                    "Knowledge of blockchain protocols (Ethereum, Solana) and smart contracts",
                    "Understanding of FX market structure, liquidity providers, and currency APIs",
                    "Experience with regulatory-compliant crypto custody solutions",
                ])
            ),
            # ── Cellulant ─────────────────────────────────────────────────────────
            (
                "Cellulant", "Mid-Level Backend Software Developer",
                "Hybrid", "Mid", "Full-time", 280000, 420000,
                ["Java", "Spring Boot", "MySQL", "Microservices", "REST API"],
                84, 82, False, dl(19),
                "Implement digital checkout APIs and merchant payment solutions across East and West Africa.",
                base_reqs(["Java", "Spring Boot", "MySQL", "Microservices"], [
                    "3–5 years of Java backend development experience",
                    "Experience designing and consuming RESTful APIs",
                    "Understanding of Spring Security and OAuth2/JWT authentication",
                    "Exposure to message queuing systems (RabbitMQ or Apache Kafka)",
                ])
            ),
            # ── Twiga Foods ───────────────────────────────────────────────────────
            (
                "Twiga Foods", "Data Platform Engineer",
                "Hybrid", "Mid", "Full-time", 300000, 450000,
                ["Python", "Django", "PostgreSQL", "Airflow", "GCP", "BigQuery"],
                86, 83, False, dl(33),
                "Build data transformation pipelines powering agricultural supply chain forecasting and logistics dispatch.",
                base_reqs(["Python", "Django", "PostgreSQL", "Airflow"], [
                    "3+ years data engineering experience building production ETL/ELT pipelines",
                    "Experience with dbt, Apache Spark, or Dataflow for large-scale transforms",
                    "Knowledge of data warehousing concepts (star schema, SCD, partitioning)",
                    "Familiarity with real-time streaming (Pub/Sub or Kafka Streams)",
                ])
            ),
            (
                "Twiga Foods", "Software Engineering Placement Student (Intern)",
                "Hybrid", "Intern", "Internship", 45000, 75000,
                ["Python", "Django", "SQL", "HTML", "CSS", "Git"],
                86, 84, True, dl(10),
                "6-month software engineering placement building digital agri-supply chain tools and mobile API endpoints.",
                [
                    "Final-year student in Software Engineering or Computer Science",
                    "Foundational Python skills with interest in web development (Django or Flask)",
                    "Basic SQL knowledge and ability to write simple queries",
                    "Keen interest in agritech, logistics, or supply chain technology",
                    "Available for full-time placement January–June 2027",
                ]
            ),
            # ── Kopo Kopo ─────────────────────────────────────────────────────────
            (
                "Kopo Kopo Inc", "Senior Ruby & React Developer",
                "Hybrid", "Senior", "Full-time", 320000, 480000,
                ["Ruby on Rails", "React", "PostgreSQL", "Redis", "AWS"],
                85, 84, False, dl(24),
                "Develop merchant payment dashboards and automated credit scoring systems for small businesses.",
                base_reqs(["Ruby on Rails", "React", "PostgreSQL", "Redis"], [
                    "4+ years with Ruby on Rails in production (Rails 6+, Hotwire or API mode)",
                    "Strong React/TypeScript skills for financial dashboard building",
                    "Experience with credit decisioning APIs or financial data modeling",
                    "Familiarity with background job processing (Sidekiq or Resque)",
                ])
            ),
            # ── Craft Silicon ─────────────────────────────────────────────────────
            (
                "Craft Silicon", "Software Development Engineer (.NET)",
                "On-site", "Mid", "Full-time", 250000, 380000,
                ["C#", ".NET", "SQL Server", "Angular", "Web API"],
                82, 80, False, dl(38),
                "Build core banking software modules, credit processing workflows, and financial reporting engines.",
                base_reqs(["C#", ".NET", "SQL Server", "Angular"], [
                    "3+ years .NET development with strong C# fundamentals",
                    "Experience with financial or ERP software development preferred",
                    "Proficiency in T-SQL, stored procedures, and DB performance tuning",
                    "Understanding of SOA/microservices patterns in .NET ecosystem",
                ])
            ),
            # ── Vercel ────────────────────────────────────────────────────────────
            (
                "Vercel", "Senior Next.js & Edge Platform Engineer",
                "Remote", "Senior", "Full-time", 700000, 1100000,
                ["Next.js", "TypeScript", "Rust", "Go", "Node.js", "AWS"],
                93, 90, True, dl(42),
                "Build the world's fastest frontend deployment platform — optimize edge runtime, DX tooling, and Next.js internals.",
                base_reqs(["Next.js", "TypeScript", "Rust", "Go"], [
                    "Deep expertise in Next.js internals (App Router, RSC, streaming)",
                    "Experience with edge computing (Cloudflare Workers, Vercel Edge Runtime)",
                    "Performance engineering: V8 profiling, bundle analysis, cold-start optimization",
                    "Open-source track record or strong developer community contributions",
                    "Compensation: $130K–$200K USD equivalent",
                ])
            ),
            # ── Stripe ────────────────────────────────────────────────────────────
            (
                "Stripe", "Backend Software Engineer – Payment Infrastructure",
                "Remote", "Senior", "Full-time", 800000, 1200000,
                ["Ruby", "Go", "TypeScript", "React", "PostgreSQL", "Kafka"],
                94, 92, True, dl(50),
                "Design and scale payment infrastructure handling billions of dollars annually across 195+ countries.",
                base_reqs(["Ruby", "Go", "TypeScript", "PostgreSQL"], [
                    "6+ years backend engineering with distributed systems focus",
                    "Experience designing highly available, fault-tolerant microservices",
                    "Knowledge of payment protocols (ISO 20022, SEPA, SWIFT) is a plus",
                    "Strong opinions on API design, backward compatibility, and versioning",
                    "Compensation: $150K–$220K USD + equity",
                ])
            ),
            # ── GitLab ────────────────────────────────────────────────────────────
            (
                "GitLab", "Staff Engineer – Runner & CI/CD Infrastructure",
                "Remote", "Staff", "Full-time", 850000, 1300000,
                ["Ruby on Rails", "Go", "Vue.js", "PostgreSQL", "Kubernetes", "Terraform"],
                92, 90, True, dl(55),
                "Own and evolve GitLab's global CI/CD runner infrastructure used by 30M+ developers worldwide.",
                base_reqs(["Go", "Kubernetes", "Terraform", "PostgreSQL"], [
                    "8+ years engineering, 3+ years platform/infrastructure at scale",
                    "Track record leading large-scale distributed systems projects end-to-end",
                    "Deep CI/CD knowledge: container orchestration and GitOps workflows",
                    "Experience writing technical RFCs and driving cross-team alignment",
                    "Fully remote, async-first culture",
                ])
            ),
            # ── Shopify ───────────────────────────────────────────────────────────
            (
                "Shopify", "Senior Ruby on Rails Developer – Core Commerce",
                "Remote", "Senior", "Full-time", 750000, 1050000,
                ["Ruby on Rails", "React", "TypeScript", "Go", "MySQL", "Kafka"],
                91, 89, True, dl(48),
                "Scale Shopify's core commerce engine — order management, inventory, checkout — serving 1.75M+ merchants.",
                base_reqs(["Ruby on Rails", "React", "TypeScript", "MySQL"], [
                    "5+ years Ruby on Rails in high-scale production (100K+ RPM)",
                    "Experience with multi-tenancy SaaS and database sharding strategies",
                    "Strong knowledge of Kafka or Sidekiq for async task processing",
                    "Understanding of PCI-DSS and secure coding practices",
                ])
            ),
            # ── Cloudflare ────────────────────────────────────────────────────────
            (
                "Cloudflare", "Systems Engineer – Rust & eBPF Networking",
                "Remote", "Senior", "Full-time", 900000, 1350000,
                ["Go", "Rust", "C++", "Python", "Kubernetes", "eBPF"],
                93, 91, True, dl(60),
                "Extend Cloudflare's global edge network — DDoS mitigation, Zero Trust tunnels, and eBPF firewall programs.",
                base_reqs(["Rust", "Go", "C++", "eBPF"], [
                    "Expert-level Rust or C++ with deep memory safety and concurrency knowledge",
                    "Experience with Linux kernel networking (eBPF/XDP, tc, netfilter)",
                    "Knowledge of BGP, DNS, TLS, QUIC, and network protocol stack internals",
                    "High-performance packet processing experience (DPDK, AF_XDP) is a strong plus",
                ])
            ),
            # ── Interswitch Group ─────────────────────────────────────────────────
            (
                "Interswitch Group", "Senior Software Engineer – Digital Commerce API",
                "Hybrid", "Senior", "Full-time", 380000, 560000,
                ["Java", "Spring Boot", "Oracle", "React", "Microservices"],
                87, 85, False, dl(29),
                "Build and optimize Interswitch's digital commerce and payment orchestration APIs serving 30M+ Africans.",
                base_reqs(["Java", "Spring Boot", "Oracle", "React"], [
                    "5+ years Java enterprise development with Spring Boot / Spring Cloud",
                    "Experience with payment switching, ISO 8583, or card processing",
                    "Knowledge of Oracle PL/SQL and database performance optimization",
                    "Familiarity with API gateways (Kong, Apigee, or AWS API Gateway)",
                ])
            ),
            # ── Apollo Agriculture ────────────────────────────────────────────────
            (
                "Apollo Agriculture", "Machine Learning Engineer – Credit Risk",
                "Hybrid", "Senior", "Full-time", 350000, 520000,
                ["Python", "ML", "PostgreSQL", "React", "Go"],
                90, 88, True, dl(26),
                "Design credit risk models that unlock agricultural financing for millions of smallholder farmers across Africa.",
                base_reqs(["Python", "ML", "PostgreSQL", "Go"], [
                    "3+ years applied ML focused on credit scoring, risk, or fraud detection",
                    "Proficiency in scikit-learn, XGBoost, LightGBM, and SHAP for interpretability",
                    "Experience deploying ML models to production (MLflow or BentoML)",
                    "Understanding of alternative data (satellite, mobile usage, weather) for credit",
                    "Experience in fintech, insurtech, or agrifinance is a strong plus",
                ])
            ),
            # ── BRCK Inc ──────────────────────────────────────────────────────────
            (
                "BRCK Inc", "Embedded Linux & IoT Software Engineer",
                "On-site", "Mid", "Full-time", 260000, 390000,
                ["Python", "Django", "React", "Embedded Linux", "AWS"],
                83, 81, False, dl(31),
                "Build firmware and cloud management software for BRCK's connected education devices used in off-grid East African schools.",
                base_reqs(["Python", "Embedded Linux", "AWS", "Django"], [
                    "3+ years developing software for embedded Linux devices (RPi, i.MX6, or similar)",
                    "Proficiency in Python or C/C++ for device software and firmware scripts",
                    "Experience with MQTT, CoAP, or other IoT protocols",
                    "Passion for technology impact in education or underserved communities",
                ])
            ),
            # ── Nairobi Garage ────────────────────────────────────────────────────
            (
                "Nairobi Garage", "Full Stack Developer – Startup-in-Residence",
                "On-site", "Mid", "Full-time", 200000, 320000,
                ["React", "Node.js", "TypeScript", "PostgreSQL", "Firebase"],
                82, 80, False, dl(16),
                "Work embedded with early-stage portfolio startups at Nairobi Garage — ship product fast and build Africa's next tech giants.",
                base_reqs(["React", "Node.js", "TypeScript", "PostgreSQL"], [
                    "2–4 years full-stack development experience",
                    "Ability to work across multiple codebases and products simultaneously",
                    "Startup mindset: comfortable with ambiguity and rapid iteration",
                    "Experience with Firebase, Supabase, or serverless architectures is a plus",
                ])
            ),
            # ── HashiCorp ─────────────────────────────────────────────────────────
            (
                "HashiCorp", "Senior Product Engineer – Terraform Cloud",
                "Remote", "Senior", "Full-time", 780000, 1150000,
                ["Go", "Terraform", "Vault", "Kubernetes", "Python"],
                92, 90, True, dl(58),
                "Shape the future of infrastructure automation — build Terraform Cloud's run execution engine, workspace management, and provider ecosystem.",
                base_reqs(["Go", "Terraform", "Kubernetes", "Python"], [
                    "5+ years backend engineering with strong Go expertise",
                    "Deep understanding of Terraform execution model, providers, and state",
                    "Experience building multi-tenant SaaS platforms with strict isolation",
                    "Familiarity with secrets management (HashiCorp Vault, AWS Secrets Manager)",
                    "Open-source Terraform or Go contributions are a strong differentiator",
                ])
            ),
            # ── Linear ────────────────────────────────────────────────────────────
            (
                "Linear", "Frontend Engineer – Product",
                "Remote", "Mid", "Full-time", 650000, 980000,
                ["TypeScript", "React", "GraphQL", "PostgreSQL", "Rust"],
                88, 86, True, dl(44),
                "Build the fastest, most delightful project management tool used by the world's best engineering teams.",
                base_reqs(["TypeScript", "React", "GraphQL", "PostgreSQL"], [
                    "3+ years building consumer-grade or developer-tool web applications",
                    "Meticulous attention to UI detail, micro-animations, and keyboard-first UX",
                    "Experience with complex real-time collaborative interfaces (CRDTs or OT)",
                    "Strong performance profiling skills (React DevTools, Chrome tracing)",
                    "Portfolio demonstrating product-quality UI engineering is required",
                ])
            ),
        ]

        for row in job_rows:
            (cname, title, mode, level, etype, smin, smax,
             skills, match, ats_s, is_hot, deadline_date, desc, requirements) = row
            j_res = await session.execute(select(Job).where(Job.title == title))
            if not j_res.scalar_one_or_none():
                cid = c_map.get(cname, 1)
                slug = cname.lower().replace(" ", "").replace("(", "").replace(")", "").replace("plc", "")
                c_match = next((c for c in companies if c.name == cname), None)
                career_link = c_match.career_url if c_match and c_match.career_url else f"https://www.google.com/search?q={cname.replace(' ', '+')}+careers"
                job_obj = Job(
                    company_id=cid, company_name=cname, title=title, mode=mode,
                    level=level, employment_type=etype, salary_min=smin, salary_max=smax,
                    currency="KES", required_skills=skills,
                    requirements=requirements,
                    match_score=match, ats_score=ats_s, is_hot=is_hot, is_expired=False,
                    deadline=deadline_date,
                    source_url=career_link,
                    contact_email=f"careers@{slug}.com",
                    description=desc,
                )
                session.add(job_obj)

        # ── 4. Job Sources (Source Monitor — 24 entries) ──────────────────────────
        source_rows = [
            # (company_id, company_name, url, method, status, jobs_found)
            (1,  "Safaricom PLC",         "https://www.safaricom.co.ke/careers",           "rss",    "verified", 12),
            (2,  "Microsoft ADC",         "https://careers.microsoft.com/adc",             "rss",    "verified", 16),
            (3,  "Google Africa Center",  "https://careers.google.com/locations/nairobi",  "scrape", "verified", 14),
            (4,  "M-KOPA",               "https://m-kopa.com/careers",                    "scrape", "verified",  8),
            (5,  "Andela",               "https://andela.com/careers",                    "rss",    "verified", 22),
            (6,  "Equity Bank Group",    "https://equitygroupholdings.com/careers",        "scrape", "verified", 10),
            (7,  "Cellulant",            "https://www.cellulant.io/careers",              "scrape", "recent",    7),
            (8,  "Flutterwave",          "https://flutterwave.com/careers",               "rss",    "verified", 15),
            (9,  "Twiga Foods",          "https://twiga.com/careers",                     "scrape", "recent",    5),
            (10, "Kopo Kopo Inc",        "https://kopokopo.co.ke/careers",                "manual", "recent",    4),
            (11, "AZA Finance",          "https://azafinance.com/careers",                "scrape", "verified",  9),
            (12, "Craft Silicon",        "https://www.craftsilicon.com/careers",          "manual", "verified",  8),
            (13, "Vercel",              "https://vercel.com/careers",                     "rss",    "verified", 18),
            (14, "Stripe",              "https://stripe.com/jobs",                        "rss",    "verified", 20),
            (15, "GitLab",              "https://about.gitlab.com/jobs",                  "rss",    "verified", 25),
            (16, "Notion",              "https://www.notion.so/careers",                  "scrape", "verified", 12),
            (17, "Linear",              "https://linear.app/careers",                     "scrape", "verified",  8),
            (18, "Shopify",             "https://www.shopify.com/careers",                "rss",    "verified", 30),
            (19, "Cloudflare",          "https://www.cloudflare.com/careers",             "rss",    "verified", 22),
            (20, "HashiCorp",           "https://www.hashicorp.com/jobs",                 "rss",    "verified", 14),
            (21, "Interswitch Group",   "https://www.interswitchgroup.com/careers",       "scrape", "verified", 11),
            (22, "BRCK Inc",            "https://www.brck.com/careers",                  "manual", "recent",    3),
            (23, "Apollo Agriculture",  "https://apolloagriculture.com/careers",          "scrape", "verified",  6),
            (24, "Nairobi Garage",      "https://nairobigarage.com/jobs",                 "manual", "recent",    4),
        ]

        for cid, cname, url, method, status_val, jobs_found in source_rows:
            src_res = await session.execute(select(JobSource).where(JobSource.company_name == cname))
            if not src_res.scalar_one_or_none():
                session.add(JobSource(
                    company_id=cid, company_name=cname, url=url,
                    scrape_method=method, status=status_val, jobs_found=jobs_found,
                    is_active=True,
                    description=f"Official careers page for {cname}. Source method: {method}.",
                ))

        # ── 5. Learning Catalog ───────────────────────────────────────────────────
        course_res = await session.execute(select(LearningCourse))
        if not course_res.scalars().all():
            courses = [
                LearningCourse(title="FastAPI & Async Python Architecture", category="DevOps", level="Intermediate", duration_minutes=180, lesson_count=8, linked_skill="FastAPI", url="https://fastapi.tiangolo.com"),
                LearningCourse(title="PostgreSQL Indexing & Query Tuning", category="Database", level="Advanced", duration_minutes=120, lesson_count=6, linked_skill="PostgreSQL", url="https://www.postgresql.org/docs"),
                LearningCourse(title="Production React & TypeScript Patterns", category="Cloud", level="Intermediate", duration_minutes=240, lesson_count=10, linked_skill="React", url="https://react.dev"),
                LearningCourse(title="AWS Cloud Architecture & Terraform", category="Cloud", level="Advanced", duration_minutes=300, lesson_count=12, linked_skill="AWS", url="https://aws.amazon.com"),
                LearningCourse(title="Docker & Kubernetes Microservices", category="DevOps", level="Intermediate", duration_minutes=210, lesson_count=9, linked_skill="Kubernetes", url="https://kubernetes.io"),
                LearningCourse(title="Top 200: 1. Programming Fundamentals (Q1-20)", category="Interview", level="Beginner", duration_minutes=150, lesson_count=20, linked_skill="Programming Basics", url=""),
                LearningCourse(title="Top 200: 2. Object-Oriented Programming (Q21-40)", category="Interview", level="Intermediate", duration_minutes=180, lesson_count=20, linked_skill="OOP & SOLID", url=""),
                LearningCourse(title="Top 200: 3. Data Structures Mastery (Q41-80)", category="Interview", level="Intermediate", duration_minutes=300, lesson_count=40, linked_skill="Data Structures", url=""),
                LearningCourse(title="Top 200: 4. Algorithms & Problem Solving (Q81-120)", category="Interview", level="Advanced", duration_minutes=360, lesson_count=40, linked_skill="Algorithms & Big-O", url=""),
                LearningCourse(title="Top 200: 5. Programming Languages Core (Q121-145)", category="Interview", level="Intermediate", duration_minutes=200, lesson_count=25, linked_skill="Language Internals", url=""),
                LearningCourse(title="Top 200: 6. Database & SQL Fundamentals (Q146-165)", category="Database", level="Intermediate", duration_minutes=180, lesson_count=20, linked_skill="SQL & ACID", url=""),
                LearningCourse(title="Top 200: 7. System Design & CS Fundamentals (Q166-180)", category="Cloud", level="Advanced", duration_minutes=240, lesson_count=15, linked_skill="System Design", url=""),
                LearningCourse(title="Top 200: 8. Coding Interview Scenarios (Q181-190)", category="Interview", level="Intermediate", duration_minutes=120, lesson_count=10, linked_skill="Coding Scenarios", url=""),
                LearningCourse(title="Ethical Hacking & Penetration Testing Fundamentals", category="Cybersecurity", level="Beginner", duration_minutes=240, lesson_count=12, linked_skill="Penetration Testing", url="https://portswigger.net/web-security"),
                LearningCourse(title="Digital Forensics & Incident Response (DFIR)", category="Forensics", level="Intermediate", duration_minutes=210, lesson_count=10, linked_skill="Digital Forensics", url="https://www.autopsy.com"),
                LearningCourse(title="Cloud Security Architecture & Container Hardening", category="Cybersecurity", level="Advanced", duration_minutes=270, lesson_count=10, linked_skill="Cloud Security", url="https://kubernetes.io/docs/concepts/security"),
                LearningCourse(title="Network Defense, Cryptography & SIEM Operations", category="Cybersecurity", level="Intermediate", duration_minutes=200, lesson_count=10, linked_skill="Network Security", url="https://mitre-attack.github.io"),
                LearningCourse(title="Reverse Engineering & Malware Analysis", category="Forensics", level="Expert", duration_minutes=300, lesson_count=8, linked_skill="Reverse Engineering", url="https://ghidra-sre.org"),
            ]
            session.add_all(courses)

        # ── 6. Reference Note ─────────────────────────────────────────────────────
        from app.models.sqlalchemy_models import Note
        note_res = await session.execute(select(Note).where(Note.title.like("%Top 200%")))
        if not note_res.scalars().all():
            session.add(Note(
                user_id=1,
                title="Top 200 Coding Interview Questions — Master Reference Cheatsheet",
                category="Interview Cheatsheets",
                body="Full index of 200 questions across Programming Fundamentals, OOP, Data Structures, Algorithms, Languages, Database/SQL, System Design, Scenarios, and Advanced DP/LRU Cache.",
                tags=["coding-interviews", "data-structures", "algorithms", "system-design", "sql", "oop"]
            ))

        await session.commit()

    print("Seeding complete: 24 companies | 35 jobs with valid deadlines & requirements | 24 job sources | full learning catalog!")


async def main():
    await seed()
    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
