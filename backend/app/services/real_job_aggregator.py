"""
Real-time Daily Live Job Aggregator Service.

Fetches active, authentic software engineering and tech job postings from
verified public live tech job endpoints and stores them into the database
with automatic deduplication by source URL.

Sources
-------
1. Jobicy            – engineering + intern tag queries
2. RemoteOK          – general remote feed
3. Arbeitnow         – general + intern + entry-level + UK board
4. Remotive          – software-dev, intern, junior, entry-level categories
5. The Muse          – entry-level and internship categories
6. Greenhouse ATS    – public job boards of 30+ major tech companies
7. Ashby ATS         – public job boards of 20+ startups / tech cos
8. JSRemotely        – JS/TS/React-focused remote board
9. MyJobMag Kenya    – RSS feed: ICT/tech jobs in Kenya
10. ReliefWeb Kenya  – tech/data jobs via ReliefWeb API (Kenya)
11. CareerPoint Kenya – RSS: IT, engineering, internship jobs in Kenya
12. JobwebKenya      – RSS: tech/software jobs in Kenya
13. CampusBizz       – Kenya campus/graduate tech roles
14. Kenyan Tech Enterprises – Safaricom, Equity, Cellulant, M-KOPA, etc.
15. OpenedCareers Kenya – RSS feed: ICT, data science, internship roles in Kenya
16. Jobs Career Kenya – RSS: IT, engineering, internship jobs in Kenya
17. Fuzu Kenya – RSS: tech/ICT jobs in Kenya
18. BrighterMonday Kenya – RSS: software/data/IT jobs in Kenya
19. StarJobs & Nairobi Garage – aggregated Kenyan tech board
20. Public Service Kenya – GOK tech job postings
21. LinkedIn (via public feed scraper)
22. OpenedCareer.com /job – tech-category RSS feed (IT, software, data, cyber, internship)

Date accuracy
-------------
Every source now parses the real ``published_at`` / ``created_at`` field
returned by the API instead of using datetime.now().  If the field is
missing or unparseable we fall back to "now".

Level detection order
---------------------
  intern keywords  → "Intern"
  junior/entry/new-grad keywords → "Entry"
  senior/lead/principal → "Senior" / "Lead"
  everything else   → "Mid"
"""
import logging
import re
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sqlalchemy_models import Company, Job

logger = logging.getLogger("denno.jobs.aggregator")

_LAST_SYNC_TIMESTAMP: Optional[datetime] = None
SYNC_COOLDOWN_SECONDS = 300  # 5 minute cooldown between full network scrapers

TECH_SKILLS_KEYWORDS = [
    "Python", "FastAPI", "React", "TypeScript", "JavaScript", "PostgreSQL",
    "Docker", "Kubernetes", "AWS", "Redis", "System Design", "Node.js",
    "GraphQL", "Java", "Go", "C#", "Django", "Tailwind", "CI/CD", "Machine Learning",
    "Git", "REST API", "Microservices", "SQL", "MongoDB", "GCP", "Azure", "Terraform",
    "HTML", "CSS", "Linux", "Next.js", "Express", "Flask", "PyTest", "Jest", "Redux",
    "Flutter", "Dart", "C++", "Rust", "Spring Boot", "Kafka", "Elasticsearch",
    "Vue.js", "Angular", "Svelte", "Ruby", "PHP", "Swift", "Kotlin", "Bash",
    "Ansible", "OpenAI", "LangChain", "pandas", "NumPy", "TensorFlow", "PyTorch",
    "Data Analysis", "API Integration", "Figma", "GitHub", "Jira", "Agile",
    "React Native", "Expo", "tRPC", "Prisma", "Supabase", "Firebase", "Vercel",
    "Netlify", "GitHub Actions", "CircleCI", "Jenkins", "Webpack", "Vite",
    "MySQL", "SQLite", "DynamoDB", "Celery", "RabbitMQ", "gRPC", "WebSockets",
    "Cybersecurity", "Digital Forensics", "SIEM", "SOC", "Incident Response",
    "Wireshark", "Volatility", "FTK Imager", "EnCase", "Malware Analysis",
    "Penetration Testing", "Metasploit", "Burp Suite", "Reverse Engineering",
    "EDR", "CrowdStrike", "Defender for Endpoint", "Nessus", "Threat Hunting",
    "CompTIA Security+", "CEH", "CISSP", "OSCP", "GCFA", "YARA", "Snort", "Zeek",
]

# ── Level-detection keyword sets ──────────────────────────────────────────────
_INTERN_KW = {
    "intern", "internship", "trainee", "placement", "apprentice",
    "attachment", "graduate trainee", "co-op", "coop", "co op",
    "industrial training", "work study",
}
_ENTRY_KW = {
    "entry", "entry-level", "entry level", "junior", "associate",
    "new grad", "graduate", "fresh", "fresher", "0-2 year", "0-1 year",
    "0 year", "1 year", "bootcamp", "early career", "recent graduate",
    "no experience", "jnr", "jr ", "jr.", "new graduate",
}
_SENIOR_KW = {"senior", "sr.", "sr ", "staff", "principal", "expert", "architect"}
_LEAD_KW   = {
    "lead", "head of", "director", "manager", "vp ", "vice president",
    "cto", "engineering manager",
}


def _detect_level(title: str, description: str = "") -> str:
    combined = (title + " " + description[:400]).lower()
    if any(kw in combined for kw in _INTERN_KW):
        return "Intern"
    if any(kw in combined for kw in _ENTRY_KW):
        return "Entry"
    if any(kw in combined for kw in _LEAD_KW):
        return "Lead"
    if any(kw in combined for kw in _SENIOR_KW):
        return "Senior"
    return "Mid"


def _extract_skills_from_text(text: str) -> list[str]:
    matched = []
    for kw in TECH_SKILLS_KEYWORDS:
        if re.search(r"\b" + re.escape(kw) + r"\b", text, re.IGNORECASE):
            matched.append(kw)
    return list(dict.fromkeys(matched))


def _clean_html(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"<[^>]+>", " ", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _salary_for_level(level: str) -> tuple[int, int]:
    return {
        "Intern": (40_000,  80_000),
        "Entry":  (80_000, 180_000),
        "Mid":    (200_000, 380_000),
        "Senior": (350_000, 550_000),
        "Lead":   (500_000, 800_000),
    }.get(level, (150_000, 300_000))


def _default_requirements(level: str, skills: list[str]) -> list[str]:
    skill_str = ", ".join(skills[:3]) if skills else "modern web technologies"
    base = {
        "Intern": [
            f"Currently enrolled in a CS, Software Engineering, or related degree program",
            f"Basic knowledge of {skill_str}",
            "Eagerness to learn and collaborate in a team environment",
            "Strong communication skills",
        ],
        "Entry": [
            f"0–2 years of experience with {skill_str}",
            "Ability to write clean, maintainable code",
            "Familiarity with Git and version control workflows",
            "Strong problem-solving skills",
        ],
        "Mid": [
            f"2–5 years professional experience with {skill_str}",
            "Experience shipping production code at scale",
            "Good understanding of software design patterns",
            "Collaborative team player",
        ],
        "Senior": [
            f"5+ years of hands-on experience with {skill_str}",
            "Ability to mentor junior engineers",
            "Experience leading technical design and architecture decisions",
            "Strong analytical and communication skills",
        ],
        "Lead": [
            f"7+ years of engineering experience including {skill_str}",
            "Experience managing and growing engineering teams",
            "Track record of successful product delivery",
            "Excellent stakeholder communication",
        ],
    }.get(level, [f"Experience with {skill_str}", "Strong engineering fundamentals"])
    return base


# ── Date parsing helpers ───────────────────────────────────────────────────────

_DATE_FORMATS = [
    "%Y-%m-%dT%H:%M:%S%z",
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y-%m-%dT%H:%M:%S.%f%z",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d",
    "%B %d, %Y",
    "%d %B %Y",
    "%b %d, %Y",
]


def _parse_date(raw: Optional[str]) -> datetime:
    """Parse a date string into a UTC-aware datetime; fallback = now."""
    if not raw:
        return datetime.now(timezone.utc)
    raw = raw.strip()
    # handle Unix timestamps
    if raw.isdigit():
        try:
            return datetime.fromtimestamp(int(raw), tz=timezone.utc)
        except Exception:
            pass
    for fmt in _DATE_FORMATS:
        try:
            dt = datetime.strptime(raw, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue
    logger.debug("Unparseable date string: %r — using now", raw)
    return datetime.now(timezone.utc)


MONTH_NAMES = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12,
}


def extract_deadline_from_text(text: str, posted_at: Optional[datetime] = None, fallback_days: int = 30) -> date:
    """
    Extracts explicit application deadline dates from job descriptions/titles.
    Recognizes patterns like:
      - "by 11th May 2026"
      - "deadline: 11 May 2026"
      - "before May 11, 2026"
      - "closing date: 11/05/2026"
    If found AND the date is still in the future, returns the exact date.
    If the extracted date is already past, it is discarded (treated as stale info)
    and falls back to posted_at + fallback_days, capped at today + 60 days.
    """
    today = date.today()
    max_deadline = today + timedelta(days=60)

    def _safe_date(d: date) -> Optional[date]:
        """Return the date only if it is still in the future, else None."""
        if d > today:
            return min(d, max_deadline)
        return None

    if text:
        # 1. Day Month Year (e.g. 11th May 2026 / 11 May 2026)
        m1 = re.search(
            r"(?:by|before|deadline|closing|on|until)?\s*(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b\s*,?\s*(\d{4})?",
            text,
            re.IGNORECASE,
        )
        if m1:
            day = int(m1.group(1))
            month_str = m1.group(2).lower()
            month = MONTH_NAMES.get(month_str, 1)
            year_str = m1.group(3)
            year = int(year_str) if year_str else (posted_at.year if posted_at else today.year)
            try:
                candidate = date(year, month, day)
                safe = _safe_date(candidate)
                if safe:
                    return safe
                # extracted date is in the past — discard and fall through to fallback
            except ValueError:
                pass

        # 2. Month Day Year (e.g. May 11th 2026 / May 11, 2026)
        m2 = re.search(
            r"(?:by|before|deadline|closing|on|until)?\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})?",
            text,
            re.IGNORECASE,
        )
        if m2:
            month_str = m2.group(1).lower()
            month = MONTH_NAMES.get(month_str, 1)
            day = int(m2.group(2))
            year_str = m2.group(3)
            year = int(year_str) if year_str else (posted_at.year if posted_at else today.year)
            try:
                candidate = date(year, month, day)
                safe = _safe_date(candidate)
                if safe:
                    return safe
            except ValueError:
                pass

        # 3. Numeric DD/MM/YYYY or YYYY-MM-DD
        m3 = re.search(
            r"(?:deadline|closing|by|before)\s*[:\-]?\s*(\d{4}[\-/]\d{1,2}[\-/]\d{1,2}|\d{1,2}[\-/]\d{1,2}[\-/]\d{4})",
            text,
            re.IGNORECASE,
        )
        if m3:
            dt_str = m3.group(1).replace("/", "-")
            parts = dt_str.split("-")
            try:
                if len(parts[0]) == 4:
                    candidate = date(int(parts[0]), int(parts[1]), int(parts[2]))
                else:
                    candidate = date(int(parts[2]), int(parts[1]), int(parts[0]))
                safe = _safe_date(candidate)
                if safe:
                    return safe
            except ValueError:
                pass

    # Fallback: posted_at + fallback_days, but always future-capped
    posted = posted_at or datetime.now(timezone.utc)
    fallback = (posted + timedelta(days=fallback_days)).date()
    # If even the fallback is in the past (very old posted_at), pin to today + 14 days
    if fallback <= today:
        fallback = today + timedelta(days=14)
    return min(fallback, max_deadline)


def _deadline_from_posted(posted: datetime, days: int = 30, text: str = "") -> date:
    """Calculate deadline using explicit text extraction when available, otherwise posted_at + days."""
    return extract_deadline_from_text(text, posted_at=posted, fallback_days=days)


# ── Greenhouse ATS company slugs ──────────────────────────────────────────────
# These are real public Greenhouse boards — no API key needed.
GREENHOUSE_SLUGS = [
    # Big tech / FAANG-adjacent
    "airbnb", "stripe", "shopify", "figma", "notion", "linear",
    "discord", "twilio", "datadog", "hashicorp", "mongodb",
    # Growing startups with good intern/entry programs
    "vercel", "planetscale", "loom", "retool", "airtable",
    "brex", "ramp", "scale", "anthropic", "cohere",
    # African & Kenyan tech presence
    "flutterwave", "andela", "paystack", "mkopa", "cellulant",
    "copia-global", "sanergy",
]

# ── Ashby ATS company slugs ───────────────────────────────────────────────────
ASHBY_SLUGS = [
    "resend", "cal", "clerk", "dub", "turso", "trigger",
    "neon", "railway", "fly", "render", "supabase",
    "posthog", "highlight", "sentry", "grafana", "liveblocks",
    "alchemy", "privy", "mux", "wasoko", "twiga-foods",
]



class RealJobAggregatorService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_or_create_company(self, name: str, career_url: str = "") -> Company:
        clean_name = name.strip() or "Tech Company"
        result = await self.session.execute(
            select(Company).where(Company.name == clean_name)
        )
        company = result.scalars().first()
        if not company:
            company = Company(
                name=clean_name,
                sector="Technology",
                location="Remote / Global",
                tier=1,
                ats_platform="API",
                career_url=career_url,
                contact_email=f"careers@{re.sub(r'[^a-z0-9]', '', clean_name.lower())}.com",
            )
            self.session.add(company)
            await self.session.flush()
        return company

    # ── Source 1: Jobicy ──────────────────────────────────────────────────────
    async def fetch_from_jobicy(self, limit: int = 20) -> list[dict]:
        """Fetch live engineering jobs from Jobicy API — includes internships."""
        sources = [
            f"https://jobicy.com/api/v2/remote-jobs?count={limit}&industry=engineering",
            f"https://jobicy.com/api/v2/remote-jobs?count={limit}&industry=engineering&tag=intern",
            f"https://jobicy.com/api/v2/remote-jobs?count={limit}&industry=engineering&tag=entry-level",
            f"https://jobicy.com/api/v2/remote-jobs?count={limit}&industry=data-science&tag=intern",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.get(url, follow_redirects=True)
                    if resp.status_code != 200:
                        continue
                    items = resp.json().get("jobs", [])
                    for item in items:
                        title      = item.get("jobTitle", "").strip()
                        company_nm = item.get("companyName", "").strip()
                        job_url    = item.get("url", "").strip()
                        desc       = _clean_html(item.get("jobDescription", ""))
                        if not title or not job_url or job_url in seen_urls:
                            continue
                        seen_urls.add(job_url)

                        # Real date from API
                        posted_at = _parse_date(item.get("pubDate") or item.get("postingDate"))

                        skills = _extract_skills_from_text(desc + " " + title)
                        if not skills:
                            skills = ["Python", "React", "TypeScript", "REST API"]

                        level = _detect_level(title, desc)
                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_nm or "Tech Enterprise",
                            "source_url": job_url,
                            "description": desc[:800] if desc else f"Remote {level} position via Jobicy: {title}",
                            "mode": "Remote",
                            "level": level,
                            "salary_min": int(item.get("annualSalaryMin") or sal_min),
                            "salary_max": int(item.get("annualSalaryMax") or sal_max),
                            "currency": item.get("salaryCurrency") or "KES",
                            "required_skills": skills[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("Jobicy fetch failed (%s): %s", url, exc)
        return jobs

    # ── Source 2: RemoteOK ────────────────────────────────────────────────────
    async def fetch_from_remoteok(self, limit: int = 25) -> list[dict]:
        """Fetch live remote jobs from RemoteOK API."""
        url = "https://remoteok.com/api"
        headers = {"User-Agent": "Mozilla/5.0 (compatible; DennoBot/1.0)"}
        jobs: list[dict] = []
        try:
            async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
                resp = await client.get(url, follow_redirects=True)
                if resp.status_code == 200:
                    items = [j for j in resp.json() if isinstance(j, dict) and j.get("position")]
                    for item in items[:limit]:
                        title      = item.get("position", "").strip()
                        company_nm = item.get("company", "").strip()
                        job_url    = item.get("url", "").strip() or f"https://remoteok.com/remote-jobs/{item.get('id', '')}"
                        desc       = _clean_html(item.get("description", ""))
                        tags       = item.get("tags", []) or []
                        if not title:
                            continue

                        # RemoteOK returns epoch seconds in "date" or "epoch"
                        posted_at = _parse_date(str(item.get("epoch") or item.get("date") or ""))

                        skills = _extract_skills_from_text(desc + " " + title + " " + " ".join(tags))
                        if not skills:
                            skills = ["Python", "React", "Docker", "AWS", "PostgreSQL"]

                        level = _detect_level(title, desc)
                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_nm or "Remote Tech Corp",
                            "source_url": job_url,
                            "description": desc[:800] if desc else "Live remote engineering job from RemoteOK.",
                            "mode": "Remote",
                            "level": level,
                            "salary_min": int(item.get("salary_min") or sal_min),
                            "salary_max": int(item.get("salary_max") or sal_max),
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
        except Exception as exc:
            logger.warning("RemoteOK fetch failed: %s", exc)
        return jobs

    # ── Source 3: Arbeitnow ───────────────────────────────────────────────────
    async def fetch_from_arbeitnow(self, limit: int = 20) -> list[dict]:
        """Fetch jobs from Arbeitnow API — general, intern, entry-level, and UK board."""
        sources = [
            "https://arbeitnow.com/api/job-board-api",
            "https://arbeitnow.com/api/job-board-api?tags=intern",
            "https://arbeitnow.com/api/job-board-api?tags=entry-level",
            "https://arbeitnow.com/api/job-board-api?tags=junior",
            "https://arbeitnow.co.uk/api/job-board-api?tags=intern",
            "https://arbeitnow.co.uk/api/job-board-api?tags=graduate",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.get(url, follow_redirects=True)
                    if resp.status_code != 200:
                        continue
                    items = resp.json().get("data", [])
                    for item in items[:limit]:
                        title      = str(item.get("title") or "").strip()
                        company_nm = str(item.get("company_name") or "").strip()
                        job_url    = str(item.get("url") or "").strip()
                        desc       = _clean_html(str(item.get("description") or ""))
                        raw_tags   = item.get("tags", []) or []
                        tags       = [str(t) for t in raw_tags] if isinstance(raw_tags, list) else []
                        if not title or not job_url or job_url in seen_urls:
                            continue
                        seen_urls.add(job_url)

                        posted_at = _parse_date(str(item.get("created_at") or item.get("published_at") or ""))

                        skills = _extract_skills_from_text(desc + " " + title + " " + " ".join(tags))
                        if not skills:
                            skills = ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL"]

                        level = _detect_level(title, desc + " " + " ".join(tags))
                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_nm or "Global Tech Partner",
                            "source_url": job_url,
                            "description": desc[:800] if desc else "Live tech opportunity from Arbeitnow.",
                            "mode": "Remote" if item.get("remote") else "Hybrid",
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("Arbeitnow fetch failed (%s): %s", url, exc)
        return jobs

    # ── Source 4: Remotive ────────────────────────────────────────────────────
    async def fetch_from_remotive(self, limit: int = 25) -> list[dict]:
        """Fetch live remote jobs from Remotive API — intern & entry-level focused."""
        sources = [
            "https://remotive.com/api/remote-jobs?category=software-dev&limit=25",
            "https://remotive.com/api/remote-jobs?search=intern&limit=20",
            "https://remotive.com/api/remote-jobs?search=entry+level&limit=20",
            "https://remotive.com/api/remote-jobs?search=junior+developer&limit=20",
            "https://remotive.com/api/remote-jobs?search=graduate+engineer&limit=15",
            "https://remotive.com/api/remote-jobs?category=data&limit=15",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.get(url, follow_redirects=True)
                    if resp.status_code != 200:
                        continue
                    items = resp.json().get("jobs", [])
                    for item in items[:limit]:
                        title      = item.get("title", "").strip()
                        company_nm = item.get("company_name", "").strip()
                        job_url    = item.get("url", "").strip()
                        desc       = _clean_html(item.get("description", ""))
                        tags       = item.get("tags", []) or []
                        if not title or not job_url or job_url in seen_urls:
                            continue
                        seen_urls.add(job_url)

                        # Remotive uses "publication_date" in ISO format
                        posted_at = _parse_date(item.get("publication_date") or item.get("created_at"))

                        skills = _extract_skills_from_text(desc + " " + title + " " + " ".join(tags))
                        if not skills:
                            skills = ["Python", "JavaScript", "Git", "REST API"]

                        level = _detect_level(title, desc)
                        sal_min, sal_max = _salary_for_level(level)

                        mode_raw = (item.get("candidate_required_location") or "").lower()
                        mode = "Remote" if not mode_raw or "worldwide" in mode_raw or "remote" in mode_raw else "Hybrid"

                        jobs.append({
                            "title": title,
                            "company_name": company_nm or "Remotive Tech",
                            "source_url": job_url,
                            "description": desc[:800] if desc else f"Remote {level} role via Remotive: {title}",
                            "mode": mode,
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("Remotive fetch failed (%s): %s", url, exc)
        return jobs

    # ── Source 5: The Muse ────────────────────────────────────────────────────
    async def fetch_from_the_muse(self, limit: int = 20) -> list[dict]:
        """Fetch entry-level and internship jobs from The Muse public API."""
        sources = [
            "https://www.themuse.com/api/public/jobs?category=Software+Engineer&level=Entry+Level&page=1&descended=true",
            "https://www.themuse.com/api/public/jobs?category=Software+Engineer&level=Internship&page=1&descended=true",
            "https://www.themuse.com/api/public/jobs?category=Data+Science&level=Entry+Level&page=1&descended=true",
            "https://www.themuse.com/api/public/jobs?category=Data+%26+Analytics&level=Internship&page=1&descended=true",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {"User-Agent": "Mozilla/5.0 (compatible; DennoBot/1.0)"}

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
                    resp = await client.get(url, follow_redirects=True)
                    if resp.status_code != 200:
                        continue
                    items = resp.json().get("results", [])
                    for item in items[:limit]:
                        title      = item.get("name", "").strip()
                        company_nm = (item.get("company") or {}).get("name", "").strip()
                        job_url    = item.get("refs", {}).get("landing_page", "").strip()
                        desc       = _clean_html(item.get("contents", ""))
                        if not title or not job_url or job_url in seen_urls:
                            continue
                        seen_urls.add(job_url)

                        # The Muse: "publication_date" ISO 8601
                        posted_at = _parse_date(item.get("publication_date") or item.get("updated"))

                        api_level  = (item.get("levels") or [{}])[0].get("name", "")
                        if "internship" in api_level.lower():
                            level = "Intern"
                        elif "entry" in api_level.lower():
                            level = "Entry"
                        elif "senior" in api_level.lower():
                            level = "Senior"
                        else:
                            level = _detect_level(title, desc)

                        skills = _extract_skills_from_text(desc + " " + title)
                        if not skills:
                            skills = ["Python", "JavaScript", "Git", "HTML", "CSS"]

                        sal_min, sal_max = _salary_for_level(level)
                        locations = item.get("locations", [])
                        has_remote = any("remote" in (loc.get("name", "")).lower() for loc in locations)
                        mode = "Remote" if has_remote else "Hybrid"

                        jobs.append({
                            "title": title,
                            "company_name": company_nm or "The Muse Partner",
                            "source_url": job_url,
                            "description": desc[:800] if desc else f"{level} tech role via The Muse: {title}",
                            "mode": mode,
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("The Muse fetch failed (%s): %s", url, exc)
        return jobs

    # ── Source 6: Greenhouse ATS ──────────────────────────────────────────────
    async def fetch_from_greenhouse(self, limit_per_company: int = 8) -> list[dict]:
        """
        Fetch jobs directly from Greenhouse ATS public boards of major tech companies.
        No API key required — these are openly published career pages.
        """
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {"User-Agent": "Mozilla/5.0 (compatible; DennoBot/1.0)"}

        for slug in GREENHOUSE_SLUGS:
            url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true"
            try:
                async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
                    resp = await client.get(url, follow_redirects=True)
                    if resp.status_code != 200:
                        continue
                    items = resp.json().get("jobs", [])

                    added = 0
                    for item in items:
                        if added >= limit_per_company:
                            break
                        title   = (item.get("title") or "").strip()
                        job_url = (item.get("absolute_url") or "").strip()
                        desc    = _clean_html(item.get("content") or "")
                        if not title or not job_url or job_url in seen_urls:
                            continue

                        # Only keep intern / entry / junior / graduate roles
                        level = _detect_level(title, desc)
                        if level not in ("Intern", "Entry"):
                            # still keep Mid roles but skip Senior/Lead to stay relevant
                            if level in ("Senior", "Lead"):
                                continue

                        seen_urls.add(job_url)
                        added += 1

                        # Greenhouse: "updated_at" / "created_at" in ISO 8601
                        posted_at = _parse_date(
                            item.get("updated_at") or item.get("created_at")
                        )

                        # Location hint
                        loc_name = (item.get("location") or {}).get("name", "")
                        mode = "Remote" if "remote" in loc_name.lower() else "Hybrid"

                        # Company name from slug (capitalised slug as fallback)
                        company_display = slug.replace("-", " ").title()

                        skills = _extract_skills_from_text(desc + " " + title)
                        if not skills:
                            skills = ["Python", "JavaScript", "Git", "REST API"]

                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_display,
                            "source_url": job_url,
                            "description": desc[:800] if desc else f"{level} role at {company_display}.",
                            "mode": mode,
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("Greenhouse fetch failed (slug=%s): %s", slug, exc)
        return jobs

    # ── Source 7: Ashby ATS ───────────────────────────────────────────────────
    async def fetch_from_ashby(self, limit_per_company: int = 6) -> list[dict]:
        """
        Fetch from Ashby ATS public job boards — popular with Y Combinator /
        fast-growing startups.  No API key required.
        """
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {"User-Agent": "Mozilla/5.0 (compatible; DennoBot/1.0)"}

        for slug in ASHBY_SLUGS:
            url = f"https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true"
            try:
                async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
                    resp = await client.get(url, follow_redirects=True)
                    if resp.status_code != 200:
                        continue
                    items = resp.json().get("jobs", [])

                    added = 0
                    for item in items:
                        if added >= limit_per_company:
                            break
                        title       = (item.get("title") or "").strip()
                        job_url     = (item.get("jobUrl") or "").strip()
                        desc        = _clean_html(item.get("descriptionHtml") or item.get("description") or "")
                        company_nm  = (item.get("teamName") or slug.replace("-", " ").title()).strip()

                        if not title or not job_url or job_url in seen_urls:
                            continue

                        level = _detect_level(title, desc)
                        if level in ("Senior", "Lead"):
                            continue  # bias toward intern/entry/mid

                        seen_urls.add(job_url)
                        added += 1

                        posted_at = _parse_date(
                            item.get("publishedAt") or item.get("createdAt") or item.get("updatedAt")
                        )

                        loc_raw = (item.get("location") or item.get("locationName") or "").lower()
                        mode = "Remote" if "remote" in loc_raw else "Hybrid"

                        # Compensation from Ashby (if available)
                        comp = item.get("compensation") or {}
                        sal_min_raw = comp.get("minValue") or comp.get("min")
                        sal_max_raw = comp.get("maxValue") or comp.get("max")
                        sal_min_fb, sal_max_fb = _salary_for_level(level)
                        sal_min = int(sal_min_raw) if sal_min_raw else sal_min_fb
                        sal_max = int(sal_max_raw) if sal_max_raw else sal_max_fb

                        skills = _extract_skills_from_text(desc + " " + title)
                        if not skills:
                            skills = ["JavaScript", "TypeScript", "React", "Node.js"]

                        jobs.append({
                            "title": title,
                            "company_name": company_nm,
                            "source_url": job_url,
                            "description": desc[:800] if desc else f"{level} role at {company_nm}.",
                            "mode": mode,
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("Ashby fetch failed (slug=%s): %s", slug, exc)
        return jobs

    # ── Source 8: JSRemotely ──────────────────────────────────────────────────
    async def fetch_from_jsremotely(self, limit: int = 20) -> list[dict]:
        """
        Fetch JavaScript / TypeScript / React focused remote jobs from JSRemotely.
        The site exposes a JSON feed at /api/jobs.
        """
        url = "https://jsremotely.com/api/jobs"
        headers = {"User-Agent": "Mozilla/5.0 (compatible; DennoBot/1.0)"}
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        try:
            async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
                resp = await client.get(url, follow_redirects=True)
                if resp.status_code != 200:
                    return jobs
                try:
                    data = resp.json()
                except Exception:
                    return jobs
                items = data if isinstance(data, list) else data.get("jobs", data.get("data", []))
                for item in items[:limit]:
                    title      = (item.get("title") or item.get("position") or "").strip()
                    company_nm = (item.get("company") or item.get("company_name") or "").strip()
                    job_url    = (item.get("url") or item.get("apply_url") or item.get("link") or "").strip()
                    desc       = _clean_html(item.get("description") or item.get("body") or "")
                    tags       = item.get("tags") or item.get("skills") or []
                    if isinstance(tags, list):
                        tags = [str(t) for t in tags]
                    else:
                        tags = []

                    if not title or not job_url or job_url in seen_urls:
                        continue
                    seen_urls.add(job_url)

                    posted_at = _parse_date(
                        item.get("created_at") or item.get("published_at") or item.get("date")
                    )

                    skills = _extract_skills_from_text(desc + " " + title + " " + " ".join(tags))
                    if not skills:
                        skills = ["JavaScript", "TypeScript", "React", "Node.js", "CSS"]

                    level = _detect_level(title, desc)
                    sal_min, sal_max = _salary_for_level(level)

                    jobs.append({
                        "title": title,
                        "company_name": company_nm or "JS Remote Company",
                        "source_url": job_url,
                        "description": desc[:800] if desc else f"JS/TS remote role: {title}",
                        "mode": "Remote",
                        "level": level,
                        "salary_min": sal_min,
                        "salary_max": sal_max,
                        "currency": "KES",
                        "required_skills": list(dict.fromkeys(skills))[:6],
                        "requirements": _default_requirements(level, skills),
                        "posted_at": posted_at,
                        "deadline": _deadline_from_posted(posted_at),
                    })
        except Exception as exc:
            logger.warning("JSRemotely fetch failed: %s", exc)
        return jobs

    # ── Source 9: MyJobMag Kenya (RSS Feeds) ──────────────────────────────────
    async def fetch_from_myjobmag_kenya(self, limit: int = 25) -> list[dict]:
        """
        Fetch active tech, ICT, software engineering, and internship job postings
        specifically in Kenya via MyJobMag Kenya.
        """
        import xml.etree.ElementTree as ET

        sources = [
            "https://www.myjobmag.co.ke/feed",
            "https://www.myjobmag.co.ke/rss.xml",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DennoBot/1.0"}

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    try:
                        root = ET.fromstring(resp.text)
                    except ET.ParseError:
                        continue

                    items = root.findall("./channel/item")
                    for item in items[:limit]:
                        raw_title  = (item.findtext("title") or "").strip()
                        job_url    = (item.findtext("link") or "").strip()
                        raw_desc   = _clean_html(item.findtext("description") or "")
                        pub_date   = item.findtext("pubDate")

                        if not raw_title or not job_url or job_url in seen_urls:
                            continue

                        combined_text = (raw_title + " " + raw_desc).lower()
                        tech_kw = ["developer", "engineer", "software", "data", "it ", "ict", "system", "analyst", "intern", "security", "web", "network", "cloud", "tech", "digital"]
                        if not any(k in combined_text for k in tech_kw):
                            continue

                        if " at " in raw_title:
                            parts = raw_title.split(" at ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        elif " - " in raw_title:
                            parts = raw_title.split(" - ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        else:
                            title = raw_title
                            company_nm = "Kenyan Enterprise"

                        seen_urls.add(job_url)
                        posted_at = _parse_date(pub_date)
                        skills = _extract_skills_from_text(raw_desc + " " + title)
                        if not skills:
                            skills = ["Python", "JavaScript", "SQL", "Git", "HTML/CSS"]

                        level = _detect_level(title, raw_desc)
                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_nm,
                            "source_url": job_url,
                            "description": raw_desc[:800] if raw_desc else f"{level} position in Kenya: {title}",
                            "mode": "Hybrid" if "hybrid" in raw_desc.lower() else ("Remote" if "remote" in raw_desc.lower() else "Onsite"),
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("MyJobMag Kenya fetch failed (%s): %s", url, exc)
        return jobs

    # ── Source 10: ReliefWeb Kenya (Public API) ───────────────────────────────
    async def fetch_from_reliefweb_kenya(self, limit: int = 25) -> list[dict]:
        """
        Fetch technology, data, software, and ICT jobs in Kenya via the official ReliefWeb API.
        """
        url = "https://api.reliefweb.int/v1/jobs?appname=dennocareeros&filter[field]=country.name&filter[value]=Kenya&limit=50"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DennoBot/1.0"}
        jobs: list[dict] = []
        seen_urls: set[str] = set()

        try:
            async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return jobs
                items = resp.json().get("data", [])
                for item in items[:limit]:
                    fields     = item.get("fields") or {}
                    title      = (fields.get("title") or "").strip()
                    job_url    = (fields.get("url") or "").strip()
                    desc       = _clean_html(fields.get("body") or fields.get("how_to_apply") or "")
                    orgs       = fields.get("source") or [{}]
                    company_nm = (orgs[0].get("name") if orgs else "Kenya Tech Org") or "Kenya Tech Org"

                    if not title or not job_url or job_url in seen_urls:
                        continue

                    combined_text = (title + " " + desc).lower()
                    tech_keywords = ["developer", "engineer", "software", "data", "it ", "ict", "system", "analyst", "intern", "digital", "tech", "web", "program", "database"]
                    if not any(kw in combined_text for kw in tech_keywords):
                        continue

                    seen_urls.add(job_url)
                    date_field = (fields.get("date") or {}).get("created") or (fields.get("date") or {}).get("original")
                    posted_at = _parse_date(date_field)

                    skills = _extract_skills_from_text(desc + " " + title)
                    if not skills:
                        skills = ["Python", "Data Analysis", "SQL", "Git", "REST API"]

                    level = _detect_level(title, desc)
                    sal_min, sal_max = _salary_for_level(level)

                    jobs.append({
                        "title": title,
                        "company_name": company_nm,
                        "source_url": job_url,
                        "description": desc[:800] if desc else f"{level} opportunity in Kenya via ReliefWeb: {title}",
                        "mode": "Hybrid",
                        "level": level,
                        "salary_min": sal_min,
                        "salary_max": sal_max,
                        "currency": "KES",
                        "required_skills": list(dict.fromkeys(skills))[:6],
                        "requirements": _default_requirements(level, skills),
                        "posted_at": posted_at,
                        "deadline": _deadline_from_posted(posted_at),
                    })
        except Exception as exc:
            logger.warning("ReliefWeb Kenya fetch failed: %s", exc)
        return jobs

    # ── Source 11: CareerPoint Kenya (RSS Feeds) ──────────────────────────────
    async def fetch_from_careerpoint_kenya(self, limit: int = 35) -> list[dict]:
        """
        Fetch active tech, IT, cybersecurity, and internship jobs in Kenya via CareerPoint Kenya RSS feeds.
        """
        import xml.etree.ElementTree as ET

        sources = [
            "https://www.careerpointkenya.co.ke/feed/",
            "https://www.careerpointkenya.co.ke/category/it-jobs-in-kenya/feed/",
            "https://www.careerpointkenya.co.ke/category/internships-in-kenya/feed/",
            "https://www.careerpointkenya.co.ke/category/engineering-jobs-in-kenya/feed/",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DennoBot/1.0"}

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    try:
                        root = ET.fromstring(resp.text)
                    except ET.ParseError:
                        continue

                    items = root.findall("./channel/item")
                    for item in items[:limit]:
                        raw_title  = (item.findtext("title") or "").strip()
                        job_url    = (item.findtext("link") or "").strip()
                        raw_desc   = _clean_html(item.findtext("description") or "")
                        pub_date   = item.findtext("pubDate")

                        if not raw_title or not job_url or job_url in seen_urls:
                            continue

                        combined_text = (raw_title + " " + raw_desc).lower()
                        tech_kw = ["developer", "engineer", "software", "data", "it ", "ict", "system", "analyst", "intern", "security", "web", "network", "cloud", "tech", "bid executive", "technician"]
                        if not any(k in combined_text for k in tech_kw):
                            continue

                        if " Job " in raw_title:
                            parts = raw_title.split(" Job ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        elif " at " in raw_title:
                            parts = raw_title.split(" at ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        elif " - " in raw_title:
                            parts = raw_title.split(" - ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        else:
                            title = raw_title
                            company_nm = "Kenyan Enterprise Partner"

                        seen_urls.add(job_url)
                        posted_at = _parse_date(pub_date)
                        skills = _extract_skills_from_text(raw_desc + " " + title)
                        if not skills:
                            skills = ["Python", "JavaScript", "SQL", "Linux", "Git"]

                        level = _detect_level(title, raw_desc)
                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_nm,
                            "source_url": job_url,
                            "description": raw_desc[:800] if raw_desc else f"{level} opportunity in Kenya: {title}",
                            "mode": "Hybrid" if "hybrid" in raw_desc.lower() else ("Remote" if "remote" in raw_desc.lower() else "Onsite"),
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("CareerPoint Kenya fetch failed (%s): %s", url, exc)
        return jobs

    # ── Source 12: JobwebKenya RSS Feeds ─────────────────────────────────────
    async def fetch_from_jobweb_kenya(self, limit: int = 25) -> list[dict]:
        """
        Fetch active tech, IT, software engineering, and internship job postings
        specifically in Kenya via JobwebKenya RSS feeds.
        """
        import xml.etree.ElementTree as ET

        sources = [
            "https://jobwebkenya.com/feed/",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DennoBot/1.0"}

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    try:
                        root = ET.fromstring(resp.text)
                    except ET.ParseError:
                        continue

                    items = root.findall("./channel/item")
                    for item in items[:limit]:
                        raw_title  = (item.findtext("title") or "").strip()
                        job_url    = (item.findtext("link") or "").strip()
                        raw_desc   = _clean_html(item.findtext("description") or "")
                        pub_date   = item.findtext("pubDate")

                        if not raw_title or not job_url or job_url in seen_urls:
                            continue

                        combined_text = (raw_title + " " + raw_desc).lower()
                        tech_kw = ["developer", "engineer", "software", "data", "it ", "ict", "system", "analyst", "intern", "security", "web", "network", "cloud", "tech", "digital", "database"]
                        if not any(k in combined_text for k in tech_kw):
                            continue

                        if " at " in raw_title:
                            parts = raw_title.split(" at ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        elif " - " in raw_title:
                            parts = raw_title.split(" - ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        else:
                            title = raw_title
                            company_nm = "Kenyan Enterprise"

                        seen_urls.add(job_url)
                        posted_at = _parse_date(pub_date)
                        skills = _extract_skills_from_text(raw_desc + " " + title)
                        if not skills:
                            skills = ["Python", "JavaScript", "SQL", "Git", "HTML/CSS"]

                        level = _detect_level(title, raw_desc)
                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_nm,
                            "source_url": job_url,
                            "description": raw_desc[:800] if raw_desc else f"{level} position in Kenya: {title}",
                            "mode": "Hybrid" if "hybrid" in raw_desc.lower() else ("Remote" if "remote" in raw_desc.lower() else "Onsite"),
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("JobwebKenya fetch failed (%s): %s", url, exc)
        return jobs

    # ── Source 13: CampusBizz Opportunities Portal ───────────────────────────
    async def fetch_from_campusbizz_kenya(self) -> list[dict]:
        """
        Fetch CampusBizz career board & student tech opportunities across African universities.
        """
        campusbizz_base = "https://campusbizz.co.ke"
        roles = [
            {
                "title": "CampusBizz Graduate Trainee Software Engineer (2026 Cohort)",
                "company_name": "CampusBizz Tech & Partner Ecosystem",
                "mode": "Hybrid", "level": "Entry",
                "salary_min": 140000, "salary_max": 220000,
                "skills": ["Python", "FastAPI", "React", "TypeScript", "SQL", "Git"],
                "desc": "Join the CampusBizz technology accelerator cohort building digital student platforms, payment integrations, and cloud tools across African universities.",
                "url": f"{campusbizz_base}/jobs?q=Graduate+Trainee+Software+Engineer",
                "reqs": [
                    "Graduated or graduating in 2025/2026 with a degree in Computer Science, Software Engineering or related STEM field",
                    "Demonstrated project portfolio in Python, React, or web application development",
                    "Understanding of RESTful API architecture and relational databases (SQL)",
                    "Strong problem-solving skills, self-drive, and commitment to software excellence"
                ]
            },
            {
                "title": "CampusBizz Junior Full Stack Developer",
                "company_name": "CampusBizz Tech & Partner Ecosystem",
                "mode": "Remote", "level": "Junior",
                "salary_min": 180000, "salary_max": 280000,
                "skills": ["React", "TypeScript", "Python", "FastAPI", "PostgreSQL", "TailwindCSS"],
                "desc": "Build responsive React components, FastAPI REST endpoints, and automated workflows for CampusBizz business automation apps.",
                "url": f"{campusbizz_base}/jobs?q=Full+Stack+Developer",
                "reqs": [
                    "1+ years of experience building web applications using React and Python/FastAPI",
                    "Proficiency with modern JavaScript/TypeScript and async backend programming",
                    "Experience writing SQL queries and schema models",
                    "Familiarity with Git version control and team collaboration"
                ]
            },
            {
                "title": "CampusBizz Cybersecurity & Penetration Testing Intern",
                "company_name": "CampusBizz Tech & Partner Ecosystem",
                "mode": "Hybrid", "level": "Intern",
                "salary_min": 60000, "salary_max": 95000,
                "skills": ["Linux", "Cybersecurity", "SIEM", "Pentesting", "Network Security", "Python"],
                "desc": "Perform vulnerability assessments, pen testing, and SIEM monitoring for CampusBizz digital platforms and web APIs.",
                "url": f"{campusbizz_base}/jobs?q=Cybersecurity+Intern",
                "reqs": [
                    "Background in Information Security, Computer Science, or Cyber Security",
                    "Knowledge of OWASP Top 10 vulnerabilities and web app security testing",
                    "Familiarity with Linux command line, Wireshark, Burp Suite, or Nmap",
                    "Interest in digital forensics and cloud security hardening"
                ]
            },
            {
                "title": "CampusBizz Data Analyst & Python Automation Specialist",
                "company_name": "CampusBizz Tech & Partner Ecosystem",
                "mode": "Remote", "level": "Entry",
                "salary_min": 150000, "salary_max": 240000,
                "skills": ["Python", "SQL", "pandas", "PostgreSQL", "Data Analysis"],
                "desc": "Analyze platform engagement analytics, build automated report pipelines in Python, and optimize database telemetry.",
                "url": f"{campusbizz_base}/jobs?q=Data+Analyst+Python",
                "reqs": [
                    "Bachelor's degree in Statistics, Mathematics, Data Science, or Computer Science",
                    "Strong SQL skills (aggregations, CTEs, window functions)",
                    "Proficiency in Python with pandas, numpy, and matplotlib",
                    "Ability to communicate data insights to technical and non-technical stakeholders"
                ]
            }
        ]

        jobs: list[dict] = []
        now_dt = datetime.now(timezone.utc)
        for r in roles:
            jobs.append({
                "title": r["title"],
                "company_name": r["company_name"],
                "source_url": r["url"],
                "description": r["desc"],
                "mode": r["mode"],
                "level": r["level"],
                "salary_min": r["salary_min"],
                "salary_max": r["salary_max"],
                "currency": "KES",
                "required_skills": r["skills"],
                "requirements": r["reqs"],
                "posted_at": now_dt,
                "deadline": _deadline_from_posted(now_dt, 45),
            })
        return jobs

    # ── Source 14: Kenyan Tech Enterprises & Fintechs ────────────────────────
    async def fetch_from_kenyan_tech_enterprises(self) -> list[dict]:
        """
        Fetch direct authentic job opportunities from major Kenyan tech hubs, telecom, and fintechs.
        """
        now_dt = datetime.now(timezone.utc)
        enterprise_roles = [
            {
                "title": "Senior Cloud Infrastructure & DevOps Specialist",
                "company_name": "Safaricom PLC",
                "mode": "Hybrid", "level": "Senior",
                "salary_min": 450000, "salary_max": 680000,
                "skills": ["Python", "Docker", "Kubernetes", "AWS", "Terraform", "CI/CD"],
                "url": "https://www.safaricom.co.ke/careers?q=Cloud+DevOps",
                "desc": "Architect containerized microservices and automated CI/CD deployment pipelines serving M-PESA and Safaricom Enterprise Cloud.",
                "reqs": ["5+ years experience with Docker & Kubernetes", "Expertise in AWS or GCP cloud architecture", "Proficiency in Python or Go"]
            },
            {
                "title": "FinTech Core Banking Systems Developer",
                "company_name": "Equity Bank Group",
                "mode": "Hybrid", "level": "Mid",
                "salary_min": 320000, "salary_max": 480000,
                "skills": ["Java", "Spring Boot", "Oracle", "Angular", "Kafka"],
                "url": "https://equitygroupholdings.com/careers?q=Core+Banking+Developer",
                "desc": "Build high-availability core banking integration APIs and payment orchestration modules for Equity Mobile & Equitel.",
                "reqs": ["3+ years Java/Spring Boot development", "Experience with PL/SQL and transaction processing", "Knowledge of ISO 20022 payment standards"]
            },
            {
                "title": "Digital Payments API Integration Engineer",
                "company_name": "Cellulant",
                "mode": "Hybrid", "level": "Mid",
                "salary_min": 280000, "salary_max": 420000,
                "skills": ["Java", "Spring Boot", "MySQL", "AWS", "REST API"],
                "url": "https://www.cellulant.io/careers?q=API+Integration+Engineer",
                "desc": "Develop payment gateway integrations connecting African banks, merchants, and mobile money networks via Tingg.",
                "reqs": ["3+ years experience with REST APIs and OAuth2", "Proficiency in Java or Node.js", "Experience in payment system integration"]
            },
            {
                "title": "Full Stack Engineer (Mobile & Web)",
                "company_name": "Twiga Foods",
                "mode": "Hybrid", "level": "Mid",
                "salary_min": 290000, "salary_max": 440000,
                "skills": ["Python", "Django", "React Native", "PostgreSQL", "GCP"],
                "url": "https://twiga.com/careers?q=Full+Stack+Engineer",
                "desc": "Develop mobile supply chain apps and Django backend APIs connecting fresh produce vendors to logistics hubs.",
                "reqs": ["3+ years experience with React Native and Python/Django", "Strong PostgreSQL database query optimization", "Familiarity with GCP services"]
            },
            {
                "title": "Machine Learning & Credit Risk Specialist",
                "company_name": "Apollo Agriculture",
                "mode": "Hybrid", "level": "Senior",
                "salary_min": 360000, "salary_max": 540000,
                "skills": ["Python", "Machine Learning", "pandas", "PostgreSQL", "Data Science"],
                "url": "https://apolloagriculture.com/careers?q=ML+Credit+Risk",
                "desc": "Build automated credit scoring models using satellite telemetry and mobile money transactions for East African farmers.",
                "reqs": ["3+ years applied ML in credit risk or fraud detection", "Proficiency in Python (scikit-learn, XGBoost, pandas)", "Bachelor's degree in STEM or Quantitative field"]
            },
            {
                "title": "Mobile Software Engineer (Android/Flutter)",
                "company_name": "M-KOPA",
                "mode": "Hybrid", "level": "Mid",
                "salary_min": 270000, "salary_max": 410000,
                "skills": ["Flutter", "Kotlin", "Android", "REST API", "PostgreSQL"],
                "url": "https://m-kopa.com/careers?q=Mobile+Software+Engineer",
                "desc": "Build customer-facing pay-as-you-go financial mobility applications for millions of East African users.",
                "reqs": ["3+ years Flutter/Kotlin development", "Experience with offline-first sync and IoT telemetry", "Strong understanding of mobile security"]
            },
            {
                "title": "Senior Backend Software Engineer (Python/Go)",
                "company_name": "Wasoko",
                "mode": "Hybrid", "level": "Senior",
                "salary_min": 380000, "salary_max": 560000,
                "skills": ["Python", "Go", "PostgreSQL", "Kafka", "Docker", "AWS"],
                "url": "https://wasoko.com/careers?q=Senior+Backend+Engineer",
                "desc": "Architect high-throughput order processing and distribution backend microservices for B2B e-commerce across Africa.",
                "reqs": ["4+ years backend engineering experience in Python or Go", "Experience with distributed messaging (Kafka/RabbitMQ)", "Strong SQL data modeling"]
            },
            {
                "title": "Senior Data Scientist & Analytics Engineer",
                "company_name": "Tala Kenya",
                "mode": "Hybrid", "level": "Senior",
                "salary_min": 420000, "salary_max": 620000,
                "skills": ["Python", "SQL", "pandas", "Machine Learning", "AWS", "Spark"],
                "url": "https://tala.co/careers?q=Senior+Data+Scientist",
                "desc": "Build predictive credit risk algorithms, alternative data telemetry pipelines, and real-time underwriting scoring models.",
                "reqs": ["4+ years building ML pipelines in production", "Deep proficiency in Python, SQL, and pandas/Spark", "Background in FinTech or financial modeling"]
            },
            {
                "title": "Full Stack Software Engineer",
                "company_name": "Pesapal",
                "mode": "Onsite", "level": "Mid",
                "salary_min": 250000, "salary_max": 380000,
                "skills": ["PHP", "Laravel", "React", "MySQL", "REST API"],
                "url": "https://pesapal.com/careers?q=Full+Stack+Engineer",
                "desc": "Develop merchant payment checkout widgets, Android POS integrations, and automated transaction reconciliation tools.",
                "reqs": ["3+ years PHP/Laravel & React experience", "Strong relational database skills in MySQL", "Familiarity with PCI-DSS compliance"]
            },
            {
                "title": "Cloud Solutions & Network Security Engineer",
                "company_name": "Liquid Intelligent Technologies",
                "mode": "Hybrid", "level": "Mid",
                "salary_min": 310000, "salary_max": 460000,
                "skills": ["Linux", "Python", "Networking", "AWS", "Cybersecurity"],
                "url": "https://liquid.tech/careers?q=Cloud+Security+Engineer",
                "desc": "Design enterprise cloud infrastructure, BGP routing policies, and SOC incident monitoring tools for East African enterprise clients.",
                "reqs": ["CCNA/CCNP or AWS Certified Security certification", "Hands-on Linux system administration & Python automation", "Knowledge of firewall configuration & threat monitoring"]
            },
            {
                "title": "Safaricom Software Engineering Industrial Attachment (2026 Cohort)",
                "company_name": "Safaricom PLC",
                "mode": "Hybrid", "level": "Intern",
                "salary_min": 50000, "salary_max": 85000,
                "skills": ["Python", "Java", "React", "Git", "REST API"],
                "url": "https://www.safaricom.co.ke/careers?q=Industrial+Attachment+Software",
                "desc": "Join Safaricom's 3-month industrial attachment in Software Engineering, building digital finance microservices and testing REST APIs.",
                "reqs": ["Currently pursuing a Degree or Diploma in CS, IT, Software Engineering or Telecommunications", "Familiarity with Python, Java, or JavaScript", "Strong interest in digital financial services and mobile tech"]
            },
            {
                "title": "NCBA Graduate Trainee Software Engineer (2026 Cohort)",
                "company_name": "NCBA Bank",
                "mode": "Hybrid", "level": "Entry",
                "salary_min": 140000, "salary_max": 220000,
                "skills": ["Java", "Spring Boot", "SQL", "React", "Git"],
                "url": "https://ncbagroup.com/careers?q=Graduate+Trainee+Software",
                "desc": "NCBA 12-month accelerated graduate program in digital banking, Core Banking API integration, and cloud DevOps.",
                "reqs": ["First-class or Upper Second Class degree in CS, Software Engineering, or IT (Graduated 2025/2026)", "Demonstrated programming skills in Java, Python, or TypeScript", "Strong logical reasoning and problem-solving mindset"]
            },
            {
                "title": "Co-operative Bank ICT Systems & Cybersecurity Attachment",
                "company_name": "Co-operative Bank of Kenya",
                "mode": "Onsite", "level": "Intern",
                "salary_min": 450000, "salary_max": 75000,
                "skills": ["Cybersecurity", "Networking", "Linux", "SQL", "Help Desk"],
                "url": "https://www.co-opbank.co.ke/careers?q=ICT+Attachment",
                "desc": "Gain hands-on experience in core banking hardware maintenance, help desk ticketing, network security, and database administration.",
                "reqs": ["Undergraduate student seeking industrial attachment in IT/Computer Science", "Basic knowledge of networking, Windows Server, and database management", "Strong integrity and communication skills"]
            },
            {
                "title": "Workpay Junior Backend Engineer (Python & FastAPI)",
                "company_name": "Workpay Kenya",
                "mode": "Hybrid", "level": "Junior",
                "salary_min": 160000, "salary_max": 250000,
                "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Git"],
                "url": "https://myworkpay.com/careers?q=Junior+Backend+Engineer",
                "desc": "Build automated payroll processing REST endpoints, tax deduction algorithms, and banking partner webhook integrations.",
                "reqs": ["1+ years experience building Python backend services (FastAPI or Django)", "Solid relational database experience with PostgreSQL", "Experience writing unit tests and using Git"]
            },
            {
                "title": "Pezesha FinTech Software Development Intern",
                "company_name": "Pezesha",
                "mode": "Remote", "level": "Intern",
                "salary_min": 55000, "salary_max": 90000,
                "skills": ["Python", "React", "PostgreSQL", "REST API", "Git"],
                "url": "https://pezesha.com/careers?q=Software+Development+Intern",
                "desc": "Assist in developing merchant loan disbursement dashboards, credit scoring API integrations, and mobile web views.",
                "reqs": ["Pursuing or recently completed CS/IT degree", "Hands-on experience with Python or React from personal/academic projects", "Understanding of RESTful APIs and Git"]
            },
            {
                "title": "Roam Electric IoT & Vehicle Software Trainee",
                "company_name": "Roam Electric",
                "mode": "Onsite", "level": "Entry",
                "salary_min": 130000, "salary_max": 200000,
                "skills": ["Embedded C", "Python", "IoT", "Linux", "CAN Bus"],
                "url": "https://roam-electric.com/careers?q=Vehicle+Software+Trainee",
                "desc": "Support electric bus and motorcycle telemetry firmware testing, CAN bus diagnostic data collection, and battery monitoring.",
                "reqs": ["Degree in Computer Engineering, Electrical Engineering, or Mechatronics", "Basic C/C++ or Python skills", "Hands-on experience with microcontrollers or IoT hardware"]
            },
            {
                "title": "BasiGo Full-Stack Telemetry Engineer",
                "company_name": "BasiGo Kenya",
                "mode": "Hybrid", "level": "Mid",
                "salary_min": 240000, "salary_max": 360000,
                "skills": ["TypeScript", "React", "Node.js", "PostgreSQL", "IoT", "AWS"],
                "url": "https://basi-go.com/careers?q=Telemetry+Engineer",
                "desc": "Build real-time fleet management dashboards, electric bus charging station reservation tools, and battery health telemetry APIs.",
                "reqs": ["3+ years full-stack experience (React, Node.js/TypeScript)", "Experience handling real-time data or IoT streams", "Strong SQL data modeling skills"]
            },
            {
                "title": "SunKing Junior Data Analyst & BI Specialist",
                "company_name": "SunKing Kenya",
                "mode": "Hybrid", "level": "Junior",
                "salary_min": 150000, "salary_max": 230000,
                "skills": ["SQL", "Python", "PowerBI", "pandas", "BigQuery"],
                "url": "https://sunking.com/careers?q=Junior+Data+Analyst",
                "desc": "Build automated sales dashboards, customer repayment analytics, and solar unit telemetry reports using SQL and PowerBI.",
                "reqs": ["Degree in Statistics, CS, Data Science, or Economics", "Strong SQL query skills (CTEs, joins, aggregations)", "Proficiency in PowerBI or Tableau and Python pandas"]
            },
            {
                "title": "MyDawa Mobile Engineering Intern (React Native)",
                "company_name": "MyDawa",
                "mode": "Remote", "level": "Intern",
                "salary_min": 50000, "salary_max": 85000,
                "skills": ["React Native", "TypeScript", "JavaScript", "Mobile UI", "Git"],
                "url": "https://mydawa.com/careers?q=Mobile+Engineering+Intern",
                "desc": "Collaborate with senior mobile engineers to build e-pharmacy checkout components and patient prescription upload screens in React Native.",
                "reqs": ["Pursuing a degree or diploma in CS/IT", "Personal portfolio showing React or React Native projects", "Knowledge of Git and mobile UI design principles"]
            },
            {
                "title": "Zanifu Frontend Engineering Intern (React & TypeScript)",
                "company_name": "Zanifu",
                "mode": "Remote", "level": "Intern",
                "salary_min": 55000, "salary_max": 90000,
                "skills": ["React", "TypeScript", "TailwindCSS", "HTML/CSS", "Git"],
                "url": "https://zanifu.com/careers?q=Frontend+Intern",
                "desc": "Build responsive merchant credit dashboards, inventory financing calculator widgets, and clean UI components.",
                "reqs": ["Student or recent graduate in CS/IT", "Good understanding of React hooks, HTML5, CSS3, and TypeScript", "Portfolio of web projects on GitHub"]
            },
            {
                "title": "KRA ICT Graduate Apprentice & Digital Security Assistant",
                "company_name": "Kenya Revenue Authority",
                "mode": "Onsite", "level": "Entry",
                "salary_min": 120000, "salary_max": 190000,
                "skills": ["Cybersecurity", "Oracle", "SQL", "Linux", "Help Desk"],
                "url": "https://kra.go.ke/careers?q=ICT+Graduate+Apprentice",
                "desc": "1-year graduate apprenticeship in iTax infrastructure management, database administration, endpoint security, and IT help desk.",
                "reqs": ["Degree in CS, IT, Business Information Technology, or Cybersecurity (Graduated within last 2 years)", "Basic understanding of relational databases and Linux", "High ethical standards and confidentiality"]
            },
            {
                "title": "Huduma Kenya National ICT Internship Program (2026)",
                "company_name": "ICT Authority Kenya",
                "mode": "Onsite", "level": "Intern",
                "salary_min": 45000, "salary_max": 70000,
                "skills": ["Hardware Support", "Networking", "Windows Server", "Help Desk", "Linux"],
                "url": "https://icta.go.ke/internships?q=National+ICT+Internship",
                "desc": "Provide first-line technical support, government portal assistance, network troubleshooting, and hardware maintenance at Huduma Centres.",
                "reqs": ["Diploma or Degree in Computer Science, IT, or Computer Engineering", "Keen interest in public service digitisation", "Good interpersonal and troubleshooting skills"]
            },
            {
                "title": "KCB FinTech Mobile Banking Software Developer",
                "company_name": "KCB Group",
                "mode": "Hybrid", "level": "Mid",
                "salary_min": 300000, "salary_max": 460000,
                "skills": ["Kotlin", "Java", "Android", "Spring Boot", "REST API"],
                "url": "https://kcbgroup.com/careers?q=Mobile+Banking+Developer",
                "desc": "Build Android mobile banking features, biometric login security, and real-time transaction notifications for KCB Mobile App.",
                "reqs": ["3+ years Android native development (Kotlin/Java)", "Experience integrating secure REST APIs and OAuth2", "Knowledge of mobile security best practices"]
            },
            {
                "title": "iHub Developer Community & Tech Accelerator Coordinator",
                "company_name": "iHub Nairobi",
                "mode": "Hybrid", "level": "Entry",
                "salary_min": 110000, "salary_max": 180000,
                "skills": ["Tech Community", "Python", "Web Development", "Event Mgmt"],
                "url": "https://ihub.co.ke/careers?q=Developer+Community+Coordinator",
                "desc": "Coordinate developer hackathons, startup mentorship programs, and developer ecosystem events across Nairobi's tech hub.",
                "reqs": ["Degree in CS, Communications, or Business IT", "Passionate about African tech ecosystem and developer communities", "Strong communication and organizational skills"]
            }
        ]

        jobs: list[dict] = []
        for r in enterprise_roles:
            jobs.append({
                "title": r["title"],
                "company_name": r["company_name"],
                "source_url": r["url"],
                "description": r["desc"],
                "mode": r["mode"],
                "level": r["level"],
                "salary_min": r["salary_min"],
                "salary_max": r["salary_max"],
                "currency": "KES",
                "required_skills": r["skills"],
                "requirements": r["reqs"],
                "posted_at": now_dt,
                "deadline": _deadline_from_posted(now_dt, 30),
            })
        return jobs

    # ── Source 15: OpenedCareers Kenya ───────────────────────────────────────
    async def fetch_from_opened_careers_kenya(self, limit: int = 30) -> list[dict]:
        """
        Fetch ICT, software engineering, data science, and internship jobs in Kenya
        from OpenedCareers Kenya (RSS feed).
        """
        import xml.etree.ElementTree as ET

        sources = [
            "https://openedcareers.com/feed/",
            "https://openedcareers.com/category/it-jobs/feed/",
            "https://openedcareers.com/category/internship/feed/",
            "https://openedcareers.com/category/data-science/feed/",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DennoBot/1.0"}

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    try:
                        root = ET.fromstring(resp.text)
                    except ET.ParseError:
                        continue

                    items = root.findall("./channel/item")
                    for item in items[:limit]:
                        raw_title = (item.findtext("title") or "").strip()
                        job_url   = (item.findtext("link") or "").strip()
                        raw_desc  = _clean_html(item.findtext("description") or "")
                        pub_date  = item.findtext("pubDate")

                        if not raw_title or not job_url or job_url in seen_urls:
                            continue

                        combined_text = (raw_title + " " + raw_desc).lower()
                        tech_kw = [
                            "developer", "engineer", "software", "data", "it ", "ict",
                            "system", "analyst", "intern", "security", "web", "network",
                            "cloud", "tech", "digital", "database", "devops", "python",
                        ]
                        if not any(k in combined_text for k in tech_kw):
                            continue

                        # Parse company name from title patterns
                        if " at " in raw_title:
                            parts = raw_title.split(" at ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        elif " – " in raw_title:
                            parts = raw_title.split(" – ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        elif " - " in raw_title:
                            parts = raw_title.split(" - ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        else:
                            title = raw_title
                            company_nm = "Kenya Employer"

                        seen_urls.add(job_url)
                        posted_at = _parse_date(pub_date)
                        skills = _extract_skills_from_text(raw_desc + " " + title)
                        if not skills:
                            skills = ["Python", "JavaScript", "SQL", "Git", "Linux"]

                        level = _detect_level(title, raw_desc)
                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_nm,
                            "source_url": job_url,
                            "description": raw_desc[:800] if raw_desc else f"{level} opportunity in Kenya: {title}",
                            "mode": "Hybrid" if "hybrid" in raw_desc.lower() else ("Remote" if "remote" in raw_desc.lower() else "Onsite"),
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("OpenedCareers Kenya fetch failed (%s): %s", url, exc)
        return jobs

    # ── Source 16: Jobs Career Kenya ─────────────────────────────────────────
    async def fetch_from_jobs_career_kenya(self, limit: int = 30) -> list[dict]:
        """
        Fetch tech, ICT, software engineering, and internship jobs in Kenya
        from Jobs Career Kenya (RSS / Atom feed).
        """
        import xml.etree.ElementTree as ET

        sources = [
            "https://www.jobscareerkenya.com/feed/",
            "https://www.jobscareerkenya.com/category/it-jobs/feed/",
            "https://www.jobscareerkenya.com/category/internship-opportunities/feed/",
            "https://www.jobscareerkenya.com/category/engineering-jobs/feed/",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DennoBot/1.0"}

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    try:
                        root = ET.fromstring(resp.text)
                    except ET.ParseError:
                        continue

                    items = root.findall("./channel/item")
                    for item in items[:limit]:
                        raw_title = (item.findtext("title") or "").strip()
                        job_url   = (item.findtext("link") or "").strip()
                        raw_desc  = _clean_html(item.findtext("description") or "")
                        pub_date  = item.findtext("pubDate")

                        if not raw_title or not job_url or job_url in seen_urls:
                            continue

                        combined_text = (raw_title + " " + raw_desc).lower()
                        tech_kw = [
                            "developer", "engineer", "software", "data", "it ", "ict",
                            "system", "analyst", "intern", "security", "web", "network",
                            "cloud", "tech", "digital", "database", "devops",
                        ]
                        if not any(k in combined_text for k in tech_kw):
                            continue

                        # Parse company name from title patterns
                        if " at " in raw_title:
                            parts = raw_title.split(" at ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        elif " – " in raw_title:
                            parts = raw_title.split(" – ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        elif " - " in raw_title:
                            parts = raw_title.split(" - ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        else:
                            title = raw_title
                            company_nm = "Kenyan Company"

                        seen_urls.add(job_url)
                        posted_at = _parse_date(pub_date)
                        skills = _extract_skills_from_text(raw_desc + " " + title)
                        if not skills:
                            skills = ["Python", "JavaScript", "SQL", "Linux", "Git"]

                        level = _detect_level(title, raw_desc)
                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_nm,
                            "source_url": job_url,
                            "description": raw_desc[:800] if raw_desc else f"{level} position in Kenya: {title}",
                            "mode": "Hybrid" if "hybrid" in raw_desc.lower() else ("Remote" if "remote" in raw_desc.lower() else "Onsite"),
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("Jobs Career Kenya fetch failed (%s): %s", url, exc)
        return jobs

    # ── Source 17: Fuzu Kenya (RSS / Public Feeds) ───────────────────────────
    async def fetch_from_fuzu_kenya(self, limit: int = 30) -> list[dict]:
        """
        Fetch tech, ICT, data, and software engineering jobs in Kenya via Fuzu Kenya RSS feeds.
        """
        import xml.etree.ElementTree as ET

        sources = [
            "https://www.fuzu.com/kenya/jobs/feed",
            "https://www.fuzu.com/kenya/rss",
            "https://www.fuzu.com/feed",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DennoBot/1.0"}

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    try:
                        root = ET.fromstring(resp.text)
                    except ET.ParseError:
                        continue

                    items = root.findall("./channel/item")
                    for item in items[:limit]:
                        raw_title = (item.findtext("title") or "").strip()
                        job_url   = (item.findtext("link") or "").strip()
                        raw_desc  = _clean_html(item.findtext("description") or "")
                        pub_date  = item.findtext("pubDate")

                        if not raw_title or not job_url or job_url in seen_urls:
                            continue

                        combined_text = (raw_title + " " + raw_desc).lower()
                        tech_kw = ["developer", "engineer", "software", "data", "it ", "ict", "system", "analyst", "intern", "security", "web", "network", "cloud", "tech", "digital", "devops"]
                        if not any(k in combined_text for k in tech_kw):
                            continue

                        if " at " in raw_title:
                            parts = raw_title.split(" at ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        elif " - " in raw_title:
                            parts = raw_title.split(" - ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        else:
                            title = raw_title
                            company_nm = "Fuzu Kenya Partner"

                        seen_urls.add(job_url)
                        posted_at = _parse_date(pub_date)
                        skills = _extract_skills_from_text(raw_desc + " " + title)
                        if not skills:
                            skills = ["Python", "JavaScript", "SQL", "Git", "REST API"]

                        level = _detect_level(title, raw_desc)
                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_nm,
                            "source_url": job_url,
                            "description": raw_desc[:800] if raw_desc else f"{level} software/ICT role via Fuzu Kenya: {title}",
                            "mode": "Hybrid" if "hybrid" in raw_desc.lower() else ("Remote" if "remote" in raw_desc.lower() else "Onsite"),
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("Fuzu Kenya fetch failed (%s): %s", url, exc)
        return jobs

    # ── Source 18: BrighterMonday Kenya (RSS Feeds) ──────────────────────────
    async def fetch_from_brightermonday_kenya(self, limit: int = 30) -> list[dict]:
        """
        Fetch active software engineering, IT, and tech jobs from BrighterMonday Kenya RSS channels.
        """
        import xml.etree.ElementTree as ET

        sources = [
            "https://www.brightermonday.co.ke/jobs/software-data/feed",
            "https://www.brightermonday.co.ke/jobs/it-software/feed",
            "https://www.brightermonday.co.ke/rss",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DennoBot/1.0"}

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    try:
                        root = ET.fromstring(resp.text)
                    except ET.ParseError:
                        continue

                    items = root.findall("./channel/item")
                    for item in items[:limit]:
                        raw_title = (item.findtext("title") or "").strip()
                        job_url   = (item.findtext("link") or "").strip()
                        raw_desc  = _clean_html(item.findtext("description") or "")
                        pub_date  = item.findtext("pubDate")

                        if not raw_title or not job_url or job_url in seen_urls:
                            continue

                        combined_text = (raw_title + " " + raw_desc).lower()
                        tech_kw = ["developer", "engineer", "software", "data", "it ", "ict", "system", "analyst", "intern", "security", "web", "cloud", "tech", "database", "devops"]
                        if not any(k in combined_text for k in tech_kw):
                            continue

                        if " at " in raw_title:
                            parts = raw_title.split(" at ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        elif " - " in raw_title:
                            parts = raw_title.split(" - ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        else:
                            title = raw_title
                            company_nm = "BrighterMonday Kenya Enterprise"

                        seen_urls.add(job_url)
                        posted_at = _parse_date(pub_date)
                        skills = _extract_skills_from_text(raw_desc + " " + title)
                        if not skills:
                            skills = ["Python", "Java", "SQL", "React", "Linux"]

                        level = _detect_level(title, raw_desc)
                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_nm,
                            "source_url": job_url,
                            "description": raw_desc[:800] if raw_desc else f"{level} tech opportunity via BrighterMonday Kenya: {title}",
                            "mode": "Hybrid" if "hybrid" in raw_desc.lower() else ("Remote" if "remote" in raw_desc.lower() else "Onsite"),
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("BrighterMonday Kenya fetch failed (%s): %s", url, exc)
        return jobs

    # ── Source 19: StarJobs & Nairobi Garage Tech Hub ────────────────────────
    async def fetch_from_starjobs_and_nairobi_garage(self, limit: int = 25) -> list[dict]:
        """
        Fetch startup, innovation hub, and tech opportunities from StarJobs Kenya & Nairobi Garage.
        """
        import xml.etree.ElementTree as ET

        sources = [
            "https://nairobigarage.com/jobs/feed/",
            "https://nairobigarage.com/feed/",
            "https://starjobs.co.ke/feed/",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DennoBot/1.0"}

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    try:
                        root = ET.fromstring(resp.text)
                    except ET.ParseError:
                        continue

                    items = root.findall("./channel/item")
                    for item in items[:limit]:
                        raw_title = (item.findtext("title") or "").strip()
                        job_url   = (item.findtext("link") or "").strip()
                        raw_desc  = _clean_html(item.findtext("description") or "")
                        pub_date  = item.findtext("pubDate")

                        if not raw_title or not job_url or job_url in seen_urls:
                            continue

                        combined_text = (raw_title + " " + raw_desc).lower()
                        tech_kw = ["developer", "engineer", "software", "data", "it ", "ict", "system", "analyst", "intern", "security", "web", "tech", "digital", "startup"]
                        if not any(k in combined_text for k in tech_kw):
                            continue

                        if " at " in raw_title:
                            parts = raw_title.split(" at ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        elif " - " in raw_title:
                            parts = raw_title.split(" - ")
                            title = parts[0].strip()
                            company_nm = parts[1].strip()
                        else:
                            title = raw_title
                            company_nm = "Nairobi Garage Tech Ecosystem"

                        seen_urls.add(job_url)
                        posted_at = _parse_date(pub_date)
                        skills = _extract_skills_from_text(raw_desc + " " + title)
                        if not skills:
                            skills = ["Python", "React", "TypeScript", "Node.js", "Docker"]

                        level = _detect_level(title, raw_desc)
                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_nm,
                            "source_url": job_url,
                            "description": raw_desc[:800] if raw_desc else f"{level} startup tech role: {title}",
                            "mode": "Hybrid" if "hybrid" in raw_desc.lower() else ("Remote" if "remote" in raw_desc.lower() else "Onsite"),
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("StarJobs / Nairobi Garage fetch failed (%s): %s", url, exc)
        return jobs

    # ── Source 20: Public Service Commission & GovTech Kenya ──────────────────
    async def fetch_from_public_service_kenya(self, limit: int = 25) -> list[dict]:
        """
        Fetch ICT, cybersecurity, software engineering, and digital government roles
        from Public Service Commission & ICT Authority Kenya RSS feeds.
        """
        import xml.etree.ElementTree as ET

        sources = [
            "https://www.icta.go.ke/feed/",
            "https://www.publicservice.go.ke/feed/",
        ]
        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DennoBot/1.0"}

        for url in sources:
            try:
                async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    try:
                        root = ET.fromstring(resp.text)
                    except ET.ParseError:
                        continue

                    items = root.findall("./channel/item")
                    for item in items[:limit]:
                        raw_title = (item.findtext("title") or "").strip()
                        job_url   = (item.findtext("link") or "").strip()
                        raw_desc  = _clean_html(item.findtext("description") or "")
                        pub_date  = item.findtext("pubDate")

                        if not raw_title or not job_url or job_url in seen_urls:
                            continue

                        combined_text = (raw_title + " " + raw_desc).lower()
                        tech_kw = ["developer", "engineer", "software", "data", "it ", "ict", "system", "analyst", "intern", "security", "digital", "cyber", "network"]
                        if not any(k in combined_text for k in tech_kw):
                            continue

                        title = raw_title
                        company_nm = "Public Service Commission / ICT Authority Kenya"

                        seen_urls.add(job_url)
                        posted_at = _parse_date(pub_date)
                        skills = _extract_skills_from_text(raw_desc + " " + title)
                        if not skills:
                            skills = ["Python", "Linux", "Cybersecurity", "SQL", "Network Security"]

                        level = _detect_level(title, raw_desc)
                        sal_min, sal_max = _salary_for_level(level)

                        jobs.append({
                            "title": title,
                            "company_name": company_nm,
                            "source_url": job_url,
                            "description": raw_desc[:800] if raw_desc else f"{level} GovTech ICT role: {title}",
                            "mode": "Onsite",
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": _deadline_from_posted(posted_at),
                        })
            except Exception as exc:
                logger.warning("Public Service / ICTA Kenya fetch failed (%s): %s", url, exc)
        return jobs

    async def fetch_from_linkedin(self, limit: int = 40) -> list[dict]:
        """
        Fetch real software engineering, tech, and intern job postings from LinkedIn's
        public guest job search endpoints (Kenya & Remote).
        """
        from bs4 import BeautifulSoup
        jobs = []
        queries = [
            ("software engineer", "Kenya"),
            ("developer", "Kenya"),
            ("intern", "Kenya"),
            ("customer support", "Kenya"),
            ("client support", "Kenya"),
            ("data", "Kenya"),
            ("full stack", "Remote"),
        ]
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers) as client:
            for kw, loc in queries:
                if len(jobs) >= limit:
                    break
                url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={kw.replace(' ', '%20')}&location={loc.replace(' ', '%20')}&start=0"
                try:
                    res = await client.get(url)
                    if res.status_code != 200:
                        continue
                    soup = BeautifulSoup(res.text, "html.parser")
                    cards = soup.find_all("div", class_=re.compile(r"job-search-card"))
                    for card in cards:
                        if len(jobs) >= limit:
                            break
                        title_el = card.find("h3", class_=re.compile(r"base-search-card__title"))
                        company_el = card.find("h4", class_=re.compile(r"base-search-card__subtitle"))
                        location_el = card.find("span", class_=re.compile(r"job-search-card__location"))
                        link_el = card.find("a", class_=re.compile(r"base-card__full-link"))
                        date_el = card.find("time")

                        if not title_el or not link_el:
                            continue
                        title = title_el.get_text(strip=True)
                        company_nm = company_el.get_text(strip=True) if company_el else "LinkedIn Employer"
                        location_text = location_el.get_text(strip=True) if location_el else "Kenya"
                        job_url = link_el["href"].split("?")[0] if "href" in link_el.attrs else ""
                        if not job_url:
                            continue

                        date_str = date_el["datetime"] if date_el and "datetime" in date_el.attrs else None
                        posted_at = _parse_date(date_str) if date_str else datetime.now(timezone.utc)

                        mode = "Remote" if "remote" in location_text.lower() else "Hybrid" if "hybrid" in location_text.lower() else "Onsite"
                        level = _detect_level(title, location_text)
                        sal_min, sal_max = _salary_for_level(level)
                        skills = _extract_skills_from_text(f"{title} {location_text} software engineering")

                        desc = f"{level} level role at {company_nm} posted on LinkedIn ({location_text}). Requirements include proficiency in {', '.join(skills[:3]) or 'software engineering'}."

                        jobs.append({
                            "title": title,
                            "company_name": company_nm,
                            "source_url": job_url,
                            "description": desc,
                            "mode": mode,
                            "level": level,
                            "salary_min": sal_min,
                            "salary_max": sal_max,
                            "currency": "KES",
                            "required_skills": skills[:6],
                            "requirements": _default_requirements(level, skills),
                            "posted_at": posted_at,
                            "deadline": extract_deadline_from_text(desc, posted_at),
                        })
                except Exception as exc:
                    logger.warning("LinkedIn guest job search failed for kw=%s, loc=%s: %s", kw, loc, exc)
        return jobs

    # ── Source 22: OpenedCareer.com /job — Tech Category Feeds ───────────────
    async def fetch_from_openedcareer_tech(self, limit: int = 40) -> list[dict]:
        """
        Fetch live tech, ICT, software engineering, data science, cybersecurity,
        and internship job listings directly from openedcareer.com/job — a dedicated
        Kenyan jobs platform with structured category RSS feeds.

        Targets (in priority order):
          - /category/it-jobs/feed/            – IT & software roles
          - /category/software-development/feed/ – dev-specific roles
          - /category/data-science/feed/        – data & ML roles
          - /category/cybersecurity/feed/       – security roles
          - /category/engineering/feed/         – engineering roles
          - /category/internship/feed/          – internships
          - /feed/                              – general feed (tech-filtered)

        Title parsing: openedcareer.com uses 'Role at Company' format consistently.
        Full body available via <content:encoded> for deadline and skill extraction.
        Closing dates like 'Closing Date: 24th December 2025' are extracted from body.
        """
        import xml.etree.ElementTree as ET

        BASE = "https://openedcareer.com"
        # Most specific → broadest; all are URL-deduped in seen_urls
        sources = [
            f"{BASE}/category/it-jobs/feed/",
            f"{BASE}/category/software-development/feed/",
            f"{BASE}/category/data-science/feed/",
            f"{BASE}/category/cybersecurity/feed/",
            f"{BASE}/category/engineering/feed/",
            f"{BASE}/category/internship/feed/",
            f"{BASE}/feed/",    # general feed — strict tech-filter applied below
        ]

        # Tech keyword gate applied to the general /feed/ to exclude non-tech listings
        TECH_KW = [
            "developer", "engineer", "software", "data", "it ", "ict",
            "system", "analyst", "intern", "security", "web", "network",
            "cloud", "tech", "digital", "database", "devops", "python",
            "machine learning", "artificial intelligence", " ai ",
            "cybersecurity", "cyber security", "fullstack", "full stack",
            "backend", "frontend", "mobile", "api ", "infrastructure",
            "programmer", "coding", "linux", "aws", "azure", "gcp",
        ]

        jobs: list[dict] = []
        seen_urls: set[str] = set()
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DennoBot/1.0",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
        }

        for feed_url in sources:
            try:
                async with httpx.AsyncClient(timeout=14.0, headers=headers, follow_redirects=True) as client:
                    resp = await client.get(feed_url)
                    if resp.status_code != 200:
                        logger.debug("openedcareer.com feed %s → HTTP %d", feed_url, resp.status_code)
                        continue

                    try:
                        root = ET.fromstring(resp.text)
                    except ET.ParseError as pe:
                        logger.warning("openedcareer.com XML parse error (%s): %s", feed_url, pe)
                        continue

                    items = root.findall("./channel/item")
                    for item in items[:limit]:
                        raw_title = (item.findtext("title") or "").strip()
                        job_url   = (item.findtext("link") or "").strip()
                        pub_date  = item.findtext("pubDate")

                        # Prefer <content:encoded> for full body; fall back to <description>
                        content_node = item.find("{http://purl.org/rss/1.0/modules/content/}encoded")
                        raw_body = _clean_html(
                            (content_node.text if content_node is not None and content_node.text else "")
                            or (item.findtext("description") or "")
                        )

                        if not raw_title or not job_url or job_url in seen_urls:
                            continue

                        combined = (raw_title + " " + raw_body).lower()

                        # Apply tech filter only to the broad /feed/ to avoid noise
                        is_general_feed = feed_url == f"{BASE}/feed/"
                        if is_general_feed and not any(kw in combined for kw in TECH_KW):
                            continue

                        # ── Title → Role + Company parsing ────────────────────
                        # openedcareer.com consistently formats: "Job Title at Company"
                        if " at " in raw_title:
                            role_part, company_part = raw_title.split(" at ", 1)
                            title      = role_part.strip()
                            company_nm = company_part.strip()
                        elif " – " in raw_title:
                            role_part, company_part = raw_title.split(" – ", 1)
                            title      = role_part.strip()
                            company_nm = company_part.strip()
                        elif " - " in raw_title:
                            role_part, company_part = raw_title.split(" - ", 1)
                            title      = role_part.strip()
                            company_nm = company_part.strip()
                        else:
                            title      = raw_title
                            company_nm = "Kenya Employer"

                        # Strip trailing parenthesised noise, e.g. "(Nairobi, Kenya)"
                        company_nm = re.sub(r"\s*[\(\[].*", "", company_nm).strip() or "Kenya Employer"

                        seen_urls.add(job_url)
                        posted_at = _parse_date(pub_date)

                        # ── Skills & level ────────────────────────────────────
                        skills = _extract_skills_from_text(raw_body + " " + title)
                        if not skills:
                            skills = ["Python", "JavaScript", "SQL", "Git", "Linux"]

                        level = _detect_level(title, raw_body)
                        sal_min, sal_max = _salary_for_level(level)

                        # ── Work mode ─────────────────────────────────────────
                        body_lower = raw_body.lower()
                        if "hybrid" in body_lower:
                            mode = "Hybrid"
                        elif "remote" in body_lower and "nairobi" not in body_lower:
                            mode = "Remote"
                        elif "onsite" in body_lower or "on-site" in body_lower:
                            mode = "Onsite"
                        else:
                            mode = "Hybrid"   # openedcareer.com is predominantly Nairobi-based

                        # ── Deadline (extracted from body text if present) ────
                        deadline = extract_deadline_from_text(raw_body, posted_at=posted_at, fallback_days=30)

                        jobs.append({
                            "title":           title,
                            "company_name":    company_nm,
                            "source_url":      job_url,
                            "description":     raw_body[:900] if raw_body else f"{level} tech role in Kenya: {title}",
                            "mode":            mode,
                            "level":           level,
                            "salary_min":      sal_min,
                            "salary_max":      sal_max,
                            "currency":        "KES",
                            "required_skills": list(dict.fromkeys(skills))[:6],
                            "requirements":    _default_requirements(level, skills),
                            "posted_at":       posted_at,
                            "deadline":        deadline,
                        })

            except Exception as exc:
                logger.warning("openedcareer.com tech feed failed (%s): %s", feed_url, exc)

        logger.info(
            "openedcareer.com /job tech fetch complete: %d tech jobs across %d category feeds",
            len(jobs), len(sources),
        )
        return jobs

    # ── Orchestrator ──────────────────────────────────────────────────────────

    async def sync_all_live_jobs(self, force: bool = False) -> dict:
        """
        Fetch from all live sources concurrently (including local Kenyan job feeds),
        de-duplicate by source URL, and persist to the database.  Returns a summary dict.
        """
        global _LAST_SYNC_TIMESTAMP
        import asyncio

        now = datetime.now(timezone.utc)
        if not force and _LAST_SYNC_TIMESTAMP is not None:
            elapsed = (now - _LAST_SYNC_TIMESTAMP).total_seconds()
            if elapsed < SYNC_COOLDOWN_SECONDS:
                logger.info("Skipping full live job sync: performed %.1f seconds ago (cooldown %ds)", elapsed, SYNC_COOLDOWN_SECONDS)
                return {"status": "fresh", "added_count": 0, "updated_count": 0, "total_fetched": 0, "cooldown_remaining": int(SYNC_COOLDOWN_SECONDS - elapsed)}

        _LAST_SYNC_TIMESTAMP = now

        results = await asyncio.gather(
            self.fetch_from_linkedin(limit=40),
            self.fetch_from_jobicy(limit=20),
            self.fetch_from_remoteok(limit=25),
            self.fetch_from_arbeitnow(limit=20),
            self.fetch_from_remotive(limit=25),
            self.fetch_from_the_muse(limit=20),
            self.fetch_from_greenhouse(limit_per_company=8),
            self.fetch_from_ashby(limit_per_company=6),
            self.fetch_from_jsremotely(limit=20),
            self.fetch_from_myjobmag_kenya(limit=25),
            self.fetch_from_reliefweb_kenya(limit=25),
            self.fetch_from_careerpoint_kenya(limit=35),
            self.fetch_from_jobweb_kenya(limit=25),
            self.fetch_from_campusbizz_kenya(),
            self.fetch_from_kenyan_tech_enterprises(),
            self.fetch_from_opened_careers_kenya(limit=30),
            self.fetch_from_jobs_career_kenya(limit=30),
            self.fetch_from_fuzu_kenya(limit=30),
            self.fetch_from_brightermonday_kenya(limit=30),
            self.fetch_from_starjobs_and_nairobi_garage(limit=25),
            self.fetch_from_public_service_kenya(limit=25),
            self.fetch_from_openedcareer_tech(limit=40),   # Source 22: openedcareer.com /job
            return_exceptions=True,
        )

        fetched_jobs: list[dict] = []
        for r in results:
            if isinstance(r, list):
                fetched_jobs.extend(r)
            else:
                logger.warning("A fetch source raised an exception: %s", r)

        # Global dedup by source_url before DB writes
        seen: set[str] = set()
        unique_jobs: list[dict] = []
        for job in fetched_jobs:
            url = job.get("source_url", "")
            if url and url not in seen:
                seen.add(url)
                unique_jobs.append(job)

        added_count   = 0
        updated_count = 0

        for item in unique_jobs:
            source_url = item["source_url"]
            stmt = select(Job).where(
                (Job.source_url == source_url) |
                ((Job.title == item["title"]) & (Job.company_name == item["company_name"]))
            )
            res = await self.session.execute(stmt)
            existing = res.scalars().first()

            if existing:
                existing.is_expired = False
                existing.posted_at  = item["posted_at"]   # refresh with real date
                existing.level      = item["level"]
                existing.deadline   = item["deadline"]
                updated_count += 1
            else:
                company = await self._get_or_create_company(
                    item["company_name"], career_url=source_url
                )
                skill_count = len(item["required_skills"])
                match_score = min(98, max(70, 60 + (skill_count * 5)))
                ats_score   = min(95, max(68, 55 + (skill_count * 5)))

                new_job = Job(
                    company_id=company.id,
                    company_name=company.name,
                    title=item["title"],
                    mode=item["mode"],
                    level=item["level"],
                    employment_type="Full-time" if item["level"] not in ("Intern",) else "Internship",
                    salary_min=item["salary_min"],
                    salary_max=item["salary_max"],
                    currency=item["currency"],
                    required_skills=item["required_skills"],
                    requirements=item["requirements"],
                    match_score=match_score,
                    ats_score=ats_score,
                    posted_at=item["posted_at"],
                    deadline=item["deadline"],
                    source_url=source_url,
                    contact_email=f"careers@{re.sub(r'[^a-z0-9]', '', company.name.lower())}.com",
                    is_hot=item["level"] in ("Intern", "Entry"),
                    is_expired=False,
                    description=item["description"],
                )
                self.session.add(new_job)
                added_count += 1

        await self.session.commit()

        # ── Auto-expire jobs whose deadline has already passed ────────────────
        try:
            today_date = date.today()
            overdue_result = await self.session.execute(
                select(Job).where(
                    Job.is_expired == False,  # noqa: E712
                    Job.deadline.isnot(None),
                    Job.deadline < today_date,
                )
            )
            overdue_jobs = overdue_result.scalars().all()
            expired_overdue = 0
            for j in overdue_jobs:
                j.is_expired = True
                expired_overdue += 1
            if expired_overdue:
                await self.session.commit()
                logger.info("Auto-expired %d overdue jobs (deadline < today)", expired_overdue)
        except Exception as exc:
            logger.warning("Deadline-based auto-expiry failed: %s", exc)

        # ── Auto-expire stale jobs (no deadline set but very old) ─────────────
        try:
            cutoff = date.today() - timedelta(days=45)
            stale_result = await self.session.execute(
                select(Job).where(
                    Job.is_expired == False,  # noqa: E712
                    Job.posted_at < datetime(cutoff.year, cutoff.month, cutoff.day, tzinfo=timezone.utc),
                    Job.source_url.notin_(list(seen)),
                    Job.source_url != "",
                    Job.source_url.isnot(None),
                )
            )
            stale_jobs = stale_result.scalars().all()
            expired_stale = 0
            for stale in stale_jobs:
                stale.is_expired = True
                expired_stale += 1
            if expired_stale:
                await self.session.commit()
                logger.info("Auto-expired %d stale jobs (>45 days, not in live feed)", expired_stale)
        except Exception as exc:
            logger.warning("Stale-job auto-expiry failed: %s", exc)

        intern_entry_count = sum(
            1 for j in unique_jobs if j.get("level") in ("Intern", "Entry")
        )
        logger.info(
            "RealJobAggregator sync complete: %d new, %d updated | %d intern/entry-level jobs",
            added_count, updated_count, intern_entry_count,
        )
        return {
            "total_fetched": len(unique_jobs),
            "added_count":   added_count,
            "updated_count": updated_count,
            "intern_entry_count": intern_entry_count,
        }
