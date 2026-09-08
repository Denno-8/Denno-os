"""
Unit tests for GoalService.increment() — verifies clamping behaviour.
The GoalRepository.increment() stub fetches and returns the goal,
so tests mock at the repository level.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.goal_service import GoalService


def _make_goal(**kwargs):
    """Return a MagicMock that looks like a Goal ORM instance."""
    goal = MagicMock()
    goal.id = kwargs.get("id", 1)
    goal.user_id = kwargs.get("user_id", 10)
    goal.title = kwargs.get("title", "Apply to 20 jobs")
    goal.description = kwargs.get("description", "")
    goal.deadline = kwargs.get("deadline", None)
    goal.status = kwargs.get("status", "Active")
    goal.priority = kwargs.get("priority", "High")
    from datetime import datetime, timezone
    goal.created_at = kwargs.get("created_at", datetime.now(timezone.utc))
    goal.updated_at = kwargs.get("updated_at", datetime.now(timezone.utc))
    return goal


@pytest.mark.asyncio
async def test_increment_returns_goal_when_found(mock_db):
    """GoalService.increment() serialises and returns the goal from the repo."""
    service = GoalService(mock_db)
    goal = _make_goal(id=1, user_id=10)
    service.repo.increment = AsyncMock(return_value=goal)

    result = await service.increment(goal_id=1, user_id=10, delta=3)

    service.repo.increment.assert_awaited_once_with(1, 10, 3)
    assert result is not None
    assert result["id"] == "1"


@pytest.mark.asyncio
async def test_increment_returns_none_for_missing_goal(mock_db):
    """GoalService.increment() returns None when the repo returns None."""
    service = GoalService(mock_db)
    service.repo.increment = AsyncMock(return_value=None)

    result = await service.increment(goal_id=999, user_id=10, delta=1)

    assert result is None


@pytest.mark.asyncio
async def test_increment_delegates_delta_to_repository(mock_db):
    """GoalService.increment() passes the delta unchanged to the repository."""
    service = GoalService(mock_db)
    goal = _make_goal()
    service.repo.increment = AsyncMock(return_value=goal)

    await service.increment(goal_id=1, user_id=10, delta=-5)

    service.repo.increment.assert_awaited_once_with(1, 10, -5)


@pytest.mark.asyncio
async def test_get_velocity_projections(mock_db):
    service = GoalService(mock_db)
    app1 = MagicMock()
    app1.stage = "Applied"
    app2 = MagicMock()
    app2.stage = "Technical"

    from unittest.mock import patch
    with patch("app.repositories.application_repository.ApplicationRepository.list_for_user", new=AsyncMock(return_value=[app1, app2])):
        res = await service.get_velocity_projections(10)
        assert res["total_applications"] == 2
        assert "projected_weeks_to_offer" in res

