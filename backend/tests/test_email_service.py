import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.email_service import EmailService


@pytest.mark.asyncio
async def test_send_application_email_signature_and_pdf_generation(mock_db):
    service = EmailService(mock_db)

    mock_user = MagicMock()
    mock_user.id = 1
    mock_user.first_name = "Dennis"
    mock_user.last_name = "Kiprop"
    mock_user.email = "dennis@example.com"
    mock_user.phone = "+254700000000"
    mock_user.location = "Nairobi, Kenya"

    mock_exec_res = MagicMock()
    mock_exec_res.scalar_one_or_none.return_value = mock_user
    mock_exec_res.scalars.return_value.first.return_value = mock_user
    mock_db.execute = AsyncMock(return_value=mock_exec_res)

    mock_created_email = MagicMock()
    mock_created_email.id = 100
    mock_created_email.user_id = 1
    mock_created_email.from_name = "Outbound Application to hr@testcorp.com"
    mock_created_email.subject = "Application for Software Engineer Position — Dennis Kiprop"
    mock_created_email.body = "Body text"
    mock_created_email.category = "Application Sent"
    mock_created_email.read = True
    mock_created_email.recommended_action = "Follow up"
    mock_created_email.application_id = 55
    mock_created_email.source = "application_dispatch"
    mock_created_email.created_at = "2026-09-17T00:00:00"
    mock_created_email.updated_at = "2026-09-17T00:00:00"

    service.repo.create = AsyncMock(return_value=mock_created_email)

    with patch("app.services.email_service.settings") as mock_settings:
        mock_settings.emails_enabled = True
        mock_settings.smtp_user = "testuser@gmail.com"
        mock_settings.smtp_password = "app-password"
        mock_settings.smtp_from_email = "testuser@gmail.com"
        mock_settings.smtp_from_name = "Dennis Kiprop"
        mock_settings.smtp_host = "smtp.gmail.com"
        mock_settings.smtp_port = 587

        # Call with all extended keyword arguments (app_letter_snapshot, app_letter_text, applicant_info)
        result = await service.send_application_email(
            user_id=1,
            recruiter_email="hr@testcorp.com",
            company_name="TestCorp",
            role_title="Software Engineer",
            cover_letter="Cover letter body text...",
            cv_snapshot={"cv_id": "1", "name": "Standard Resume"},
            app_letter_snapshot={"content": "Formal application letter content..."},
            app_letter_text="Formal application letter text...",
            application_id=55,
            applicant_info={
                "name": "Dennis Kiprop",
                "email": "dennis@example.com",
                "phone": "+254700000000",
                "location": "Nairobi, Kenya"
            }
        )

        assert result is not None
        assert result["id"] == "100"
        assert "email_sent" in result
        assert service.repo.create.called


@pytest.mark.asyncio
async def test_sync_inbound_responses_unconfigured(mock_db):
    service = EmailService(mock_db)
    with patch("app.services.email_service.settings") as mock_settings:
        mock_settings.smtp_user = ""
        mock_settings.smtp_password = ""
        mock_settings.imap_user = ""
        mock_settings.imap_password = ""

        res = await service.sync_inbound_responses(1)
        assert res["synced"] is False
        assert "not configured" in res["message"]


@pytest.mark.asyncio
async def test_process_inbound_email_matching(mock_db):
    service = EmailService(mock_db)

    # Mock Application query
    mock_app = MagicMock()
    mock_app.id = 42
    mock_app.company_name = "Safaricom PLC"
    mock_app.role = "Senior Software Engineer"
    mock_app.recruiter_email = "recruiter@safaricom.et"
    mock_app.stage = "Applied"

    mock_exec_res = MagicMock()
    mock_exec_res.scalars.return_value.all.return_value = [mock_app]
    mock_exec_res.scalars.return_value.first.return_value = mock_app
    mock_db.execute = AsyncMock(return_value=mock_exec_res)
    mock_db.commit = AsyncMock()

    mock_created_email = MagicMock()
    mock_created_email.id = 200
    mock_created_email.user_id = 1
    mock_created_email.from_name = "recruiter@safaricom.et (Safaricom PLC)"
    mock_created_email.subject = "Invitation to Technical Interview"
    mock_created_email.body = "We would like to invite you to an interview on Google Meet: https://meet.google.com/abc-defg-hij"
    mock_created_email.category = "Technical Interview"
    mock_created_email.read = False
    mock_created_email.recommended_action = "Confirm interview slot"
    mock_created_email.application_id = 42
    mock_created_email.source = "inbound_process"
    mock_created_email.created_at = "2026-09-26T12:00:00"
    mock_created_email.updated_at = "2026-09-26T12:00:00"

    service.repo.create = AsyncMock(return_value=mock_created_email)

    with patch("app.services.notification_service.NotificationService.create", new_callable=AsyncMock):
        res = await service.process_inbound_email(
            user_id=1,
            sender_name="Safaricom HR",
            sender_email="recruiter@safaricom.et",
            subject="Invitation to Technical Interview",
            body="We would like to invite you to an interview on Google Meet: https://meet.google.com/abc-defg-hij",
            application_id=42
        )

        assert res["email"] is not None
        assert res["application"]["id"] == "42"
        assert res["application"]["company_name"] == "Safaricom PLC"
        assert res["stage_updated"] is True
        assert res["classified"]["category"] == "Technical Interview"

