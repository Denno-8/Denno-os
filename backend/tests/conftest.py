"""
Shared fixtures for service unit tests.
All services now use SQLAlchemy / AsyncSession, so mock_db is an
AsyncMock standing in for an AsyncSession. Repositories are mocked
at the method level inside each test.
"""
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


@pytest.fixture
def mock_db():
    """
    A MagicMock standing in for an SQLAlchemy AsyncSession.
    The execute() method and scalar()/scalars() are pre-wired as
    AsyncMocks so that `await session.execute(...)` works in tests.
    """
    session = MagicMock()
    result_mock = MagicMock()
    result_mock.scalars.return_value.first.return_value = None
    result_mock.scalars.return_value.all.return_value = []
    result_mock.scalar.return_value = 0
    session.execute = AsyncMock(return_value=result_mock)
    session.flush = AsyncMock()
    session.delete = AsyncMock()
    session.add = MagicMock()
    return session
