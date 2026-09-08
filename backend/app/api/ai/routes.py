"""
Enhanced AI routes with:
- Context-aware chat (injects live user career data into system prompt)
- Persistent chat sessions (CRUD)
- SSE streaming endpoint for live token delivery
- Cover letter generation
- CV match analysis
"""
from datetime import datetime, timezone
from typing import Optional, AsyncGenerator
import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.deps import get_current_user_id
from app.database.postgresql import get_session
from app.models.sqlalchemy_models import ChatSession
from app.services.ai_service import get_user_context, build_system_prompt, save_chat_session
from app.services.document_parser import detect_extracted_skills

router = APIRouter(prefix="/ai", tags=["AI"])


# ─── Schemas ────────────────────────────────────────────────────────────────

class CoverLetterRequest(BaseModel):
    job_title: str
    company: str
    category: str = "Software Engineering"
    tone: str = "professional"
    job_description: Optional[str] = None


class CVMatchRequest(BaseModel):
    cv_skills: list[str] = Field(default_factory=list)
    cv_summary: str = ""
    job_title: str
    company_name: str = ""
    required_skills: list[str] = Field(default_factory=list)
    job_description: str = ""


class ChatRequest(BaseModel):
    messages: list[dict]
    session_id: Optional[int] = None
    save_session: bool = True


class ChatSessionCreate(BaseModel):
    title: str = "New Chat"


class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    messages: Optional[list[dict]] = None


# ─── Helpers ────────────────────────────────────────────────────────────────

def get_anthropic_client():
    if not settings.anthropic_api_key:
        return None
    try:
        from anthropic import AsyncAnthropic
        return AsyncAnthropic(api_key=settings.anthropic_api_key)
    except ImportError:
        return None


CATEGORY_PROMPTS: dict[str, str] = {
    "Software Engineering": "Focus on system design, clean architecture, code quality, scale, and problem-solving impact.",
    "Data & AI": "Highlight data pipelines, machine learning models, statistical analysis, business insights, and metrics.",
    "Product & Design": "Emphasize user empathy, product roadmap execution, cross-functional leadership, UX metrics, and vision.",
    "Cloud & DevOps": "Focus on infrastructure as code, CI/CD automation, high availability, cloud security, and reliability engineering.",
    "CyberSecurity": "Highlight threat landscape awareness, risk mitigation, compliance, security audit, and incident response.",
    "Finance & Operations": "Emphasize operational efficiency, financial modeling, compliance, revenue growth, and process optimization.",
    "Sales & Marketing": "Highlight lead generation, revenue impact, brand engagement, conversion funnels, and customer acquisition.",
}


def _fallback_reply(user_msg: str) -> str:
    """Intelligent domain-aware fallback when Anthropic key is not configured."""
    msg_lower = user_msg.lower()

    if any(k in msg_lower for k in ["salary", "pay", "compensation", "kenya", "usd", "kes", "rate"]):
        return (
            "## Software Engineering Salary Benchmarks (Kenya & Remote)\n\n"
            "| Level | KES / month | USD / month |\n"
            "|-------|------------|-------------|\n"
            "| Junior (0-2 yrs) | KES 80k – 150k | $600 – $1,150 |\n"
            "| Mid-Level (2-5 yrs) | KES 180k – 350k | $1,400 – $2,700 |\n"
            "| Senior (5+ yrs) | KES 400k – 750k | $3,000 – $5,800 |\n"
            "| Lead / Architect | KES 800k – 1.3M+ | $6,000 – $10,000+ |\n\n"
            "Tip: Remote roles for US/EU companies often pay in USD via Deel/Wise. "
            "Ensure your CV highlights System Design and Cloud Architecture skills!\n\n"
            "[ACTION:CREATE_GOAL|label=Target $3,000+ Remote Software Roles|target=10]"
        )
    elif any(k in msg_lower for k in ["today", "plan", "habit", "what should i do", "daily"]):
        return (
            "## Recommended Daily Action Plan\n\n"
            "1. **Submit 3 Targeted Applications** — Focus on roles with >75% match score\n"
            "2. **Complete 1 Learning Lesson** — 30 mins on Docker, System Architecture, or FastAPI\n"
            "3. **Recruiter Outreach** — Send 2 personalized LinkedIn/Email notes to tech recruiters\n"
            "4. **Update Application Tracker** — Keep pipeline stages current for clear momentum\n\n"
            "[ACTION:CREATE_GOAL|label=Submit 3 Applications Today|target=3]\n"
            "[ACTION:NAVIGATE|path=/learning|label=Open Skill Learning Hub]"
        )
    elif any(k in msg_lower for k in ["interview", "star", "question", "behavioral", "technical"]):
        return (
            "## STAR Interview Response Framework\n\n"
            "| Element | Purpose | Example |\n"
            "|---------|---------|--------|\n"
            "| **Situation** | Set the scene | *'Our API throughput dropped under peak traffic'* |\n"
            "| **Task** | Your role | *'I was assigned to identify bottlenecks'* |\n"
            "| **Action** | What you did | *'Profiled SQL queries, added Redis cache, refactored async handlers'* |\n"
            "| **Result** | Quantified outcome | *'Reduced P99 latency by 45%, eliminated timeouts'* |\n\n"
            "Practice your STAR responses in our interactive simulator below:\n\n"
            "[ACTION:MOCK_INTERVIEW]"
        )
    elif any(k in msg_lower for k in ["skill", "missing", "learn", "stack", "technology"]):
        return (
            "## Top High-Demand Tech Stack (2026)\n\n"
            "**Backend**: FastAPI, PostgreSQL, Redis, Celery, gRPC\n\n"
            "**Frontend**: React, TypeScript, TailwindCSS, Vite\n\n"
            "**DevOps & Cloud**: Docker, Kubernetes, AWS (S3, ECS, Lambda), CI/CD GitHub Actions\n\n"
            "**AI & Automation**: Prompt Engineering, Vector DBs (Pinecone/pgvector), LangChain, Anthropic Claude\n\n"
            "[ACTION:NAVIGATE|path=/learning|label=Explore Target Skill Gap Heatmap]"
        )
    elif any(k in msg_lower for k in ["email", "outreach", "recruiter", "draft", "cold", "cover"]):
        return (
            "## Cold Recruiter Outreach Template\n\n"
            "**Subject**: Experienced Full Stack Engineer — Interested in Engineering Roles at [Company]\n\n"
            "---\n\n"
            "Hi [Recruiter Name],\n\n"
            "I noticed [Company]'s recent expansion in scalable cloud solutions and wanted to reach out. "
            "I'm a Software Engineer with expertise in **Python, React, and PostgreSQL**, having recently "
            "built high-throughput microservices serving 100k+ daily users.\n\n"
            "I'd love to briefly connect regarding upcoming engineering opportunities on your team.\n\n"
            "[ACTION:NAVIGATE|path=/cover-letter|label=Open AI Cover Letter Studio]"
        )
    elif any(k in msg_lower for k in ["cv", "resume", "ats", "score", "optimize"]):
        return (
            "## CV / ATS Optimization Guide\n\n"
            "**Scoring Criteria** (Denno ATS Engine):\n"
            "- **40%** — Keyword match % vs job description\n"
            "- **25%** — Section presence (Summary, Experience, Education, Skills)\n"
            "- **20%** — Formatting (no tables, clean headings)\n"
            "- **15%** — Quantified achievements (numbers, %, $, metrics)\n\n"
            "**Quick wins to hit 85%+**:\n"
            "1. Add a strong **Professional Summary** (3-4 lines, keyword-rich)\n"
            "2. Quantify every bullet: *'Reduced API latency by 40%'* not *'Improved performance'*\n"
            "3. Mirror exact job description keywords in your skills section\n\n"
            "[ACTION:NAVIGATE|path=/cv|label=Run ATS CV Analysis]"
        )
    else:
        return (
            f"## Denno1 Career Intelligence\n\n"
            f"I've analyzed your query about **'{user_msg[:70]}'**.\n\n"
            f"Here's what I recommend for your career momentum:\n\n"
            f"- **Applications**: Target roles matching your top technical skills\n"
            f"- **CV Optimization**: Use ATS keywords to push match scores above 80%\n"
            f"- **Interview Prep**: Practice STAR stories for behavioral rounds\n\n"
            f"[ACTION:MOCK_INTERVIEW]\n"
            f"[ACTION:CREATE_GOAL|label=Apply to 10 Jobs This Week|target=10]"
        )


# ─── Chat Sessions CRUD ─────────────────────────────────────────────────────

@router.post("/chat-sessions")
async def create_chat_session(
    payload: ChatSessionCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session),
):
    """Create a new chat session."""
    cs = ChatSession(user_id=user_id, title=payload.title, messages=[])
    db.add(cs)
    await db.flush()
    await db.refresh(cs)
    return {
        "id": cs.id,
        "title": cs.title,
        "messages": cs.messages,
        "created_at": cs.created_at.isoformat() if cs.created_at else None,
        "updated_at": cs.updated_at.isoformat() if cs.updated_at else None,
    }


@router.get("/chat-sessions")
async def list_chat_sessions(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session),
):
    """List all chat sessions for the current user, newest first."""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(desc(ChatSession.updated_at))
        .limit(50)
    )
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "message_count": len(s.messages or []),
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        }
        for s in sessions
    ]


@router.get("/chat-sessions/{session_id}")
async def get_chat_session(
    session_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session),
):
    """Get full message history for a specific session."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
        )
    )
    cs = result.scalar_one_or_none()
    if not cs:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return {
        "id": cs.id,
        "title": cs.title,
        "messages": cs.messages or [],
        "created_at": cs.created_at.isoformat() if cs.created_at else None,
        "updated_at": cs.updated_at.isoformat() if cs.updated_at else None,
    }


@router.patch("/chat-sessions/{session_id}")
async def update_chat_session(
    session_id: int,
    payload: ChatSessionUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session),
):
    """Update title or append messages to a session."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
        )
    )
    cs = result.scalar_one_or_none()
    if not cs:
        raise HTTPException(status_code=404, detail="Chat session not found")
    if payload.title is not None:
        cs.title = payload.title
    if payload.messages is not None:
        cs.messages = payload.messages
    await db.flush()
    return {"id": cs.id, "title": cs.title, "message_count": len(cs.messages or [])}


@router.delete("/chat-sessions/{session_id}", status_code=204)
async def delete_chat_session(
    session_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session),
):
    """Delete a chat session."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
        )
    )
    cs = result.scalar_one_or_none()
    if not cs:
        raise HTTPException(status_code=404, detail="Chat session not found")
    await db.delete(cs)


# ─── Main Chat Endpoint ─────────────────────────────────────────────────────

@router.post("/denno1")
async def denno1_chat(
    payload: ChatRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session),
):
    """
    Context-aware AI career chat.
    - Injects live user career data into the system prompt.
    - Persists messages to chat_sessions table.
    - Streams via Anthropic Claude if API key is set; uses intelligent fallback otherwise.
    """
    # Fetch personalized context
    context = await get_user_context(db, user_id)
    system_prompt = build_system_prompt(context)

    # Build API messages (strip timestamps if present)
    api_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in payload.messages
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]

    client = get_anthropic_client()

    if client:
        resp = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1200,
            system=system_prompt,
            messages=api_messages,
        )
        reply_text = "".join(b.text for b in resp.content if b.type == "text")
    else:
        # Intelligent fallback
        user_msg = api_messages[-1]["content"] if api_messages else ""
        reply_text = _fallback_reply(user_msg)

    # Persist session
    if payload.save_session:
        now = datetime.now(timezone.utc).isoformat()
        all_messages = [
            *[{**m, "timestamp": m.get("timestamp", now)} for m in payload.messages],
            {"role": "assistant", "content": reply_text, "timestamp": now},
        ]
        cs = await save_chat_session(
            db, user_id, all_messages,
            session_id=payload.session_id,
        )
        return {"reply": reply_text, "session_id": cs.id}

    return {"reply": reply_text}


# ─── SSE Streaming Endpoint ─────────────────────────────────────────────────

@router.post("/denno1/stream")
async def denno1_stream(
    payload: ChatRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session),
):
    """
    SSE streaming endpoint.
    Sends tokens as they're generated by Claude. Falls back to chunked fallback text.
    """
    context = await get_user_context(db, user_id)
    system_prompt = build_system_prompt(context)

    api_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in payload.messages
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]
    client = get_anthropic_client()

    async def event_stream() -> AsyncGenerator[str, None]:
        full_text = ""
        if client:
            try:
                async with client.messages.stream(
                    model="claude-sonnet-4-6",
                    max_tokens=1200,
                    system=system_prompt,
                    messages=api_messages,
                ) as stream:
                    async for text in stream.text_stream:
                        full_text += text
                        yield f"data: {json.dumps({'delta': text})}\n\n"
            except Exception as e:
                # Stream error fallback
                fallback = _fallback_reply(api_messages[-1]["content"] if api_messages else "")
                for char in fallback:
                    full_text += char
                    yield f"data: {json.dumps({'delta': char})}\n\n"
                    await asyncio.sleep(0.003)
        else:
            # Animate fallback with character-by-character streaming
            user_msg = api_messages[-1]["content"] if api_messages else ""
            fallback = _fallback_reply(user_msg)
            for char in fallback:
                full_text += char
                yield f"data: {json.dumps({'delta': char})}\n\n"
                await asyncio.sleep(0.003)

        # Signal completion with full text for session save
        yield f"data: {json.dumps({'done': True, 'full_text': full_text})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Cover Letter ────────────────────────────────────────────────────────────

@router.post("/cover-letter")
async def generate_cover_letter(
    payload: CoverLetterRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session),
):
    import re
    category_guidance = CATEGORY_PROMPTS.get(payload.category, CATEGORY_PROMPTS["Software Engineering"])
    context = await get_user_context(db, user_id)
    
    raw_skills = context.get("skills", []) or []
    BANNED_SKILLS = {"bmw group", "bmw", "idealworks", "aboosto", "start-up", "startup", "munichjobs", "itinternships", "automationandrobotics", "innovation", "growth", "mentorship"}
    clean_skills = [s for s in raw_skills if s.lower().strip() not in BANNED_SKILLS and not (len(s) > 12 and " " not in s and s == s.lower())]
    skills_hint = ", ".join(clean_skills[:6]) or "hardware and software troubleshooting, Windows environments, network connectivity, system administration, Microsoft Office, cybersecurity"

    clean_jd = ""
    if payload.job_description:
        clean_jd = re.sub(r"^(Role Responsibilities:|What you will do|Job Description:|Responsibilities:|Key Duties:)\s*", "", payload.job_description.strip(), flags=re.IGNORECASE)
        clean_jd = re.sub(r"\s+", " ", clean_jd).strip()

    client = get_anthropic_client()
    if client:
        resp = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1200,
            system=(
                f"You are an expert career strategist writing an authentic, tailored cover letter for a candidate with a BSc in Information Security & Forensics applying for a role in {payload.category}. "
                f"Tone: {payload.tone}. Guidance: {category_guidance}. "
                f"The candidate has genuine skills in: {skills_hint}. "
                "Structure in structured formal cover letter paragraphs with proper date, recipient header, subject line, professional opening, core technical achievements, role alignment, and professional sign-off. "
                "CRITICAL INSTRUCTION: Never include company names, hashtags, job portal noise, or raw unspaced words (such as 'BMW Group', 'Idealworks', 'Munichjobs', 'automationandrobotics') as candidate skills or keywords. "
                "Synthesize job duties into clean, fluent, professional narrative prose."
            ),
            messages=[{
                "role": "user",
                "content": (
                    f"Target Role: {payload.job_title} at {payload.company}\n"
                    f"Category: {payload.category}\n"
                    f"{'Key Requirements & Context: ' + clean_jd[:400] if clean_jd else ''}"
                ),
            }],
        )
        text = "".join(b.text for b in resp.content if b.type == "text")
        return {"letter": text, "category": payload.category}

    # Authentic fallback template matching Dennis Koech's real sample document
    today_str = datetime.now().strftime("%d %B %Y")
    target_role_upper = payload.job_title.upper()
    letter = (
        f"DENNIS KOECH\n"
        f"APPLICATION FOR {target_role_upper}\n"
        f"Nairobi, Kenya | 0716949061 | denno7721@gmail.com\n\n"
        f"{today_str}\n\n"
        f"The Human Resources Manager\n"
        f"{payload.company}\n"
        f"Nairobi, Kenya\n\n"
        f"RE: APPLICATION FOR {target_role_upper} POSITION\n\n"
        f"Dear Human Resources Manager,\n\n"
        f"I am writing to apply for the {payload.job_title} position at {payload.company}. I have completed my Bachelor of Science in Information Security and Forensics and am eager to apply my technical training and practical experience in a professional ICT support environment.\n\n"
        f"My background aligns closely with the requirements of the position. I have practical knowledge of {skills_hint}, system administration concepts, technical documentation, and supporting security technologies.\n\n"
        f"Through my practical projects, I have worked with OPNSense firewall, VirtualBox, Kali Linux, Wireshark, Nmap and Suricata. I have configured virtual LAN/WAN environments, investigated connectivity problems, analysed network traffic and explored intrusion detection and security monitoring. I have also developed a Python/Flask and MongoDB cybersecurity application involving authentication, threat analysis, dashboards and reporting.\n\n"
        f"I am particularly interested in this opportunity because the role combines first-line technical support, hardware and software maintenance, network troubleshooting, user support, IT asset management, backups and information security. These responsibilities match both my technical training and the practical ICT experience I am seeking to build.\n\n"
        f"I am a reliable, organized and quick-learning individual with strong analytical and problem-solving abilities. I understand the importance of professionalism, confidentiality, accurate documentation and timely support when assisting users. I am comfortable working independently, collaborating with colleagues and escalating complex technical issues when necessary.\n\n"
        f"I would appreciate the opportunity to contribute to {payload.company} while developing my professional ICT support and systems administration skills. I am available for an interview at your convenience and would be pleased to provide any additional information required.\n\n"
        f"Thank you for considering my application. I look forward to the opportunity to discuss my suitability for the position.\n\n"
        f"Yours faithfully,\n\n"
        f"Dennis Koech,\n"
        f"0716949061,\n"
        f"denno7721@gmail.com."
    )
    return {"letter": letter, "category": payload.category}


# ─── CV Match Analysis ───────────────────────────────────────────────────────

@router.post("/cv-match")
async def analyze_cv_match(
    payload: CVMatchRequest,
    user_id: int = Depends(get_current_user_id),
):
    """Calculates CV-to-Job skill overlap, missing skills, ATS score, and optimization tips."""
    cv_skills = [s.strip() for s in payload.cv_skills if s.strip()]
    req_skills = [s.strip() for s in payload.required_skills if s.strip()]

    if not req_skills and payload.job_description:
        req_skills = detect_extracted_skills(payload.job_description)

    cv_skills_lower = {s.lower() for s in cv_skills}
    # Also extract skills from cv_summary if provided
    if payload.cv_summary:
        summary_extracted = detect_extracted_skills(payload.cv_summary)
        for s in summary_extracted:
            cv_skills_lower.add(s.lower())

    matched = []
    missing = []
    for s in req_skills:
        if s.lower() in cv_skills_lower or any(s.lower() in cv_item.lower() for cv_item in cv_skills):
            matched.append(s)
        else:
            missing.append(s)

    if req_skills:
        match_score = min(100, max(30, round((len(matched) / len(req_skills)) * 100)))
        summary_bonus = 10 if len(payload.cv_summary.strip()) > 50 else 0
        ats_score = min(98, max(45, round(match_score * 0.85 + summary_bonus + (10 if len(matched) >= 3 else 0))))
    else:
        match_score = 82
        ats_score = 80

    recommendations = []
    if missing:
        recommendations.append(f"Add missing high-value keywords to your CV: {', '.join(missing[:4])}.")
    if len(payload.cv_summary.strip()) < 50:
        recommendations.append("Expand your CV executive summary to highlight core technical accomplishments.")
    recommendations.append("Tailor work experience bullet points to quantify impact using percentages, metrics, and scale.")
    if len(matched) > 0:
        recommendations.append(f"Highlight matched competencies ({', '.join(matched[:3])}) prominently in your top skills section.")

    return {
        "job_title": payload.job_title,
        "company_name": payload.company_name or "Target Company",
        "match_score": match_score,
        "ats_score": ats_score,
        "matched_skills": matched,
        "missing_skills": missing,
        "recommendations": recommendations,
    }
