"""
Unit tests for ApplicationService — tests analytics calculation logic
by mocking the repository at method level (no DB required).
"""
import pytest
from unittest.mock import AsyncMock

from app.services.application_service import ApplicationService


@pytest.mark.asyncio
async def test_analytics_calculates_rates_correctly(mock_db):
    service = ApplicationService(mock_db)
    service.repo.aggregate_by_stage = AsyncMock(return_value={
        "Applied": 10, "Technical": 3, "HR Interview": 2, "Offer": 1, "Rejected": 4,
    })
    service.repo.averages = AsyncMock(return_value={
        "total": 20, "avg_match": 82.4, "avg_ats": 77.6
    })

    result = await service.analytics("some-user-id")

    assert result.total == 20
    assert result.interviews == 5       # Technical(3) + HR Interview(2)
    assert result.offers == 1
    assert result.responded == 10       # Technical(3) + HR Interview(2) + Offer(1) + Rejected(4)
    assert result.response_rate == 50   # 10/20 * 100
    assert result.interview_rate == 25  # 5/20 * 100
    assert result.avg_match == 82       # rounded from 82.4
    assert result.avg_ats == 78         # rounded from 77.6


@pytest.mark.asyncio
async def test_analytics_handles_zero_applications_without_division_error(mock_db):
    service = ApplicationService(mock_db)
    service.repo.aggregate_by_stage = AsyncMock(return_value={})
    service.repo.averages = AsyncMock(return_value={
        "total": 0, "avg_match": 0, "avg_ats": 0
    })

    result = await service.analytics("new-user-id")

    assert result.total == 0
    assert result.response_rate == 0    # must not raise ZeroDivisionError
    assert result.interview_rate == 0


@pytest.mark.asyncio
async def test_generate_followup_draft(mock_db):
    from unittest.mock import MagicMock
    from datetime import date
    service = ApplicationService(mock_db)
    mock_app = MagicMock()
    mock_app.company_name = "Safaricom"
    mock_app.role = "Backend Dev"
    mock_app.stage = "Applied"
    mock_app.date_applied = date.today()
    mock_app.recruiter_email = "careers@safaricom.co.ke"
    service.repo.get = AsyncMock(return_value=mock_app)

    res = await service.generate_followup_draft(1, 123, tone="polite")
    assert res is not None
    assert "Safaricom" in res["company_name"]
    assert "BEGIN:VCALENDAR" in res["ics_content"]


@pytest.mark.asyncio
async def test_get_pipeline_funnel_analytics(mock_db):
    service = ApplicationService(mock_db)
    service.repo.aggregate_by_stage = AsyncMock(return_value={
        "Saved": 5, "Applied": 10, "Technical": 3, "Offer": 1
    })
    service.repo.averages = AsyncMock(return_value={"total": 19})

    res = await service.get_pipeline_funnel_analytics(123)
    assert res["total_applications"] == 19
    assert "funnel_steps" in res
    assert "diagnostics" in res

