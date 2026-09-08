import io
import re
from typing import Dict, List, Any, Optional

TECH_KEYWORDS = [
    # ── Software Engineering ──
    "Python", "FastAPI", "React", "TypeScript", "JavaScript", "PostgreSQL",
    "Docker", "Kubernetes", "AWS", "Redis", "System Design", "Node.js",
    "GraphQL", "Java", "Go", "C#", "Django", "Tailwind", "CI/CD", "Machine Learning",
    "Git", "REST API", "Microservices", "SQL", "MongoDB", "GCP", "Azure", "Terraform",
    "HTML", "CSS", "Linux", "Next.js", "Express", "Flask", "PyTest",
    "Jest", "Redux", "Kafka", "Elasticsearch", "Nginx", "Agile", "Scrum",

    # ── IT Technician / Help Desk / Desktop Support ──
    "Windows", "Windows Server", "Active Directory", "Group Policy", "SCCM",
    "Intune", "Microsoft 365", "Office 365", "Exchange Server", "SharePoint",
    "Help Desk", "Technical Support", "Desktop Support", "IT Support", "Tier 1 Support",
    "Tier 2 Support", "Tier 3 Support", "Remote Support", "ITIL", "ServiceNow",
    "Jira", "Zendesk", "Freshdesk", "Ticketing System", "SLA",
    "Hardware Troubleshooting", "Software Troubleshooting", "Patch Management",
    "Endpoint Management", "Remote Desktop", "VPN", "BitLocker", "Antivirus",
    "Malware Removal", "Imaging", "OS Deployment", "BIOS", "UEFI",
    "MacOS", "iOS", "Android", "MDM", "Jamf", "Device Management",
    "Printer Support", "Asset Management", "IT Documentation", "Knowledge Base",

    # ── Networking ──
    "Networking", "TCP/IP", "OSI Model", "DNS", "DHCP", "NAT", "VLAN",
    "Subnetting", "IP Addressing", "Routing", "Switching", "Firewall",
    "Cisco", "Cisco IOS", "Juniper", "MikroTik", "FortiGate", "Palo Alto",
    "BGP", "OSPF", "EIGRP", "STP", "RSTP", "LACP", "QoS",
    "LAN", "WAN", "MAN", "SD-WAN", "MPLS", "VPN", "IPSec", "SSL VPN",
    "Wireless Networking", "Wi-Fi", "802.11", "WPA2", "WPA3", "Access Point",
    "Network Monitoring", "SNMP", "Syslog", "Wireshark", "Nmap", "NetFlow",
    "Network Troubleshooting", "Packet Analysis", "Bandwidth Management",
    "Load Balancing", "Proxy Server", "Reverse Proxy", "Zscaler", "Meraki",
    "Network Security", "IDS", "IPS", "SIEM", "SOC", "Network Infrastructure",

    # ── Cybersecurity / Security ──
    "Cybersecurity", "Information Security", "Penetration Testing", "Ethical Hacking",
    "Vulnerability Assessment", "Security Auditing", "SIEM", "SOC Analyst",
    "Incident Response", "Forensics", "Kali Linux", "Metasploit", "Burp Suite",
    "OWASP", "CVE", "Zero Trust", "IAM", "MFA", "PKI", "SSL/TLS",
    "Encryption", "Compliance", "ISO 27001", "NIST", "GDPR", "PCI-DSS",

    # ── Cloud & Infrastructure ──
    "AWS EC2", "AWS S3", "AWS Lambda", "Azure AD", "Google Cloud", "VMware",
    "Hyper-V", "vSphere", "Virtualization", "Bare Metal", "SAN", "NAS",
    "Backup and Recovery", "Disaster Recovery", "RAID", "Storage Management",
    "Infrastructure as Code", "Ansible", "Puppet", "Chef", "PowerShell", "Bash",

    # ── Certifications (as searchable keywords) ──
    "CompTIA A+", "CompTIA Network+", "CompTIA Security+", "CCNA", "CCNP",
    "CCIE", "CEH", "CISSP", "CISM", "AWS Certified", "Azure Administrator",
    "Google Associate", "ITIL Foundation", "ITIL v4",
]

STANDARD_SECTIONS = {
    "summary": [r"summary", r"objective", r"about me", r"profile"],
    "experience": [r"experience", r"employment history", r"work history", r"professional experience"],
    "education": [r"education", r"academic background", r"qualifications"],
    "skills": [r"skills", r"technical skills", r"technologies", r"competencies"],
    "projects": [r"projects", r"personal projects", r"key projects"]
}

def extract_contact_info(text: str) -> Dict[str, str]:
    """Extract contact information (email, phone, github, linkedin, location) from document text."""
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    phone_match = re.search(r'\+?\d[\d\s\-\(\)]{8,}\d', text)
    linkedin_match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-]+', text, re.IGNORECASE)
    github_match = re.search(r'(?:https?://)?(?:www\.)?github\.com/[\w\-]+', text, re.IGNORECASE)
    
    return {
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match.group(0).strip() if phone_match else "",
        "linkedin": linkedin_match.group(0) if linkedin_match else "",
        "github": github_match.group(0) if github_match else ""
    }


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract raw text from PDF file bytes using pdfplumber."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            extracted = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted.append(text)
            return "\n".join(extracted)
    except Exception as e:
        # Fallback basic extraction if pdfplumber fails
        return ""

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract raw text from DOCX file bytes using python-docx."""
    try:
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except Exception as e:
        return ""

BANNED_SKILL_PATTERNS = [
    r"\b(bmw|idealworks|aboosto|google|amazon|meta|apple|anthropic|safaricom|kca|group)\b",
    r"\b(start-up|startup|internship|internships|munichjobs|munich|nairobi|kenya|remote|hybrid|full-time|part-time|fulltime|parttime)\b",
    r"\b(automationandrobotics|itsupport|itinternship|itinternships)\b",
    r"\b(innovation|growth|mentorship|responsibilities|qualifications|duties|requirements)\b"
]

def sanitize_skills(skills: List[str]) -> List[str]:
    """Sanitize skill lists by filtering out company names, location tags, hashtags, and meta words."""
    if not skills:
        return []
    cleaned = []
    for s in skills:
        st = str(s).strip()
        if not st or len(st) < 2:
            continue
        if any(re.search(pat, st, re.IGNORECASE) for pat in BANNED_SKILL_PATTERNS):
            continue
        if len(st) > 12 and " " not in st and "-" not in st and "/" not in st and st == st.lower():
            continue
        cleaned.append(st)
    return list(dict.fromkeys(cleaned))

def parse_cv_sections(text: str) -> Dict[str, str]:
    """Break text into logical resume sections."""
    lines = text.split("\n")
    sections: Dict[str, List[str]] = {
        "summary": [],
        "experience": [],
        "education": [],
        "skills": [],
        "projects": [],
        "other": []
    }
    
    # Extended patterns that also handle numbered headers like "1. PROFESSIONAL SUMMARY"
    SECTION_PATTERNS = {
        "summary": [r"summary", r"objective", r"about me", r"profile", r"professional summary", r"executive summary"],
        "experience": [r"experience", r"employment history", r"work history", r"professional experience"],
        "education": [r"education", r"academic background", r"qualifications", r"certifications"],
        "skills": [r"skills", r"technical skills", r"technologies", r"competencies", r"core competencies"],
        "projects": [r"projects", r"personal projects", r"key projects", r"technical projects"]
    }

    current_section = None
    for line in lines:
        raw_line = line.strip()
        clean_line = raw_line.lower()
        if not clean_line:
            continue
            
        # Ignore ASCII divider / separator lines (===, ---, ___, etc.)
        if re.match(r"^[=\-_*]{3,}\s*$", clean_line):
            continue

        # Strip leading numbering for section matching: "1. PROFESSIONAL SUMMARY" -> "professional summary"
        stripped_for_match = re.sub(r"^\d+\.\s*", "", clean_line).strip()

        matched = False
        for sec_name, patterns in SECTION_PATTERNS.items():
            # Match if the line (with number stripped) contains a section keyword and is short (header-like)
            if any(re.search(rf"\b{p}\b", stripped_for_match) for p in patterns) and len(stripped_for_match) < 50:
                current_section = sec_name
                matched = True
                break
                
        if not matched and current_section:
            # Skip candidate header / contact lines that shouldn't be in any section body
            if "@" in clean_line or "linkedin:" in clean_line or "github:" in clean_line or re.search(r"\+?\d[\d\s\-\(\)]{8,}\d", clean_line):
                continue
            # Skip short lines that look like a candidate name header
            if re.match(r"^[a-z\s]{3,40}$", clean_line) and current_section == "summary" and len(clean_line) < 40 and not any(c in clean_line for c in [".", ",", "•", "-"]):
                continue
            sections[current_section].append(line)

    # Fallback if no section header was matched throughout the document
    all_empty = all(len(v) == 0 for v in sections.values())
    if all_empty and lines:
        sections["summary"] = [l for l in lines if l.strip() and not re.match(r"^[=\-_*]{3,}\s*$", l.strip())]

    return {k: "\n".join(v).strip() for k, v in sections.items() if v}


def detect_extracted_skills(text: str) -> List[str]:
    """Extract recognized technical keywords from raw text."""
    found = []
    for kw in TECH_KEYWORDS:
        if re.search(r"\b" + re.escape(kw) + r"\b", text, re.IGNORECASE):
            found.append(kw)
    return list(dict.fromkeys(found))

def calculate_real_ats_score(
    parsed_text: str,
    sections: Dict[str, str],
    cv_skills: List[str],
    job_required_skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Multi-criteria ATS Scoring algorithm:
    1. Keyword match % (40% weight)
    2. Section presence (25% weight)
    3. Formatting red flags (20% weight)
    4. Quantified achievement metrics (15% weight)
    """
    # 1. Keyword match score (40 points max)
    target_skills = job_required_skills if job_required_skills and len(job_required_skills) > 0 else TECH_KEYWORDS[:12]
    matched_skills = [s for s in target_skills if any(re.search(r"\b" + re.escape(s) + r"\b", parsed_text, re.IGNORECASE) for _ in [1]) or s in cv_skills]
    missing_skills = [s for s in target_skills if s not in matched_skills]
    keyword_match_pct = (len(matched_skills) / len(target_skills)) if target_skills else 1.0
    keyword_score = keyword_match_pct * 40

    # 2. Section presence score (25 points max)
    required_sec = ["summary", "experience", "education", "skills"]
    present_sec = [s for s in required_sec if s in sections and len(sections[s]) > 20]
    section_score = (len(present_sec) / len(required_sec)) * 25

    # 3. Red flags deduction (20 points max, start with 20)
    red_flags = []
    red_flag_score = 20
    # Check table formatting artifacts
    if parsed_text.count("|") > 10:
        red_flags.append("Excessive table borders detected (ATS parsers may scramble columns)")
        red_flag_score -= 5
    # Check short overall length
    if len(parsed_text.split()) < 80:
        red_flags.append("CV is too brief (< 80 words)")
        red_flag_score -= 10
    # Check headers/footers choke
    if re.search(r"page \d+ of \d+", parsed_text, re.IGNORECASE):
        red_flags.append("Page number header/footer detected")
        red_flag_score -= 3
    red_flag_score = max(0, red_flag_score)

    # 4. Quantified achievements score (15 points max)
    # Look for patterns like "45%", "$10k", "20x", "increased by 30%", "managed 5 developers"
    quant_matches = re.findall(r"\b\d+%\b|\$\d+[\d,]*|\b\d+x\b|increased by \d+|reduced by \d+|managed \d+|led \d+|built \d+", parsed_text, re.IGNORECASE)
    quant_count = len(quant_matches)
    quant_score = min(15, quant_count * 3)

    total_score = round(keyword_score + section_score + red_flag_score + quant_score)
    total_score = min(98, max(25, total_score))

    readability = "Excellent" if total_score >= 85 else "Good" if total_score >= 70 else "Needs Improvement"

    tips = []
    if missing_skills:
        tips.append(f"Add missing target keywords: {', '.join(missing_skills[:4])}.")
    if len(present_sec) < len(required_sec):
        missing_headers = [s.capitalize() for s in required_sec if s not in present_sec]
        tips.append(f"Include explicit standard section headers for: {', '.join(missing_headers)}.")
    if quant_count < 3:
        tips.append("Add more quantified achievements (e.g. 'Improved speed by 35%', 'Managed team of 4').")
    if red_flags:
        tips.append(red_flags[0])

    return {
        "ats_score": total_score,
        "readability_rating": readability,
        "matched_skills_count": len(matched_skills),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "red_flags": red_flags,
        "quantified_metrics_count": quant_count,
        "keyword_suggestions": missing_skills[:6],
        "optimization_tips": tips
    }
