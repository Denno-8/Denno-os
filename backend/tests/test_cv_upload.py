import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.cv_version_service import CVVersionService
from app.core.storage import storage

@pytest.mark.asyncio
async def test_cv_upload_with_storage_adapter(mock_db):
    service = CVVersionService(mock_db)
    
    dummy_pdf_content = b"%PDF-1.4 Mock CV document text content"
    
    with patch.object(storage, "upload_file", new_callable=AsyncMock) as mock_storage_upload, \
         patch.object(service.repo, "get", new_callable=AsyncMock) as mock_repo_get, \
         patch.object(service.repo, "update", new_callable=AsyncMock) as mock_repo_update:
        
        mock_cv = MagicMock()
        mock_cv.id = 10
        mock_cv.user_id = 1
        mock_cv.skills = ["Python"]
        mock_cv.name = "My Resume"
        mock_cv.last_used_at = None
        mock_cv.created_at = "2026-09-12T08:00:00Z"
        mock_cv.updated_at = "2026-09-12T08:00:00Z"
        mock_repo_get.return_value = mock_cv
        mock_repo_update.return_value = mock_cv
        mock_storage_upload.return_value = "/uploads/cv_10_resume.pdf"

        result = await service.upload_file(cv_id=10, user_id=1, filename="resume.pdf", file_bytes=dummy_pdf_content)
        
        assert mock_storage_upload.called
        assert mock_repo_update.called
