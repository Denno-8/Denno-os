"""
Unit tests for JobService.apply() — verifies it builds the right
ApplicationCreate payload from a Job ORM object and delegates
to ApplicationService.create().
"""
import pytest
from datetime import date
from unittest.mock import AsyncMock, MagicMock

from app.services.job_service import JobService


def _make_job(**kwargs):
    """Create a MagicMock that looks like a Job ORM instance."""
    job = MagicMock()
    job.id = kwargs.get("id", 1)
    job.company_id = kwargs.get("company_id", 10)
    job.company_name = kwargs.get("company_name", "Safaricom")
    job.title = kwargs.get("title", "Senior SWE")
    job.required_skills = kwargs.get("required_skills", ["Java", "Kafka"])
    job.match_score = kwargs.get("match_score", 94)
    job.ats_score = kwargs.get("ats_score", 91)
    job.currency = kwargs.get("currency", "KES")
    job.salary_min = kwargs.get("salary_min", 280000)
    job.salary_max = kwargs.get("salary_max", 380000)
    job.source_url = kwargs.get("source_url", "https://example.com/careers")
    job.contact_email = kwargs.get("contact_email", "careers@safaricom.co.ke")
    job.mode = kwargs.get("mode", "Remote")
    job.level = kwargs.get("level", "Senior")
    job.employment_type = kwargs.get("employment_type", "Full-time")
    job.posted_at = kwargs.get("posted_at", date.today())
    job.deadline = kwargs.get("deadline", None)
    job.is_hot = kwargs.get("is_hot", False)
    job.description = kwargs.get("description", "")
    return job


@pytest.mark.asyncio
async def test_apply_builds_correct_application_payload(mock_db):
    service = JobService(mock_db)
    job = _make_job()

    service.repo.get = AsyncMock(return_value=job)
    created_app = MagicMock()
    created_app.id = 1
    created_app.company_name = "Safaricom"
    created_app.role = "Senior SWE"
    created_app.stage = "Applied"
    created_app.date_applied = date.today()
    created_app.required_skills = ["Java", "Kafka"]
    created_app.match_score = 94
    created_app.ats_score = 91
    created_app.salary_range = "KES 280,000 - 380,000"
    created_app.notes = None
    created_app.checklist = {}
    created_app.cv_snapshot = None
    created_app.created_at = date.today()
    created_app.updated_at = date.today()

    service._applications.repo.create = AsyncMock(return_value=created_app)

    result = await service.apply(job_id=1, user_id=123)

    assert result["company_name"] == "Safaricom"
    assert result["role"] == "Senior SWE"

    call_args = service._applications.repo.create.call_args
    app_dict = call_args[0][0]
    assert app_dict["user_id"] == 123
    assert app_dict["company_name"] == "Safaricom"
    assert app_dict["role"] == "Senior SWE"
    assert app_dict["required_skills"] == ["Java", "Kafka"]
    assert app_dict["match_score"] == 94
    assert app_dict["salary_range"] == "KES 280,000 - 380,000"
    assert app_dict["source_job_id"] == "1"
    assert app_dict["recruiter_email"] == "careers@safaricom.co.ke"


@pytest.mark.asyncio
async def test_apply_raises_for_missing_job(mock_db):
    service = JobService(mock_db)
    service.repo.get = AsyncMock(return_value=None)

    with pytest.raises(ValueError, match="Job not found"):
        await service.apply(job_id=999, user_id=123)


@pytest.mark.asyncio
async def test_get_salary_benchmarks(mock_db):
    service = JobService(mock_db)
    j1 = _make_job(level="Senior", salary_min=300000, salary_max=500000, currency="KES")
    j2 = _make_job(level="Mid", salary_min=200000, salary_max=350000, currency="KES")
    service.repo.list = AsyncMock(return_value=[j1, j2])

    res = await service.get_salary_benchmarks()
    assert "levels" in res
    assert len(res["levels"]) == 2


@pytest.mark.asyncio
async def test_get_company_intelligence(mock_db):
    service = JobService(mock_db)
    j1 = _make_job(company_name="Safaricom", required_skills=["Python", "FastAPI"])
    j1.is_expired = False
    service.repo.list = AsyncMock(return_value=[j1])

    res = await service.get_company_intelligence("Safaricom")
    assert res["company_name"] == "Safaricom"
    assert res["total_jobs"] == 1
    assert "Python" in res["top_skills"]

