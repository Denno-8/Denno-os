import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.cv_version_service import CVVersionService
from app.schemas.cv_version import CVVersionCreate, CVVersionUpdate

@pytest.mark.asyncio
async def test_create_and_export_pdf():
    # Mock DB session
    db = AsyncMock()
    service = CVVersionService(db)

    fake_cv = MagicMock()
    fake_cv.id = 101
    fake_cv.user_id = 1
    fake_cv.name = "John Doe — Senior Engineer"
    fake_cv.focus = "Backend Systems"
    fake_cv.ats_score = 90
    fake_cv.skills = ["Python", "FastAPI", "Docker", "PostgreSQL"]
    fake_cv.parsed_content = "SUMMARY\nExperienced engineer.\n\nEXPERIENCE\nBuilt scalable microservices."
    fake_cv.parsed_sections = {"summary": "Experienced engineer.", "experience": "Built scalable microservices."}
    fake_cv.file_url = None
    fake_cv.times_used = 0
    fake_cv.last_used_at = None
    fake_cv.created_at = None
    fake_cv.updated_at = None

    service.repo.get = AsyncMock(return_value=fake_cv)

    # Test PDF generation for all themes
    themes = ["Sapphire", "Emerald", "Obsidian", "Violet", "Crimson"]
    for t in themes:
        pdf_bytes = await service.export_pdf(101, 1, theme_name=t)
        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 0
        assert pdf_bytes.startswith(b"%PDF")

@pytest.mark.asyncio
async def test_get_raw_file_fallback():
    db = AsyncMock()
    service = CVVersionService(db)

    fake_cv = MagicMock()
    fake_cv.id = 102
    fake_cv.user_id = 1
    fake_cv.name = "Alex Mercer — EXECUTIVE"
    fake_cv.focus = "Target Role Focus: Senior Full Stack Architect with 7+ years experience"
    fake_cv.file_url = None
    fake_cv.parsed_content = "Target Role Focus: Senior Architect\nAlex Mercer — EXECUTIVE\nSkills: Python"
    fake_cv.skills = ["Python"]

    service.repo.get = AsyncMock(return_value=fake_cv)

    content, media_type, filename = await service.get_raw_file(102, 1)
    text = content.decode("utf-8")
    assert "— EXECUTIVE" not in text
    assert "Target Role Focus:" not in text
    assert media_type == "text/plain"
    assert filename == "Alex_Mercer.txt"

@pytest.mark.asyncio
async def test_sanitization_in_pdf_export():
    db = AsyncMock()
    service = CVVersionService(db)

    fake_cv = MagicMock()
    fake_cv.id = 103
    fake_cv.user_id = 1
    fake_cv.name = "Alex Mercer — EXECUTIVE"
    fake_cv.focus = "Target Role Focus: Senior Full Stack Architect with 7+ years of experience engineering high-perform"
    fake_cv.ats_score = 95
    fake_cv.skills = ["Python", "FastAPI"]
    fake_cv.parsed_content = "Target Role Focus: Senior Architect\nAlex Mercer — EXECUTIVE\nSummary: Experienced engineer."
    fake_cv.parsed_sections = {"summary": "Target Role Focus: Senior Architect — EXECUTIVE"}

    service.repo.get = AsyncMock(return_value=fake_cv)

    pdf_bytes = await service.export_pdf(103, 1, theme_name="Sapphire")
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF")

