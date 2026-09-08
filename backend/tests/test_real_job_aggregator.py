import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.real_job_aggregator import RealJobAggregatorService, _extract_skills_from_text, _clean_html

def test_extract_skills_from_text():
    text = "We need a Senior Python Developer with FastAPI, React, TypeScript, and PostgreSQL experience."
    skills = _extract_skills_from_text(text)
    assert "Python" in skills
    assert "FastAPI" in skills
    assert "React" in skills
    assert "TypeScript" in skills
    assert "PostgreSQL" in skills

def test_clean_html():
    html = "<div><p>Hello <b>World</b>!</p></div>"
    cleaned = _clean_html(html)
    assert cleaned == "Hello World !"

def test_parse_date():
    from app.services.real_job_aggregator import _parse_date
    dt = _parse_date("2026-08-17T12:00:00Z")
    assert dt.year == 2026
    assert dt.month == 8

def test_detect_level():
    from app.services.real_job_aggregator import _detect_level
    assert _detect_level("Software Engineering Intern", "CS student") == "Intern"
    assert _detect_level("Junior Developer", "0-1 years exp") == "Entry"
    assert _detect_level("Senior Fullstack Engineer", "5+ years") == "Senior"

@pytest.mark.asyncio
async def test_jobicy_fetch():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "jobs": [
            {
                "jobTitle": "Senior Backend Developer",
                "companyName": "Acme Corp",
                "url": "https://jobicy.com/jobs/123",
                "jobDescription": "Python FastAPI PostgreSQL microservices",
                "pubDate": "2026-08-15T10:00:00Z",
                "annualSalaryMin": 300000,
                "annualSalaryMax": 500000,
            }
        ]
    }

    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.get.return_value = mock_response

    with patch("httpx.AsyncClient", return_value=mock_client):
        mock_session = AsyncMock()
        service = RealJobAggregatorService(mock_session)
        jobs = await service.fetch_from_jobicy(limit=5)
        assert len(jobs) == 1
        assert jobs[0]["title"] == "Senior Backend Developer"
        assert jobs[0]["company_name"] == "Acme Corp"
        assert "Python" in jobs[0]["required_skills"]
        assert jobs[0]["posted_at"].year == 2026

@pytest.mark.asyncio
async def test_myjobmag_kenya_fetch():
    rss_content = """<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <item>
          <title>Software Engineering Intern at Safaricom PLC</title>
          <link>https://www.myjobmag.co.ke/job/12345</link>
          <description>Seeking Python React intern in Nairobi</description>
          <pubDate>Mon, 17 Aug 2026 12:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>"""

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = rss_content

    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.get.return_value = mock_response

    with patch("httpx.AsyncClient", return_value=mock_client):
        mock_session = AsyncMock()
        service = RealJobAggregatorService(mock_session)
        jobs = await service.fetch_from_myjobmag_kenya(limit=5)
        assert len(jobs) >= 1
        assert jobs[0]["title"] == "Software Engineering Intern"
        assert jobs[0]["company_name"] == "Safaricom PLC"
        assert jobs[0]["level"] == "Intern"
        assert jobs[0]["currency"] == "KES"

@pytest.mark.asyncio
async def test_reliefweb_kenya_fetch():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": [
            {
                "fields": {
                    "title": "ICT & Data Analyst Officer",
                    "url": "https://reliefweb.int/job/98765",
                    "body": "Python SQL data analysis position in Nairobi Kenya",
                    "source": [{"name": "UNICEF Kenya"}],
                    "date": {"created": "2026-08-16T08:00:00+00:00"}
                }
            }
        ]
    }

    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.get.return_value = mock_response

    with patch("httpx.AsyncClient", return_value=mock_client):
        mock_session = AsyncMock()
        service = RealJobAggregatorService(mock_session)
        jobs = await service.fetch_from_reliefweb_kenya(limit=5)
        assert len(jobs) == 1
        assert jobs[0]["title"] == "ICT & Data Analyst Officer"
        assert jobs[0]["company_name"] == "UNICEF Kenya"
        assert "Python" in jobs[0]["required_skills"]


@pytest.mark.asyncio
async def test_fuzu_kenya_fetch():
    rss_content = """<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <item>
          <title>Cybersecurity Analyst at Equity Bank Kenya</title>
          <link>https://www.fuzu.com/kenya/job/54321</link>
          <description>Linux Security Incident Response Python Wireshark</description>
          <pubDate>Tue, 18 Aug 2026 09:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>"""

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = rss_content

    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.get.return_value = mock_response

    with patch("httpx.AsyncClient", return_value=mock_client):
        mock_session = AsyncMock()
        service = RealJobAggregatorService(mock_session)
        jobs = await service.fetch_from_fuzu_kenya(limit=5)
        assert len(jobs) >= 1
        assert jobs[0]["title"] == "Cybersecurity Analyst"
        assert jobs[0]["company_name"] == "Equity Bank Kenya"
        assert jobs[0]["currency"] == "KES"


@pytest.mark.asyncio
async def test_brightermonday_kenya_fetch():
    rss_content = """<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <item>
          <title>Senior Full Stack Developer at Cellulant</title>
          <link>https://www.brightermonday.co.ke/job/67890</link>
          <description>React Python FastAPI PostgreSQL microservices API</description>
          <pubDate>Wed, 19 Aug 2026 14:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>"""

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = rss_content

    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.get.return_value = mock_response

    with patch("httpx.AsyncClient", return_value=mock_client):
        mock_session = AsyncMock()
        service = RealJobAggregatorService(mock_session)
        jobs = await service.fetch_from_brightermonday_kenya(limit=5)
        assert len(jobs) >= 1
        assert jobs[0]["title"] == "Senior Full Stack Developer"
        assert jobs[0]["company_name"] == "Cellulant"
        assert "React" in jobs[0]["required_skills"]


@pytest.mark.asyncio
async def test_public_service_kenya_fetch():
    rss_content = """<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <item>
          <title>ICT Officer II (Software Systems &amp; Network Security)</title>
          <link>https://www.icta.go.ke/job/112233</link>
          <description>Python Linux Cyber Security Database Infrastructure</description>
          <pubDate>Thu, 20 Aug 2026 10:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>"""

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = rss_content

    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.get.return_value = mock_response

    with patch("httpx.AsyncClient", return_value=mock_client):
        mock_session = AsyncMock()
        service = RealJobAggregatorService(mock_session)
        jobs = await service.fetch_from_public_service_kenya(limit=5)
        assert len(jobs) >= 1
        assert jobs[0]["title"] == "ICT Officer II (Software Systems & Network Security)"
        assert "Public Service" in jobs[0]["company_name"] or "ICT Authority" in jobs[0]["company_name"]
        assert jobs[0]["currency"] == "KES"



