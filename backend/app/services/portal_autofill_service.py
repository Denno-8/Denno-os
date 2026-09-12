"""
Web Portal Auto-Fill Assistant & Screening Question Solver Service
Formats candidate profile into ATS form schema (Greenhouse, Lever, Workday, LinkedIn Easy Apply)
and generates 1-click browser bookmarklets and AI screening question solutions.
"""
import json
from typing import Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.sqlalchemy_models import User, Job, CVVersion


class PortalAutofillService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_candidate_payload(self, user_id: int, job_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Builds standardized candidate profile payload for job application portal auto-filling.
        """
        user_res = await self.db.execute(select(User).where(User.id == user_id))
        user_obj = user_res.scalars().first()

        cv_res = await self.db.execute(
            select(CVVersion).where(CVVersion.user_id == user_id).order_by(CVVersion.updated_at.desc())
        )
        latest_cv = cv_res.scalars().first()

        job_info = {"title": "Software Engineer", "company_name": "Tech Corp"}
        if job_id:
            j_res = await self.db.execute(select(Job).where(Job.id == job_id))
            j_obj = j_res.scalars().first()
            if j_obj:
                job_info = {"title": j_obj.title, "company_name": j_obj.company_name}

        first_name = user_obj.first_name if user_obj and user_obj.first_name else "Applicant"
        last_name = user_obj.last_name if user_obj and user_obj.last_name else ""
        email = user_obj.email if user_obj and user_obj.email else ""
        phone = user_obj.phone if user_obj and user_obj.phone else ""
        location = user_obj.location if user_obj and user_obj.location else ""
        linkedin = user_obj.linkedin if user_obj and user_obj.linkedin else ""
        github = user_obj.github if user_obj and user_obj.github else ""
        summary = user_obj.summary if user_obj and user_obj.summary else (
            f"Experienced {job_info['title']} with strong expertise in full-stack software development, cloud infrastructure, and API architecture."
        )

        payload = {
            "first_name": first_name,
            "last_name": last_name,
            "full_name": f"{first_name} {last_name}",
            "email": email,
            "phone": phone,
            "location": location,
            "city": location.split(",")[0] if "," in location else location,
            "country": "Kenya",
            "linkedin_url": linkedin,
            "github_url": github,
            "website_url": user_obj.website if user_obj and user_obj.website else github,
            "years_experience": user_obj.years_experience if user_obj and user_obj.years_experience else 4,
            "notice_period": user_obj.notice_period if user_obj and user_obj.notice_period else "Immediate / 2 Weeks",
            "salary_expectation": f"{user_obj.currency if user_obj else 'KES'} {user_obj.salary_min if user_obj else 200000}",
            "work_authorization": "Authorized to work (Kenyan Citizen / Remote)",
            "summary": summary,
            "skills_comma_separated": ", ".join(user_obj.skills[:8]) if user_obj and user_obj.skills else "Python, FastAPI, React, TypeScript, PostgreSQL, Docker, AWS",
            "cv_title": latest_cv.name if latest_cv else "Tailored_Software_Engineer_CV.pdf"
        }

        # Generate Browser Console Auto-Fill Bookmarklet Script
        bookmarklet_code = f"""javascript:(function(){{
            var p = {json.dumps(payload)};
            function fill(sel, val) {{
                document.querySelectorAll(sel).forEach(function(el) {{
                    el.value = val;
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                }});
            }}
            fill('input[name*="first"], input[id*="first"], input[autocomplete*="given-name"]', p.first_name);
            fill('input[name*="last"], input[id*="last"], input[autocomplete*="family-name"]', p.last_name);
            fill('input[type="email"], input[name*="email"], input[id*="email"]', p.email);
            fill('input[type="tel"], input[name*="phone"], input[id*="phone"]', p.phone);
            fill('input[name*="location"], input[name*="city"], input[id*="location"]', p.location);
            fill('input[name*="linkedin"], input[id*="linkedin"]', p.linkedin_url);
            fill('input[name*="github"], input[id*="github"]', p.github_url);
            fill('input[name*="website"], input[id*="website"], input[name*="portfolio"]', p.website_url);
            fill('textarea[name*="summary"], textarea[id*="summary"], textarea[name*="cover"]', p.summary);
            alert('✦ Auto-filled candidate profile fields for ' + p.full_name + '!');
        }})();"""

        return {
            "candidate": payload,
            "job": job_info,
            "bookmarklet_code": bookmarklet_code
        }

    @staticmethod
    def answer_screening_question(question: str, role_title: str = "Software Engineer", company_name: str = "Target Company") -> str:
        """
        Generates an AI screening question response tailored to the question prompt.
        """
        q_lower = (question or "").lower()

        if any(k in q_lower for k in ["why do you want", "why this role", "why join us", "interest"]):
            return (
                f"I am genuinely excited about the {role_title} role at {company_name} because of your commitment to high-impact technical innovation. "
                f"My expertise aligns directly with your engineering requirements, and I am eager to contribute scalable software solutions."
            )
        elif any(k in q_lower for k in ["notice period", "start date", "availability"]):
            return "I am available to start immediately or within a standard 2-week notice period."
        elif any(k in q_lower for k in ["salary", "compensation", "remuneration"]):
            return "My salary expectations are competitive and flexible depending on the total compensation package and benefits."
        elif any(k in q_lower for k in ["experience", "years", "background"]):
            return f"I have over 4 years of hands-on experience building production-grade web applications, API microservices, and database systems."
        elif any(k in q_lower for k in ["authorized", "visa", "sponsorship", "work in"]):
            return "Yes, I am fully authorized to work without requiring visa sponsorship."
        else:
            return f"I have strong technical competence and hands-on experience relevant to {role_title} requirements at {company_name}."
