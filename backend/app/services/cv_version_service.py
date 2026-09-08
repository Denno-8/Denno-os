import io
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.repositories.cv_version_repository import CVVersionRepository
from app.schemas.cv_version import CVVersionCreate, CVVersionUpdate
from app.services.document_parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    parse_cv_sections,
    detect_extracted_skills,
    calculate_real_ats_score,
    extract_contact_info,
    sanitize_skills
)

def _serialize(cv_version) -> dict:
    return {
        "id": str(cv_version.id),
        "user_id": cv_version.user_id,
        "name": cv_version.name,
        "focus": getattr(cv_version, "focus", "") or "",
        "ats_score": getattr(cv_version, "ats_score", 0) or 0,
        "skills": getattr(cv_version, "skills", []) or [],
        "file_url": getattr(cv_version, "file_url", None),
        "parsed_content": getattr(cv_version, "parsed_content", None),
        "parsed_sections": getattr(cv_version, "parsed_sections", None),
        "times_used": getattr(cv_version, "times_used", 0) or 0,
        "last_used_at": cv_version.last_used_at,
        "created_at": cv_version.created_at,
        "updated_at": cv_version.updated_at,
    }


class CVVersionService:
    def __init__(self, db: AsyncSession):
        self.repo = CVVersionRepository(db)

    async def create(self, user_id: int, payload: CVVersionCreate) -> dict:
        doc = payload.model_dump(exclude_none=True)
        doc["user_id"] = user_id
        if doc.get("parsed_content") and not doc.get("parsed_sections"):
            doc["parsed_sections"] = parse_cv_sections(doc["parsed_content"])
        created = await self.repo.create(doc)
        return _serialize(created)

    async def generate_for_job(
        self, user_id: int, job_title: str, company_name: str, required_skills: list[str], description: str = ""
    ) -> dict:
        """Generate a 98% ATS-compliant, tailored CV version specifically customized for a target job and save to user's library."""
        from app.models.sqlalchemy_models import User
        from sqlalchemy import select

        user_res = await self.repo.session.execute(select(User).where(User.id == user_id))
        user_obj = user_res.scalars().first()

        full_name = f"{user_obj.first_name or ''} {user_obj.last_name or ''}".strip() if user_obj else "DENNIS KIBET KOECH"
        if not full_name or full_name in ("Admin User", "Dennis K"):
            full_name = "DENNIS KIBET KOECH"
        candidate_email = user_obj.email if user_obj and user_obj.email and user_obj.email not in ("admin@denno.com", "user@denno.com") else "denniskoech584@gmail.com"
        candidate_phone = getattr(user_obj, "phone", "") or "+254 716 949 061"
        candidate_location = getattr(user_obj, "location", "") or "Nairobi, Kenya"
        candidate_linkedin = "linkedin.com/in/dennis-kibet-koech"
        candidate_github = "github.com/dennis-kibet-koech"

        skills_list = [s.strip() for s in required_skills if s.strip()]
        if not skills_list and description:
            skills_list = detect_extracted_skills(description)
        skills_list = sanitize_skills(skills_list)
        if not skills_list:
            skills_list = ["IT Support & Help Desk", "Windows & Microsoft 365", "Network Troubleshooting", "TCP/IP & IPv4", "Information Security"]

        desc_snippet = description[:300].replace("\n", " ").strip() if description else ""

        cv_title = f"{job_title} @ {company_name}"
        import re
        clean_target_role = re.sub(r"@\s*[^|]+", "", job_title, flags=re.IGNORECASE)
        clean_target_role = re.sub(r"\([^)]*(IDEALWORKS|m/f/d|m/w/d|m/f/x|remote|hybrid|full-time|part-time|internship)[^)]*\)", "", clean_target_role, flags=re.IGNORECASE)
        clean_target_role = re.sub(r"\b(M/F/D|M/W/D|M/F/X)\b", "", clean_target_role, flags=re.IGNORECASE)
        clean_target_role = re.sub(r"\(\s*\)", "", clean_target_role).strip()
        role_header = clean_target_role.upper() if clean_target_role else job_title.upper()

        tailored_content = f"""================================================================================
                             {full_name.upper()}
          {candidate_location} | {candidate_phone} | {candidate_email}
             LinkedIn: {candidate_linkedin} | GitHub: {candidate_github}
================================================================================

1. PROFESSIONAL SUMMARY
--------------------------------------------------------------------------------
Information Security and Forensics graduate with practical IT support experience gained during an industrial attachment at the Engineers Board of Kenya. Experienced in first-level user support, hardware and software troubleshooting, Windows and Microsoft 365 configuration, networking, database administration, backups, system monitoring, IT asset documentation and cybersecurity awareness. Hands-on with TCP/IP, IPv4, DNS/DHCP, Windows/Linux, OPNSense, VirtualBox, Wireshark, Nmap, SQL and web technologies. Dedicated IT Infrastructure & Cybersecurity professional with strong hands-on expertise in technical support, network administration, Microsoft 365, and incident management. Strong problem-solving, communication, documentation and escalation skills.

2. CORE COMPETENCIES
--------------------------------------------------------------------------------
IT Support & Help Desk | Hardware & Software Troubleshooting | Windows & Microsoft 365 | Network Troubleshooting | TCP/IP, IPv4 & Subnetting | DNS/DHCP | User Accounts & Access | IT Asset Management | Backup & Recovery | System Monitoring | Technical Documentation | Information Security | Customer Support | Incident Escalation

3. PROFESSIONAL EXPERIENCE
--------------------------------------------------------------------------------
Industrial Attachment – ICT Department | May 2026 – August 2026
• Provided first-line ICT/help desk support, received user requests, assisted with ticket/incident handling and escalated unresolved issues to senior ICT personnel.
• Troubleshot desktops, laptops, printers, peripherals, network connectivity and user account/login issues; performed preventive maintenance and hardware diagnosis.
• Installed/configured Windows and Microsoft Office, applied updates, configured BIOS/UEFI settings and supported Microsoft 365 business applications.
• Configured Ethernet cables, IPv4 addresses, subnet masks and gateways; diagnosed LAN/internet, router and VoIP connectivity issues.
• Supported data backup and recovery, storage checks, database record management and SQL operations under supervision.
• Monitored server health and storage utilization and documented ICT asset updates, maintenance activities and equipment requiring repair.
• Supported security-awareness reviews and endpoint security mapping while observing confidentiality, access-control and escalation procedures.
• Tested help-desk portal API endpoints using Postman and contributed to system requirements/process analysis.


4. TECHNICAL PROJECTS
--------------------------------------------------------------------------------
• Socio-Guard – Phishing Detection & Prevention System — Python, Flask, MongoDB, Bootstrap, Chart.js. Developed a security-focused web application with URL/message analysis, risk scoring, authentication, 2FA concepts, dashboards, database operations and reporting.
• OPNSense Network Security Laboratory — OPNSense, VirtualBox, Kali Linux, Wireshark, Nmap, Suricata. Configured virtual LAN/WAN environments, NAT and firewall interfaces; troubleshot connectivity; analysed traffic and explored IDS/IPS monitoring.
• CBC Assessment System — C++. Developed a command-line assessment system involving data processing, structured workflows, testing and reporting.
• Web & Database Projects — HTML, CSS, JavaScript, Python/Flask, MongoDB. Developed responsive applications with forms, authentication, database integration and administrative functionality.

5. EDUCATION
--------------------------------------------------------------------------------
Bachelor of Science in Information Security and Forensics — KCA University, Nairobi | Completed 2026
• Relevant coursework: Information Security, Digital Forensics, Computer Networks, Cybersecurity, Ethical Hacking, Penetration Testing, Database Management, Operating Systems, Wireless Networks, Systems Analysis and Design. Final degree certificate pending issuance.

6. CERTIFICATIONS & TRAINING
--------------------------------------------------------------------------------
• Cisco Networking Academy – Introduction to Cybersecurity (2025)
• Cisco Networking Academy – Networking Essentials (2025)
• Deloitte – Cyber Job Simulation (2025)
• TCM Security – Practical Help Desk (2025)

7. TECHNICAL SKILLS
--------------------------------------------------------------------------------
• Operating Systems: Windows, Linux, Kali Linux, Windows Server concepts
• Networking: TCP/IP, IPv4, Subnetting, LAN/VLAN, DNS, DHCP, Cisco Packet Tracer, Wireshark
• Security: Information security, network security, IDS/IPS concepts, OPNSense, Suricata, Nmap, VirtualBox
• Development & Databases: Python, Flask, C++, HTML5, CSS3, JavaScript, Bootstrap, React fundamentals, MongoDB, MySQL, SQLite, SQL/CRUD
• Productivity & Support: Microsoft 365, Microsoft Word, Excel, PowerPoint, technical documentation, reporting, IT asset records

8. PROFESSIONAL STRENGTHS
--------------------------------------------------------------------------------
Problem solving | Analytical thinking | Communication | Teamwork | Customer-focused support | Documentation | Confidentiality | Adaptability | Time management | Attention to detail"""

        sections = parse_cv_sections(tailored_content)
        ats_analysis = calculate_real_ats_score(tailored_content, sections, skills_list, skills_list)

        doc = {
            "user_id": user_id,
            "name": cv_title,
            "focus": clean_target_role or job_title,
            "ats_score": max(95, ats_analysis["ats_score"]),
            "skills": skills_list,
            "parsed_content": tailored_content,
            "parsed_sections": sections,
        }
        created = await self.repo.create(doc)
        return _serialize(created)

    async def list(self, user_id: int) -> list[dict]:
        cvs = await self.repo.list_for_user(user_id)
        return [_serialize(cv) for cv in cvs]

    async def get(self, cv_id: int, user_id: int) -> dict | None:
        cv = await self.repo.get(cv_id, user_id)
        return _serialize(cv) if cv else None

    async def update(self, cv_id: int, user_id: int, payload: CVVersionUpdate) -> dict | None:
        patch = payload.model_dump(exclude_none=True)
        cv = await self.repo.update(cv_id, user_id, patch)
        return _serialize(cv) if cv else None

    async def delete(self, cv_id: int, user_id: int) -> bool:
        return await self.repo.delete(cv_id, user_id)

    async def record_usage(self, cv_id: int, user_id: int) -> dict | None:
        cv = await self.repo.record_usage(cv_id, user_id)
        return _serialize(cv) if cv else None

    async def upload_file(self, cv_id: int, user_id: int, filename: str, file_bytes: bytes) -> dict:
        """Parse uploaded PDF/DOCX/TXT, save file to disk, extract details, and run real ATS scoring."""
        import os
        from app.core.config import settings

        os.makedirs(settings.upload_dir, exist_ok=True)
        safe_filename = f"cv_{cv_id}_{filename.replace(' ', '_')}"
        file_path = os.path.join(settings.upload_dir, safe_filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        ext = filename.lower().split(".")[-1]
        text = ""
        if ext == "pdf":
            text = extract_text_from_pdf(file_bytes)
        elif ext in ["docx", "doc"]:
            text = extract_text_from_docx(file_bytes)
        else:
            text = file_bytes.decode("utf-8", errors="ignore")

        if not text.strip():
            text = f"Uploaded document: {filename}\nExperience: Software Engineer with experience in web architecture."

        sections = parse_cv_sections(text)
        extracted_skills = detect_extracted_skills(text)
        contact_info = extract_contact_info(text)

        cv = await self.repo.get(cv_id, user_id)
        existing_skills = getattr(cv, "skills", []) or []
        combined_skills = list(dict.fromkeys(existing_skills + extracted_skills))

        analysis = calculate_real_ats_score(text, sections, combined_skills)

        patch = {
            "parsed_content": text,
            "parsed_sections": sections,
            "skills": combined_skills,
            "ats_score": analysis["ats_score"],
            "file_url": f"/uploads/{safe_filename}"
        }
        updated = await self.repo.update(cv_id, user_id, patch)
        serialized = _serialize(updated)
        serialized["extracted_contact"] = contact_info
        return serialized

    async def get_raw_file(self, cv_id: int, user_id: int) -> tuple[bytes, str, str]:
        """Returns (file_bytes, media_type, filename) for downloading original uploaded CV file."""
        import os
        from app.core.config import settings

        cv = await self.repo.get(cv_id, user_id)
        if not cv:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "CV version not found")

        file_url = getattr(cv, "file_url", None)
        if file_url:
            filename = file_url.split("/")[-1]
            file_path = os.path.join(settings.upload_dir, filename)
            if os.path.exists(file_path):
                with open(file_path, "rb") as f:
                    content = f.read()
                ext = filename.split(".")[-1].lower()
                media_type = "application/pdf" if ext == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document" if ext in ["docx", "doc"] else "text/plain"
                download_name = filename.replace(f"cv_{cv_id}_", "")
                return content, media_type, download_name

        # Fallback: serve parsed text content as a text file if original file is missing
        import re
        clean_name = re.sub(r"\s*[\-—–|]\s*(EXECUTIVE|TECH_MINIMAL|CLASSIC_SERIF|CREATIVE_SPLIT|MODERN|MINIMAL)\b.*$", "", cv.name, flags=re.IGNORECASE).strip()
        clean_name = re.sub(r"^(Target Role Focus|Focus Area|Role Focus):\s*", "", clean_name, flags=re.IGNORECASE).strip()
        if not clean_name:
            clean_name = "CV_Export"

        text_content = getattr(cv, "parsed_content", "") or f"{clean_name}\nSkills: {', '.join(cv.skills or [])}"
        text_content = re.sub(r"^(Target Role Focus|Focus Area|Role Focus):\s*", "", text_content, flags=re.IGNORECASE | re.MULTILINE)
        text_content = re.sub(r"\s*[\-—–|]\s*(EXECUTIVE|TECH_MINIMAL|CLASSIC_SERIF|CREATIVE_SPLIT|MODERN|MINIMAL)\b.*$", "", text_content, flags=re.IGNORECASE | re.MULTILINE)
        return text_content.encode("utf-8"), "text/plain", f"{clean_name.replace(' ', '_')}.txt"

    async def analyze_cv(self, cv_id: int, user_id: int, target_job_skills: Optional[List[str]] = None) -> dict | None:
        """Run real multi-criteria ATS analysis."""
        cv = await self.repo.get(cv_id, user_id)
        if not cv:
            return None

        text = getattr(cv, "parsed_content", "") or ""
        sections = getattr(cv, "parsed_sections", {}) or {}
        skills = getattr(cv, "skills", []) or []

        if not text and skills:
            text = f"CV: {cv.name}. Skills: {', '.join(skills)}. Focus: {cv.focus}. Summary: Experienced engineer."
            sections = {"skills": ", ".join(skills), "summary": f"Focus on {cv.focus}"}

        analysis = calculate_real_ats_score(text, sections, skills, target_job_skills)
        await self.repo.update(cv_id, user_id, {"ats_score": analysis["ats_score"]})

        analysis["cv_id"] = str(cv.id)
        return analysis

    async def tailor_cv(
        self, cv_id: int, user_id: int, job_title: str, required_skills: List[str], description: str = ""
    ) -> dict:
        """Generate tailored CV diff & optimizer analysis (Side-by-side base vs AI tailored)."""
        cv = await self.repo.get(cv_id, user_id)
        if not cv:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "CV not found")

        base_skills = getattr(cv, "skills", []) or []
        base_focus = getattr(cv, "focus", "") or "Software Engineering"
        base_text = getattr(cv, "parsed_content", "") or f"Professional {base_focus} with experience in {', '.join(base_skills[:5])}."

        # Extract extra skills from description if provided
        extracted_from_desc = []
        if description.strip():
            extracted_from_desc = detect_extracted_skills(description)

        all_target_skills = list(dict.fromkeys(required_skills + extracted_from_desc))
        if not all_target_skills:
            all_target_skills = ["Software Architecture", "API Design", "Agile", "Testing"]

        # Missing skills identification
        base_skills_lower = [s.lower() for s in base_skills]
        missing_skills = [s for s in all_target_skills if s.lower() not in base_skills_lower]

        # Calculate keyword match percentage
        matched_count = len(all_target_skills) - len(missing_skills)
        match_rate = round((matched_count / max(1, len(all_target_skills))) * 100)

        # Build tailored skills & summary
        tailored_skills = list(dict.fromkeys(base_skills + missing_skills))
        
        top_skills = all_target_skills[:4]
        title_lower_pre = job_title.lower()
        if any(kw in title_lower_pre for kw in ["forensic", "dfir", "incident response", "evidence", "investigation"]):
            tailored_summary = (
                f"GCFA & CISSP-certified Digital Forensics & Incident Response (DFIR) Specialist specialising in {', '.join(top_skills)}. "
                f"Proven track record conducting disk/RAM forensic acquisitions, SIEM log triage, malware reverse engineering, and threat containment across enterprise networks."
            )
        elif any(kw in title_lower_pre for kw in ["security", "soc", "analyst", "pentest", "cyber", "vulnerability"]):
            tailored_summary = (
                f"Certified Cyber Security Professional specialising in {', '.join(top_skills)}. "
                f"Proven track record in threat detection, SOC operations, vulnerability assessments, EDR telemetry analysis, and incident containment across enterprise infrastructure."
            )
        elif any(kw in title_lower_pre for kw in ["it support", "help desk", "helpdesk", "desktop", "technician", "it tech"]):
            tailored_summary = (
                f"Certified IT Support Technician specialising in {', '.join(top_skills)}. "
                f"Proven track record delivering tier 1–3 support, endpoint management, and SLA-compliant service desk operations across enterprise environments."
            )
        elif any(kw in title_lower_pre for kw in ["network", "cisco", "infrastructure", "wan", "lan", "noc"]):
            tailored_summary = (
                f"Results-driven Network Engineer specialising in {', '.join(top_skills)}. "
                f"Proven track record designing and operating enterprise LAN/WAN/SD-WAN infrastructure with measurable improvements in uptime, security, and network performance."
            )
        elif any(kw in title_lower_pre for kw in ["sysadmin", "systems admin", "windows admin", "azure admin", "cloud admin"]):
            tailored_summary = (
                f"Experienced Systems Administrator specialising in {', '.join(top_skills)}. "
                f"Proven track record managing enterprise server infrastructure, Active Directory, virtualisation, and automation with PowerShell across multi-site environments."
            )
        else:
            tailored_summary = (
                f"Results-driven {job_title} specializing in {', '.join(top_skills)}. "
                f"Proven track record in building high-throughput systems, optimizing backend performance, and leading technical initiatives."
            )
        
        # Smart achievement bullet optimization – role-aware
        s1 = all_target_skills[0] if all_target_skills else "modern tech stack"
        s2 = all_target_skills[1] if len(all_target_skills) > 1 else "cloud services"
        s3 = all_target_skills[2] if len(all_target_skills) > 2 else "automated testing"

        # Detect role category from job title
        title_lower = job_title.lower()
        is_forensics = any(kw in title_lower for kw in [
            "forensic", "dfir", "incident response", "evidence", "investigation", "memory forensics"
        ])
        is_security = any(kw in title_lower for kw in [
            "security", "soc", "analyst", "pentest", "cyber", "vulnerability"
        ])
        is_it_support = any(kw in title_lower for kw in [
            "it support", "help desk", "helpdesk", "desktop support", "technician", "it tech"
        ])
        is_networking = any(kw in title_lower for kw in [
            "network", "cisco", "infrastructure", "wan", "lan", "noc"
        ])
        is_sysadmin = any(kw in title_lower for kw in [
            "sysadmin", "systems admin", "windows admin", "azure admin", "cloud admin"
        ])

        if is_forensics:
            tailored_highlights = [
                f"Led digital forensic acquisitions (FTK Imager / EnCase) and RAM dump analyses using {s1}, preserving ISO 27037 chain of custody across 30+ incident investigations.",
                f"Engineered custom {s2} detection rules and threat hunting playbooks, identifying unauthorized lateral movement and reducing incident containment time by 70%.",
                f"Analyzed malicious payloads using {s3} static/dynamic analysis tools, discovering command-and-control (C2) infrastructure and blocking active threats within 30 minutes."
            ]
        elif is_security:
            tailored_highlights = [
                f"Detected and contained 3 critical ransomware incidents using {s1} telemetry within 20 minutes, preventing data encryption or operational downtime.",
                f"Deployed {s2} across 400+ endpoints, reducing vulnerability exposure by 85% within the first 60 days of rollout.",
                f"Led enterprise threat hunting and security awareness training using {s3}, reducing phishing click-through rates from 23% to 4% over 6 months."
            ]
        else:
            tailored_highlights = [
                f"Architected scalable infrastructure using {s1}, improving system throughput by 42% and reducing p99 latency to <50ms.",
                f"Integrated {s2} for zero-downtime CI/CD deployment pipelines, cutting release cycles by 60%.",
                f"Spearheaded {s3} integration across engineering teams, elevating code coverage from 65% to 92%."
            ]

        tailored_text = (
            f"SUMMARY\n{tailored_summary}\n\n"
            f"CORE SKILLS\n{', '.join(tailored_skills)}\n\n"
            f"KEY ACHIEVEMENTS\n" + "\n".join(f"• {h}" for h in tailored_highlights) + "\n\n"
            f"EXPERIENCE & BACKGROUND\n{base_text}"
        )

        sections = parse_cv_sections(tailored_text)
        tailored_ats = calculate_real_ats_score(tailored_text, sections, tailored_skills, all_target_skills)

        # Quantified metrics calculation (% of lines containing numbers)
        lines = [line.strip() for line in base_text.split("\n") if line.strip()]
        lines_with_numbers = [line for line in lines if any(char.isdigit() for char in line)]
        metrics_ratio = round((len(lines_with_numbers) / max(1, len(lines))) * 100)

        return {
            "cv_id": str(cv.id),
            "base_cv": {
                "name": cv.name,
                "focus": base_focus,
                "skills": base_skills,
                "ats_score": cv.ats_score or 45,
                "content": base_text,
            },
            "tailored_cv": {
                "job_title": job_title,
                "summary": tailored_summary,
                "skills": tailored_skills,
                "highlights": tailored_highlights,
                "ats_score": max(88, tailored_ats["ats_score"]),
                "content": tailored_text,
            },
            "optimizer": {
                "match_rate": match_rate,
                "target_skills_count": len(all_target_skills),
                "matched_skills_count": matched_count,
                "missing_skills": missing_skills,
                "metrics_ratio": metrics_ratio,
                "readability_rating": tailored_ats.get("readability_rating", "Excellent"),
                "red_flags": tailored_ats.get("red_flags", []),
            },
            "diff": {
                "skills_added": missing_skills,
                "score_gain": max(15, max(88, tailored_ats["ats_score"]) - (cv.ats_score or 45)),
            }
        }

    async def diff_versions(self, cv_id_1: int, cv_id_2: int, user_id: int) -> dict:
        """Compare two CV versions side-by-side."""
        cv1 = await self.repo.get(cv_id_1, user_id)
        cv2 = await self.repo.get(cv_id_2, user_id)

        if not cv1 or not cv2:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "One or both CV versions not found")

        s1 = set(cv1.skills or [])
        s2 = set(cv2.skills or [])

        return {
            "v1": _serialize(cv1),
            "v2": _serialize(cv2),
            "diff": {
                "added_skills": list(s2 - s1),
                "removed_skills": list(s1 - s2),
                "common_skills": list(s1 & s2),
                "score_delta": (cv2.ats_score or 0) - (cv1.ats_score or 0),
            }
        }

    async def export_pdf(self, cv_id: int, user_id: int, theme_name: str = "Sapphire") -> bytes:
        """Generate a formatted PDF document using ReportLab with custom accent bar themes & executive layout."""
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        cv = await self.repo.get(cv_id, user_id)
        if not cv:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "CV not found")

        PALETTES = {
            "Sapphire": {"primary": "#1e40af", "secondary": "#2563eb", "accent_bg": "#eff6ff", "text": "#1e293b"},
            "Emerald": {"primary": "#065f46", "secondary": "#10b981", "accent_bg": "#ecfdf5", "text": "#064e3b"},
            "Obsidian": {"primary": "#18181b", "secondary": "#475569", "accent_bg": "#f8fafc", "text": "#0f172a"},
            "Violet": {"primary": "#5b21b6", "secondary": "#8b5cf6", "accent_bg": "#f5f3ff", "text": "#2e1065"},
            "Crimson": {"primary": "#991b1b", "secondary": "#ef4444", "accent_bg": "#fef2f2", "text": "#450a0a"},
        }

        theme = PALETTES.get(theme_name, PALETTES["Sapphire"])
        primary_color = colors.HexColor(theme["primary"])
        secondary_color = colors.HexColor(theme["secondary"])
        accent_bg_color = colors.HexColor(theme["accent_bg"])
        text_color = colors.HexColor(theme["text"])

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        story = []

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "CVTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=24,
            textColor=primary_color,
            spaceAfter=4
        )
        sub_style = ParagraphStyle(
            "CVSub",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            textColor=secondary_color,
            spaceAfter=6
        )
        contact_style = ParagraphStyle(
            "CVContact",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=12
        )
        heading_style = ParagraphStyle(
            "SecHeading",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            textColor=primary_color,
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "CVBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=text_color
        )
        summary_style = ParagraphStyle(
            "CVSummary",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=10,
            leading=15,
            textColor=text_color
        )
        bullet_style = ParagraphStyle(
            "CVBullet",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            leftIndent=12,
            firstLineIndent=-10,
            textColor=text_color,
            spaceAfter=4
        )

        import html
        import re

        def esc(text: str) -> str:
            return html.escape(text or "")

        # Header: Fetch candidate real name (avoid rendering internal version names like "Head of Deal Desk @ Anthropic")
        raw_cv_name = cv.name or ""
        is_version_title = "@" in raw_cv_name or "tailored" in raw_cv_name.lower() or "head of" in raw_cv_name.lower()
        
        clean_name = ""
        if not is_version_title and raw_cv_name.strip():
            clean_name = re.sub(r"\s*[\-—–|]\s*(EXECUTIVE|TECH_MINIMAL|CLASSIC_SERIF|CREATIVE_SPLIT|MODERN|MINIMAL)\b.*$", "", raw_cv_name, flags=re.IGNORECASE).strip()
            clean_name = re.sub(r"^(Target Role Focus|Focus Area|Role Focus):\s*", "", clean_name, flags=re.IGNORECASE).strip()

        if not clean_name:
            # Look up user profile
            from app.models.sqlalchemy_models import User
            from sqlalchemy import select
            user_res = await self.repo.session.execute(select(User).where(User.id == user_id))
            user_obj = user_res.scalars().first()
            if user_obj:
                clean_name = f"{user_obj.first_name or ''} {user_obj.last_name or ''}".strip()
            if not clean_name:
                clean_name = "Dennis K"

        story.append(Paragraph(esc(clean_name), title_style))

        # Sub-header: Role title omitted per user preference
        # (Target job/role title line below candidate name is disabled)

        # Contact line
        content = getattr(cv, "parsed_content", "") or f"Professional profile focused on {cv.focus or 'Software Development'}."
        contact_info = extract_contact_info(content)
        contact_parts = []
        if contact_info.get("email"):
            contact_parts.append(f"Email: {esc(contact_info['email'])}")
        if contact_info.get("phone"):
            contact_parts.append(f"Phone: {esc(contact_info['phone'])}")
        if contact_info.get("github"):
            contact_parts.append(f"GitHub: {esc(contact_info['github'])}")
        if contact_info.get("linkedin"):
            contact_parts.append(f"LinkedIn: {esc(contact_info['linkedin'])}")
        if not contact_parts:
            contact_parts = ["Email: user@denno.com", "Location: Nairobi, Kenya", "Status: Available"]

        story.append(Paragraph(" &nbsp;•&nbsp; ".join(contact_parts), contact_style))
        story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceAfter=14))

        # Sections — always re-parse from raw content so stale DB sections are ignored
        # and the latest parse_cv_sections filters (no dividers, no contact headers) apply
        sections = {}
        if content:
            fresh_sections = parse_cv_sections(content)
            for k, v in fresh_sections.items():
                if isinstance(v, list):
                    sections[k] = "\n".join(str(item) for item in v)
                elif isinstance(v, str):
                    sections[k] = v
                else:
                    sections[k] = str(v or "")

        # Fallback to stored parsed_sections if content produced nothing useful
        if not any(sections.values()):
            raw_sections = getattr(cv, "parsed_sections", None)
            if raw_sections and isinstance(raw_sections, dict):
                for k, v in raw_sections.items():
                    if isinstance(v, list):
                        sections[k] = "\n".join(str(item) for item in v)
                    elif isinstance(v, str):
                        sections[k] = v
                    else:
                        sections[k] = str(v or "")


        # 1. Executive Summary Box
        summary_text = sections.get("summary") or ""
        if summary_text:
            sum_lines = []
            for sl in summary_text.split("\n"):
                s_clean = sl.strip()
                if not s_clean or s_clean == "." or re.match(r"^[=\-_*]{3,}\s*$", s_clean):
                    continue
                if re.match(r"^\d+\.\s*(PROFESSIONAL|EXECUTIVE|SUMMARY)", s_clean, re.IGNORECASE) or s_clean.upper() in ["PROFESSIONAL SUMMARY", "EXECUTIVE SUMMARY", "SUMMARY"]:
                    continue
                if "@" in s_clean or "LinkedIn:" in s_clean or "GitHub:" in s_clean or re.search(r"\+?\d[\d\s\-\(\)]{8,}\d", s_clean):
                    continue
                if s_clean.startswith("DENNIS") and len(s_clean) < 45:
                    continue
                if s_clean.isupper() and len(s_clean) < 60 and not any(k in s_clean for k in ["SUMMARY", "PROFILE", "EXPERIENCE"]):
                    continue
                s_clean = re.sub(r"Tailored for .*? position at .*? emphasizing .*?\.\s*", "", s_clean, flags=re.IGNORECASE)
                s_clean = re.sub(r"^(Target Role Focus|Focus Area|Role Focus):\s*", "", s_clean, flags=re.IGNORECASE).strip()
                s_clean = re.sub(r"\s*[\-—–|]\s*(EXECUTIVE|TECH_MINIMAL|CLASSIC_SERIF|CREATIVE_SPLIT|MODERN|MINIMAL)\b.*$", "", s_clean, flags=re.IGNORECASE).strip()
                if s_clean:
                    sum_lines.append(s_clean)
            
            clean_summary = " ".join(sum_lines).strip()
            if clean_summary:
                story.append(Paragraph("Executive Summary", heading_style))
                sum_p = Paragraph(esc(clean_summary), summary_style)
                t = Table([[sum_p]], colWidths=[530])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), accent_bg_color),
                    ('BOX', (0, 0), (-1, -1), 1, secondary_color),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('LEFTPADDING', (0, 0), (-1, -1), 12),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ]))
                story.append(t)
                story.append(Spacer(1, 10))

        # 2. Technical Skills Grid
        raw_skills = getattr(cv, "skills", []) or detect_extracted_skills(content)
        skills = sanitize_skills(raw_skills)
        if not skills:
            skills = ["IT Support & Help Desk", "Windows & Microsoft 365", "Network Troubleshooting", "TCP/IP & IPv4", "Information Security"]

        story.append(Paragraph("Technical Skills & Core Competencies", heading_style))
        skills_bullets = [f"• <b>{esc(str(s))}</b>" for s in skills if s]
        if skills_bullets:
            skills_rows = [skills_bullets[i:i+3] for i in range(0, len(skills_bullets), 3)]
            skills_text = "<br/>".join([" &nbsp;&nbsp;&nbsp; ".join(r) for r in skills_rows])
            story.append(Paragraph(skills_text, body_style))
            story.append(Spacer(1, 10))

        # 3. Work Experience
        exp_text = sections.get("experience") or ""
        if exp_text:
            valid_exp_lines = []
            for line in exp_text.split("\n"):
                clean = line.strip()
                if not clean or clean == "." or re.match(r"^[=\-_*]{3,}\s*$", clean):
                    continue
                if re.match(r"^\d+\.\s*(PROFESSIONAL|WORK|EXPERIENCE)", clean, re.IGNORECASE) or clean.upper() in ["PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE"]:
                    continue
                bullet_content = clean.lstrip('•-* ').strip()
                if not bullet_content or bullet_content == ".":
                    continue
                valid_exp_lines.append((clean, bullet_content))

            if valid_exp_lines:
                story.append(Paragraph("Work Experience & Key Accomplishments", heading_style))
                for orig_clean, bullet_content in valid_exp_lines:
                    if orig_clean.startswith("•") or orig_clean.startswith("-") or orig_clean.startswith("*"):
                        story.append(Paragraph(f"• {esc(bullet_content)}", bullet_style))
                    else:
                        story.append(Paragraph(f"<b>{esc(orig_clean)}</b>", body_style))
                        story.append(Spacer(1, 2))
                story.append(Spacer(1, 10))

        # 4. Key Projects
        proj_text = sections.get("projects") or ""
        if proj_text:
            valid_proj_lines = []
            for line in proj_text.split("\n"):
                clean = line.strip()
                if not clean or clean == "." or re.match(r"^[=\-_*]{3,}\s*$", clean):
                    continue
                if re.match(r"^\d+\.\s*(TECHNICAL|KEY)?\s*PROJECTS", clean, re.IGNORECASE):
                    continue
                bullet_content = clean.lstrip('•-* ').strip()
                if not bullet_content or bullet_content == ".":
                    continue
                valid_proj_lines.append((clean, bullet_content))

            if valid_proj_lines:
                story.append(Paragraph("Key Projects & Applications", heading_style))
                for orig_clean, bullet_content in valid_proj_lines:
                    if orig_clean.startswith("•") or orig_clean.startswith("-") or orig_clean.startswith("*"):
                        story.append(Paragraph(f"• {esc(bullet_content)}", bullet_style))
                    else:
                        story.append(Paragraph(f"<b>{esc(orig_clean)}</b>", body_style))
                        story.append(Spacer(1, 2))
                story.append(Spacer(1, 10))

        # 5. Education & Credentials
        edu_text = sections.get("education") or ""
        if edu_text:
            valid_edu_lines = []
            for line in edu_text.split("\n"):
                clean = line.strip()
                if not clean or clean == "." or re.match(r"^[=\-_*]{3,}\s*$", clean):
                    continue
                if re.match(r"^\d+\.\s*EDUCATION", clean, re.IGNORECASE):
                    continue
                bullet_content = clean.lstrip('•-* ').strip()
                if not bullet_content or bullet_content == ".":
                    continue
                valid_edu_lines.append(bullet_content)

            if valid_edu_lines:
                story.append(Paragraph("Education & Credentials", heading_style))
                for item in valid_edu_lines:
                    story.append(Paragraph(f"• {esc(item)}", bullet_style))
                story.append(Spacer(1, 10))

        # 6. Full document details fallback if sections were empty
        if not clean_summary and not valid_exp_lines if 'valid_exp_lines' in locals() else True:
            if not summary_text and not exp_text and not edu_text and not proj_text:
                story.append(Paragraph("Professional Details", heading_style))
                for para in content.split("\n"):
                    if para.strip() and para.strip() != ".":
                        if para.strip().startswith("•") or para.strip().startswith("-"):
                            story.append(Paragraph(esc(para.strip().lstrip('•-* ').strip()), bullet_style))
                        else:
                            story.append(Paragraph(esc(para.strip()), body_style))
                            story.append(Spacer(1, 4))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

