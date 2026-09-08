from datetime import date, datetime

from app.services.data_transfer_service import DataTransferService, _json_safe


def test_json_safe_converts_dates_recursively():
    value = {
        "date_applied": date(2026, 5, 15),
        "created_at": datetime(2026, 5, 15, 10, 30),
        "nested": {"deadline": date(2026, 6, 1)},
        "items": [date(2026, 7, 1)],
        "plain_string": "unchanged",
    }
    result = _json_safe(value)

    assert result["date_applied"] == "2026-05-15"
    assert result["created_at"] == "2026-05-15T10:30:00"
    assert result["nested"]["deadline"] == "2026-06-01"
    assert result["items"][0] == "2026-07-01"
    assert result["plain_string"] == "unchanged"


def test_parse_csv_splits_list_fields():
    content = 'company_name,role,required_skills\r\nSafaricom,Backend Dev,"Python,AWS,Docker"\r\n'
    rows = DataTransferService.parse_csv(content, "applications")

    assert len(rows) == 1
    assert rows[0]["company_name"] == "Safaricom"
    assert rows[0]["role"] == "Backend Dev"
    assert rows[0]["required_skills"] == ["Python", "AWS", "Docker"]


def test_parse_csv_drops_empty_cells_instead_of_passing_empty_string():
    content = "company_name,role,notes\r\nSafaricom,Backend Dev,\r\n"
    rows = DataTransferService.parse_csv(content, "applications")

    assert "notes" not in rows[0]  # empty cell dropped so Pydantic uses the schema default
    assert rows[0]["company_name"] == "Safaricom"


def test_parse_csv_ignores_list_field_splitting_for_unrelated_resource():
    """tags is a list field for 'notes' but NOT declared for 'goals' in
    LIST_FIELDS — a comma-containing value must be left as one string,
    not split, for a resource where it isn't declared as a list field.
    (The value must be CSV-quoted since it contains commas — otherwise the
    CSV parser itself splits it into extra columns before this code ever
    sees it, which is a different bug entirely from what this test checks.)"""
    content = 'title,tags\r\nMy Note,"not,a,list"\r\n'
    rows = DataTransferService.parse_csv(content, "goals")  # goals has no LIST_FIELDS entry
    assert rows[0]["tags"] == "not,a,list"  # left as one string, not split into a list


def test_to_csv_bytes_empty_records_returns_empty_bytes(mock_db):
    service = DataTransferService(mock_db)
    assert service.to_csv_bytes([]) == b""


def test_to_json_bytes_round_trip(mock_db):
    service = DataTransferService(mock_db)
    records = [{"name": "Safaricom", "skills": ["Python", "AWS"]}]
    body = service.to_json_bytes(records)
    assert b"Safaricom" in body
    assert b"Python" in body


def test_to_csv_bytes_flattens_list_fields(mock_db):
    service = DataTransferService(mock_db)
    records = [{"name": "Safaricom", "skills": ["Python", "AWS"]}]
    body = service.to_csv_bytes(records).decode("utf-8")
    assert "name" in body and "skills" in body  # header row present
    assert "Safaricom" in body
