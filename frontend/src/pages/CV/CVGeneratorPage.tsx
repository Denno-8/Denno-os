import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Plus, Trash2, Download, Save, Eye, Edit3,
  User, Briefcase, GraduationCap, Code, FolderOpen, Sparkles,
  Layout, Palette, CheckCircle2, AlertTriangle, RefreshCw, Layers, Printer, ArrowLeft
} from "lucide-react";
import { useCreateCV, useGenerateCVForJob } from "../../hooks/useCV";
import { useJobs } from "../../hooks/useJobs";
import { cvService } from "../../services/cv.service";

/* ─── Types ─── */
interface WorkExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  bullets: string[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  period: string;
  grade?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  tech: string;
}

interface CVData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
}

export type TemplateId = "executive" | "tech_minimal" | "classic_serif" | "creative_split";

export type ThemeColor = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  bgLight: string;
  borderLight: string;
};

export const COLOR_THEMES: ThemeColor[] = [
  { id: "sapphire", name: "Sapphire Blue", primary: "#2563eb", secondary: "#1d4ed8", bgLight: "#eff6ff", borderLight: "#bfdbfe" },
  { id: "emerald", name: "Emerald Green", primary: "#059669", secondary: "#047857", bgLight: "#ecfdf5", borderLight: "#a7f3d0" },
  { id: "obsidian", name: "Obsidian Dark", primary: "#1e293b", secondary: "#0f172a", bgLight: "#f8fafc", borderLight: "#cbd5e1" },
  { id: "violet", name: "Violet Modern", primary: "#7c3aed", secondary: "#6d28d9", bgLight: "#f5f3ff", borderLight: "#ddd6fe" },
  { id: "crimson", name: "Crimson Exec", primary: "#dc2626", secondary: "#b91c1c", bgLight: "#fef2f2", borderLight: "#fecaca" },
];

// ── Sample CVs (role-specific templates) ──
const SAMPLE_CV_DENNIS: CVData = {
  fullName: "DENNIS KIBET KOECH",
  email: "deno14619@gmail.com",
  phone: "+254 716 949 061",
  location: "Nairobi, Kenya",
  linkedin: "linkedin.com/in/dennis-kibet-koech",
  github: "github.com/dennis-kibet-koech",
  summary: "Information Security and Forensics graduate with practical IT support experience gained during an industrial attachment at the Engineers Board of Kenya. Experienced in first-level user support, hardware and software troubleshooting, Windows and Microsoft 365 configuration, networking, database administration, backups, system monitoring, IT asset documentation and cybersecurity awareness. Hands-on with TCP/IP, IPv4, DNS/DHCP, Windows/Linux, OPNSense, VirtualBox, Wireshark, Nmap, SQL and web technologies. Strong problem-solving, communication, documentation and escalation skills.",
  skills: [
    "IT Support & Help Desk", "Hardware & Software Troubleshooting", "Windows & Microsoft 365",
    "Network Troubleshooting", "TCP/IP, IPv4 & Subnetting", "DNS/DHCP", "User Accounts & Access",
    "IT Asset Management", "Backup & Recovery", "System Monitoring", "Technical Documentation",
    "Information Security", "Customer Support", "Incident Escalation",
    "Windows", "Linux", "Kali Linux", "Windows Server", "Cisco Packet Tracer", "Wireshark",
    "Nmap", "Suricata", "OPNSense", "VirtualBox", "Python", "Flask", "C++", "HTML5", "CSS3",
    "JavaScript", "Bootstrap", "React fundamentals", "MongoDB", "MySQL", "SQLite", "SQL/CRUD",
    "Cisco Intro to Cybersecurity", "Cisco Networking Essentials", "Deloitte Cyber Job Simulation", "TCM Security Practical Help Desk"
  ],
  experience: [
    {
      id: "exp_ebk",
      company: "Engineers Board of Kenya (EBK)",
      role: "Industrial Attachment – ICT Department",
      period: "May 2026 – August 2026 (Nairobi, Kenya)",
      bullets: [
        "Provided first-line ICT/help desk support, received user requests, assisted with ticket/incident handling and escalated unresolved issues to senior ICT personnel.",
        "Troubleshot desktops, laptops, printers, peripherals, network connectivity and user account/login issues; performed preventive maintenance and hardware diagnosis.",
        "Installed/configured Windows and Microsoft Office, applied updates, configured BIOS/UEFI settings and supported Microsoft 365 business applications.",
        "Configured Ethernet cables, IPv4 addresses, subnet masks and gateways; diagnosed LAN/internet, router and VoIP connectivity issues.",
        "Supported data backup and recovery, storage checks, database record management and SQL operations under supervision.",
        "Monitored server health and storage utilization and documented ICT asset updates, maintenance activities and equipment requiring repair.",
        "Supported security-awareness reviews and endpoint security mapping while observing confidentiality, access-control and escalation procedures.",
        "Tested help-desk portal API endpoints using Postman and contributed to system requirements/process analysis."
      ],
    },
  ],
  education: [
    {
      id: "edu_kca",
      institution: "KCA University, Nairobi",
      degree: "Bachelor of Science in Information Security and Forensics",
      period: "Completed 2026",
      grade: "Final degree certificate pending issuance | Coursework: Information Security, Digital Forensics, Computer Networks, Cybersecurity, Ethical Hacking, Penetration Testing, Database Management, Operating Systems, Wireless Networks, Systems Analysis and Design",
    },
  ],
  projects: [
    {
      id: "proj_sg",
      name: "Socio-Guard – Phishing Detection & Prevention System",
      description: "Developed a security-focused web application with URL/message analysis, risk scoring, authentication, 2FA concepts, dashboards, database operations and reporting.",
      tech: "Python, Flask, MongoDB, Bootstrap, Chart.js",
    },
    {
      id: "proj_opn",
      name: "OPNSense Network Security Laboratory",
      description: "Configured virtual LAN/WAN environments, NAT and firewall interfaces; troubleshot connectivity; analysed traffic and explored IDS/IPS monitoring.",
      tech: "OPNSense, VirtualBox, Kali Linux, Wireshark, Nmap, Suricata",
    },
    {
      id: "proj_cbc",
      name: "CBC Assessment System",
      description: "Developed a command-line assessment system involving data processing, structured workflows, testing and reporting.",
      tech: "C++",
    },
    {
      id: "proj_webdb",
      name: "Web & Database Projects",
      description: "Developed responsive applications with forms, authentication, database integration and administrative functionality.",
      tech: "HTML5, CSS3, JavaScript, Python/Flask, MongoDB",
    },
  ],
};

const SAMPLE_CV = SAMPLE_CV_DENNIS; // default to Dennis Kibet Koech

type SampleCVRole = "dennis";
const SAMPLE_CVS: Record<SampleCVRole, CVData> = {
  dennis: SAMPLE_CV_DENNIS,
};
const SAMPLE_CV_LABELS: Record<SampleCVRole, string> = {
  dennis: "Dennis Kibet Koech (Master CV)",
};

/* ─── Main Page ─── */
export default function CVGeneratorPage() {
  const navigate = useNavigate();
  const [cv, setCV] = useState<CVData>(SAMPLE_CV);
  const [newSkill, setNewSkill] = useState("");
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const [template, setTemplate] = useState<TemplateId>("executive");
  const [theme, setTheme] = useState<ThemeColor>(COLOR_THEMES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCvId, setSavedCvId] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [sampleRole, setSampleRole] = useState<SampleCVRole>("dennis");

  // Optimizer state – Cybersecurity & Forensics defaults
  const [optTitle, setOptTitle] = useState("Digital Forensics & Incident Response (DFIR) Specialist");
  const [optJD, setOptJD] = useState(
    "Looking for a Digital Forensics & Incident Response Specialist with expertise in Volatility memory analysis, FTK Imager, Splunk SIEM, CrowdStrike EDR, malware analysis, and threat hunting."
  );
  const [optSkills, setOptSkills] = useState(
    "Digital Forensics, Incident Response, Volatility, FTK Imager, SIEM, Splunk, CrowdStrike, Wireshark, Malware Analysis, Threat Hunting, EnCase, YARA"
  );
  const [optResult, setOptResult] = useState<any>(null);

  // IT & Cybersecurity optimizer presets
  const OPT_PRESETS: Record<string, { title: string; skills: string; jd: string }> = {
    "Digital Forensics (DFIR)": {
      title: "Digital Forensics & Incident Response (DFIR) Analyst",
      skills: "Digital Forensics, Incident Response, Memory Forensics, Volatility, FTK Imager, EnCase, Wireshark, SIEM, Splunk, CrowdStrike, Malware Analysis, Chain of Custody, GCFA",
      jd: "Seeking a Digital Forensics Analyst experienced in disk imaging, RAM dump analysis, event log triage, threat hunting, and incident handling under SANS/NIST frameworks.",
    },
    "Cybersecurity & SOC Analyst": {
      title: "Cybersecurity & SOC Analyst",
      skills: "SIEM, Microsoft Sentinel, Splunk, EDR, CrowdStrike, Incident Response, Vulnerability Management, Nessus, Firewall, CompTIA Security+, CEH, Threat Intelligence",
      jd: "Looking for a SOC Analyst to monitor SIEM alerts, investigate security incidents, perform vulnerability assessments, and execute threat containment playbooks.",
    },
    "Penetration Testing & Red Team": {
      title: "Penetration Testing & Security Engineer",
      skills: "Penetration Testing, Metasploit, Burp Suite Pro, Nmap, Vulnerability Scanning, Web App Security, OWASP Top 10, Privilege Escalation, Python, OSCP, CEH",
      jd: "Seeking a Penetration Tester to conduct vulnerability exploitation, web application security assessments, infrastructure testing, and technical remediation reporting.",
    },
    "IT Support / Help Desk": {
      title: "Senior IT Support Technician",
      skills: "Active Directory, Windows Server, Microsoft 365, Intune, MDM, Help Desk, ITIL, ServiceNow, VPN, Remote Desktop, Hardware Troubleshooting, PowerShell",
      jd: "Looking for an IT Technician with strong experience in Active Directory, Microsoft 365 administration, end-user support, ITIL processes, and endpoint management.",
    },
    "Network Engineer": {
      title: "Network Infrastructure Engineer",
      skills: "Cisco IOS, OSPF, BGP, VLAN, STP, TCP/IP, Firewall, VPN, Wireshark, SNMP, QoS, SD-WAN, Palo Alto, CCNA, CCNP",
      jd: "Seeking a Network Engineer with hands-on experience in Cisco routing & switching, OSPF/BGP, firewall management, VPN, and network monitoring.",
    },
    "Sysadmin / Windows Server": {
      title: "Windows Systems Administrator",
      skills: "Windows Server, Active Directory, Group Policy, DHCP, DNS, PowerShell, Hyper-V, WSUS, Backup and Recovery, VMware, Azure AD, SCCM",
      jd: "Looking for a Sysadmin with deep Windows Server, AD, Group Policy, virtualisation, and PowerShell scripting skills.",
    },
    "Software Engineer": {
      title: "Lead Full Stack Engineer",
      skills: "Python, FastAPI, React, Docker, PostgreSQL, Redis, Kubernetes, AWS, CI/CD, GraphQL",
      jd: "Looking for a Lead Engineer with expertise in Python, FastAPI, React, Docker, PostgreSQL, Redis, and Kubernetes.",
    },
  };

  const previewRef = useRef<HTMLDivElement>(null);
  const createCV = useCreateCV();
  const generateCVForJob = useGenerateCVForJob();
  const { data: userJobs = [] } = useJobs();
  const [isAutoGeneratingCV, setIsAutoGeneratingCV] = useState(false);
  const [autoGenMsg, setAutoGenMsg] = useState<string | null>(null);

  const uid = () => Math.random().toString(36).slice(2, 9);

  const addExperience = () => {
    setCV((p) => ({
      ...p,
      experience: [...p.experience, { id: uid(), company: "", role: "", period: "", bullets: [""] }],
    }));
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setCV((p) => ({
      ...p,
      experience: p.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const updateBullet = (expId: string, idx: number, value: string) => {
    setCV((p) => ({
      ...p,
      experience: p.experience.map((e) =>
        e.id === expId ? { ...e, bullets: e.bullets.map((b, i) => (i === idx ? value : b)) } : e
      ),
    }));
  };

  const addBullet = (expId: string) => {
    setCV((p) => ({
      ...p,
      experience: p.experience.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets, ""] } : e
      ),
    }));
  };

  const removeBullet = (expId: string, idx: number) => {
    setCV((p) => ({
      ...p,
      experience: p.experience.map((e) =>
        e.id === expId ? { ...e, bullets: e.bullets.filter((_, i) => i !== idx) } : e
      ),
    }));
  };

  const removeExperience = (id: string) =>
    setCV((p) => ({ ...p, experience: p.experience.filter((e) => e.id !== id) }));

  const addEducation = () => {
    setCV((p) => ({
      ...p,
      education: [...p.education, { id: uid(), institution: "", degree: "", period: "", grade: "" }],
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setCV((p) => ({
      ...p,
      education: p.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const removeEducation = (id: string) =>
    setCV((p) => ({ ...p, education: p.education.filter((e) => e.id !== id) }));

  const addProject = () => {
    setCV((p) => ({
      ...p,
      projects: [...p.projects, { id: uid(), name: "", description: "", tech: "" }],
    }));
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    setCV((p) => ({
      ...p,
      projects: p.projects.map((pr) => (pr.id === id ? { ...pr, [field]: value } : pr)),
    }));
  };

  const removeProject = (id: string) =>
    setCV((p) => ({ ...p, projects: p.projects.filter((pr) => pr.id !== id) }));

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed || cv.skills.includes(trimmed)) return;
    setCV((p) => ({ ...p, skills: [...p.skills, trimmed] }));
    setNewSkill("");
  };

  const removeSkill = (s: string) =>
    setCV((p) => ({ ...p, skills: p.skills.filter((sk) => sk !== s) }));

  const handlePrint = () => {
    window.print();
  };

  const handleRunOptimizer = () => {
    const targetList = optSkills.split(",").map((s) => s.trim()).filter(Boolean);
    const missing = targetList.filter((s) => !cv.skills.some((sk) => sk.toLowerCase() === s.toLowerCase()));
    const matched = targetList.length - missing.length;
    const matchRate = round((matched / max(1, targetList.length)) * 100);

    setOptResult({
      matchRate,
      targetCount: targetList.length,
      matchedCount: matched,
      missing,
      suggestedSummary: `Results-driven ${optTitle} specializing in ${targetList.slice(0, 4).join(", ")}. Proven track record in building high-throughput systems, optimizing backend performance, and leading engineering teams.`,
      suggestedBullets: [
        `Architected scalable infrastructure using ${targetList[0] || "modern tech stack"}, improving system throughput by 42% and reducing response times.`,
        `Integrated ${targetList[1] || "cloud services"} for zero-downtime CI/CD deployment pipelines, cutting release cycles by 60%.`,
      ],
    });
  };

  const applyMissingSkills = () => {
    if (!optResult?.missing) return;
    const combined = Array.from(new Set([...cv.skills, ...optResult.missing]));
    setCV((p) => ({ ...p, skills: combined }));
  };

  const applyOptimizerSummary = () => {
    if (!optResult?.suggestedSummary) return;
    setCV((p) => ({ ...p, summary: optResult.suggestedSummary }));
  };

  const max = (a: number, b: number) => (a > b ? a : b);
  const round = (val: number) => Math.round(val);

  const buildCVContentText = () => {
    return `
PERSONAL INFORMATION
Name: ${cv.fullName}
Email: ${cv.email}
Phone: ${cv.phone}
Location: ${cv.location}

SUMMARY
${cv.summary}

TECHNICAL SKILLS
${cv.skills.join(", ")}

EXPERIENCE
${cv.experience.map((e) => `${e.role} (${e.period})\n${e.bullets.map((b) => `• ${b}`).join("\n")}`).join("\n\n")}

EDUCATION
${cv.education.map((e) => `${e.degree} — ${e.institution} (${e.period})${e.grade ? ` | ${e.grade}` : ""}`).join("\n")}
    `.trim();
  };

  const handleSaveAsVersion = async () => {
    if (!cv.fullName.trim()) return;
    setIsSaving(true);
    const content = buildCVContentText();
    const cleanFocus = optTitle.trim() || cv.experience[0]?.role || "Software Engineering";

    createCV.mutate(
      { name: cv.fullName.trim(), focus: cleanFocus, skills: cv.skills, parsed_content: content },
      {
        onSuccess: (data: any) => {
          setIsSaving(false);
          if (data?.id) setSavedCvId(data.id);
        },
        onError: () => setIsSaving(false),
      }
    );
  };

  const handleExportPDFFile = async () => {
    if (!cv.fullName.trim()) {
      alert("Please enter a Full Name before exporting.");
      return;
    }
    setIsExportingPDF(true);
    try {
      let cvId = savedCvId;
      const cleanFocus = optTitle.trim() || cv.experience[0]?.role || "Software Engineering";
      if (!cvId) {
        const content = buildCVContentText();
        const created = await createCV.mutateAsync({
          name: cv.fullName.trim(),
          focus: cleanFocus,
          skills: cv.skills,
          parsed_content: content,
        });
        cvId = created.id;
        setSavedCvId(created.id);
      }
      const themeKey = theme.name.split(" ")[0] || "Sapphire";
      await cvService.exportPDF(cvId, themeKey, cv.fullName);
    } catch (err: any) {
      console.error("Export PDF error:", err);
      alert("Failed to export PDF: " + (err?.message || "Check server logs."));
    } finally {
      setIsExportingPDF(false);
    }
  };

  const SECTIONS = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "summary", label: "Summary", icon: FileText },
    { id: "skills", label: "Skills", icon: Code },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "projects", label: "Projects", icon: FolderOpen },
    { id: "optimizer", label: "AI Tailor & Optimizer", icon: Sparkles },
  ];

  const showEditor = viewMode === "split" || viewMode === "editor";
  const showPreview = viewMode === "split" || viewMode === "preview";

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #cv-print-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; z-index: 9999; background: #fff; }
        }
        @media screen { #cv-print-area { display: none; } }
      `}</style>

      {/* Hidden print area */}
      <div id="cv-print-area">
        <CVPreview cv={cv} template={template} theme={theme} targetRole={optTitle} />
      </div>

      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        {/* Top Banner */}
        <div style={bannerStyle}>
          <div>
            <button
              onClick={() => navigate("/cv")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                color: "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 8,
              }}
            >
              <ArrowLeft size={13} />
              <span>Back to CV Manager</span>
            </button>
            <div style={badgeStyle}>Professional Resume Builder</div>
            <h2 style={{ margin: "6px 0 4px", fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
              CV Generator &amp; Template Suite
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
              Build, optimize, and customize professional resumes with real-time template switching
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {/* Load Sample CV role picker */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--input-bg)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "4px 10px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Load Sample:</span>
              {(Object.keys(SAMPLE_CVS) as SampleCVRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => { setSampleRole(role); setCV(SAMPLE_CVS[role]); setSavedCvId(null); }}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    background: sampleRole === role ? theme.primary : "transparent",
                    color: sampleRole === role ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {SAMPLE_CV_LABELS[role]}
                </button>
              ))}
            </div>
            {/* View mode toggle */}
            <div style={viewToggleWrap}>
              {(["editor", "split", "preview"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  style={{ ...viewToggleBtn, ...(viewMode === m ? viewToggleActive : {}) }}
                >
                  {m === "editor" ? <Edit3 size={13} /> : m === "preview" ? <Eye size={13} /> : null}
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveAsVersion}
              disabled={!cv.fullName.trim() || isSaving}
              style={{ ...actionBtn, background: "#059669", opacity: !cv.fullName.trim() || isSaving ? 0.6 : 1 }}
            >
              <Save size={14} />
              {isSaving ? "Saving…" : "Save Version"}
            </button>
            <button
              onClick={handleExportPDFFile}
              disabled={!cv.fullName.trim() || isExportingPDF}
              style={{ ...actionBtn, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", opacity: !cv.fullName.trim() || isExportingPDF ? 0.6 : 1 }}
            >
              <Download size={14} />
              {isExportingPDF ? "Downloading PDF..." : "Export PDF"}
            </button>
            <button
              onClick={handlePrint}
              title="Print or Save via Browser Print View"
              style={{ ...actionBtn, background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
            >
              <Printer size={14} />
              Print View
            </button>
          </div>
        </div>

        {/* Template & Color Selector Bar */}
        <div style={toolbarStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Layout size={15} style={{ color: "var(--text-secondary)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Template:
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { id: "executive", name: "Modern Executive" },
                { id: "tech_minimal", name: "Tech Minimalist" },
                { id: "classic_serif", name: "Classic Serif" },
                { id: "creative_split", name: "Creative Split" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id as TemplateId)}
                  style={{
                    ...templateBtn,
                    background: template === t.id ? theme.primary : "var(--input-bg)",
                    color: template === t.id ? "#fff" : "var(--text-primary)",
                    borderColor: template === t.id ? theme.primary : "var(--border-color)",
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Palette size={15} style={{ color: "var(--text-secondary)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Color Theme:
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {COLOR_THEMES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setTheme(c)}
                  title={c.name}
                  style={{
                    width: 22, height: 22, borderRadius: "50%", background: c.primary,
                    border: theme.id === c.id ? "3px solid #fff" : "2px solid transparent",
                    outline: theme.id === c.id ? `2px solid ${c.primary}` : "none",
                    cursor: "pointer", transition: "transform 0.15s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div style={{ display: "grid", gridTemplateColumns: showEditor && showPreview ? "1fr 1fr" : "1fr", gap: 20 }}>
          {/* ── Editor Panel ── */}
          {showEditor && (
            <div style={panelStyle}>
              {/* Section tabs */}
              <div style={sectionTabsWrap}>
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    style={{
                      ...sectionTab,
                      background: activeSection === id ? theme.primary : "transparent",
                      color: activeSection === id ? "#fff" : "var(--text-secondary)",
                    }}
                  >
                    <Icon size={13} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div style={{ padding: "20px 24px" }}>
                {/* Personal Info */}
                {activeSection === "personal" && (
                  <div style={fieldGrid}>
                    <FieldGroup label="Full Name *">
                      <Input value={cv.fullName} onChange={(v) => setCV((p) => ({ ...p, fullName: v }))} placeholder="e.g. Jane Doe" />
                    </FieldGroup>
                    <FieldGroup label="Email">
                      <Input value={cv.email} onChange={(v) => setCV((p) => ({ ...p, email: v }))} placeholder="jane@example.com" />
                    </FieldGroup>
                    <FieldGroup label="Phone">
                      <Input value={cv.phone} onChange={(v) => setCV((p) => ({ ...p, phone: v }))} placeholder="+254 700 000 000" />
                    </FieldGroup>
                    <FieldGroup label="Location">
                      <Input value={cv.location} onChange={(v) => setCV((p) => ({ ...p, location: v }))} placeholder="Nairobi, Kenya" />
                    </FieldGroup>
                    <FieldGroup label="LinkedIn URL">
                      <Input value={cv.linkedin} onChange={(v) => setCV((p) => ({ ...p, linkedin: v }))} placeholder="linkedin.com/in/janedoe" />
                    </FieldGroup>
                    <FieldGroup label="GitHub URL">
                      <Input value={cv.github} onChange={(v) => setCV((p) => ({ ...p, github: v }))} placeholder="github.com/janedoe" />
                    </FieldGroup>
                  </div>
                )}

                {/* Summary */}
                {activeSection === "summary" && (
                  <FieldGroup label="Professional Summary">
                    <textarea
                      rows={7}
                      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
                      placeholder="Results-driven software engineer with 5+ years building scalable backend systems…"
                      value={cv.summary}
                      onChange={(e) => setCV((p) => ({ ...p, summary: e.target.value }))}
                    />
                  </FieldGroup>
                )}

                {/* Skills */}
                {activeSection === "skills" && (
                  <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="Add skill (e.g. Python, Docker, AWS)…"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSkill()}
                      />
                      <button onClick={addSkill} style={{ ...addSmallBtn, background: theme.primary }}>Add</button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {cv.skills.map((s) => (
                        <span key={s} style={{ ...skillTagStyle, background: theme.bgLight, color: theme.primary, borderColor: theme.borderLight }}>
                          {s}
                          <button
                            onClick={() => removeSkill(s)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: theme.primary, padding: 0, marginLeft: 4, lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {activeSection === "experience" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {cv.experience.map((exp, i) => (
                      <div key={exp.id} style={expCardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                            Position {i + 1}
                          </span>
                          <button onClick={() => removeExperience(exp.id)} style={deleteMiniBtn}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div style={fieldGrid}>
                          <FieldGroup label="Company">
                            <Input value={exp.company} onChange={(v) => updateExperience(exp.id, "company", v)} placeholder="Acme Corp" />
                          </FieldGroup>
                          <FieldGroup label="Role">
                            <Input value={exp.role} onChange={(v) => updateExperience(exp.id, "role", v)} placeholder="Senior Engineer" />
                          </FieldGroup>
                          <FieldGroup label="Period" fullWidth>
                            <Input value={exp.period} onChange={(v) => updateExperience(exp.id, "period", v)} placeholder="Jan 2022 – Present" />
                          </FieldGroup>
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <label style={labelStyle}>Key Achievements / Bullets</label>
                          {exp.bullets.map((b, bi) => (
                            <div key={bi} style={{ display: "flex", gap: 6, marginTop: 6 }}>
                              <input
                                style={{ ...inputStyle, flex: 1 }}
                                placeholder={`• Achievement ${bi + 1}`}
                                value={b}
                                onChange={(e) => updateBullet(exp.id, bi, e.target.value)}
                              />
                              <button
                                onClick={() => removeBullet(exp.id, bi)}
                                style={{ ...deleteMiniBtn, borderRadius: 8, padding: "0 10px" }}
                                disabled={exp.bullets.length === 1}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button onClick={() => addBullet(exp.id)} style={{ ...addSmallBtn, background: theme.primary, marginTop: 8, fontSize: 11 }}>
                            + Add bullet
                          </button>
                        </div>
                      </div>
                    ))}
                    <button onClick={addExperience} style={addBlockBtn}>
                      <Plus size={15} /> Add Work Experience
                    </button>
                  </div>
                )}

                {/* Education */}
                {activeSection === "education" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {cv.education.map((edu, i) => (
                      <div key={edu.id} style={expCardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Education {i + 1}</span>
                          <button onClick={() => removeEducation(edu.id)} style={deleteMiniBtn}><Trash2 size={13} /></button>
                        </div>
                        <div style={fieldGrid}>
                          <FieldGroup label="Institution">
                            <Input value={edu.institution} onChange={(v) => updateEducation(edu.id, "institution", v)} placeholder="University of Nairobi" />
                          </FieldGroup>
                          <FieldGroup label="Degree / Qualification">
                            <Input value={edu.degree} onChange={(v) => updateEducation(edu.id, "degree", v)} placeholder="BSc. Computer Science" />
                          </FieldGroup>
                          <FieldGroup label="Period">
                            <Input value={edu.period} onChange={(v) => updateEducation(edu.id, "period", v)} placeholder="2016 – 2020" />
                          </FieldGroup>
                          <FieldGroup label="Grade / GPA">
                            <Input value={edu.grade ?? ""} onChange={(v) => updateEducation(edu.id, "grade", v)} placeholder="First Class Honours" />
                          </FieldGroup>
                        </div>
                      </div>
                    ))}
                    <button onClick={addEducation} style={addBlockBtn}>
                      <Plus size={15} /> Add Education
                    </button>
                  </div>
                )}

                {/* Projects */}
                {activeSection === "projects" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {cv.projects.map((pr, i) => (
                      <div key={pr.id} style={expCardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Project {i + 1}</span>
                          <button onClick={() => removeProject(pr.id)} style={deleteMiniBtn}><Trash2 size={13} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <FieldGroup label="Project Name">
                            <Input value={pr.name} onChange={(v) => updateProject(pr.id, "name", v)} placeholder="Job Tracker API" />
                          </FieldGroup>
                          <FieldGroup label="Tech Stack">
                            <Input value={pr.tech} onChange={(v) => updateProject(pr.id, "tech", v)} placeholder="FastAPI, PostgreSQL, Docker" />
                          </FieldGroup>
                          <FieldGroup label="Description">
                            <textarea
                              rows={3}
                              style={{ ...inputStyle, resize: "vertical" }}
                              placeholder="Brief description of what the project does and your contributions…"
                              value={pr.description}
                              onChange={(e) => updateProject(pr.id, "description", e.target.value)}
                            />
                          </FieldGroup>
                        </div>
                      </div>
                    ))}
                    <button onClick={addProject} style={addBlockBtn}>
                      <Plus size={15} /> Add Project
                    </button>
                  </div>
                )}

                {/* Optimizer Section */}
                {activeSection === "optimizer" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Info banner */}
                    <div style={{ padding: 14, background: theme.bgLight, border: `1px solid ${theme.borderLight}`, borderRadius: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme.primary, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <Sparkles size={16} /> Real-Time Job Description Match &amp; Optimizer
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                        Select a role preset or enter custom skills to analyze keyword coverage and apply 1-click bullet rewrites.
                      </p>
                    </div>

                    {/* Saved Jobs Selector if available */}
                    {userJobs.length > 0 && (
                      <div style={{ padding: 12, background: "var(--input-bg)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                          Load Target Job from Saved Jobs Feed:
                        </label>
                        <select
                          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: 12, fontWeight: 700, outline: "none", cursor: "pointer" }}
                          onChange={(e) => {
                            const selectedJob = userJobs.find((j: any) => String(j.id) === e.target.value);
                            if (selectedJob) {
                              setOptTitle(`${selectedJob.title} @ ${selectedJob.company_name}`);
                              setOptSkills(selectedJob.required_skills.join(", "));
                              setOptJD(selectedJob.description || "");
                              setOptResult(null);
                            }
                          }}
                        >
                          <option value="">-- Select Saved Opportunity --</option>
                          {userJobs.map((j: any) => (
                            <option key={j.id} value={j.id}>
                              {j.title} — {j.company_name} ({j.match_score}% match)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Quick preset buttons */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                        Quick Role Presets:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {Object.keys(OPT_PRESETS).map((presetKey) => (
                          <button
                            key={presetKey}
                            onClick={() => {
                              const p = OPT_PRESETS[presetKey];
                              setOptTitle(p.title);
                              setOptSkills(p.skills);
                              setOptJD(p.jd);
                              setOptResult(null);
                            }}
                            style={{
                              fontSize: 11, fontWeight: 700, padding: "5px 10px",
                              borderRadius: 8, border: `1px solid ${theme.borderLight}`,
                              background: optTitle === OPT_PRESETS[presetKey].title ? theme.primary : theme.bgLight,
                              color: optTitle === OPT_PRESETS[presetKey].title ? "#fff" : theme.primary,
                              cursor: "pointer",
                            }}
                          >
                            {presetKey}
                          </button>
                        ))}
                      </div>
                    </div>

                    <FieldGroup label="Target Job Title & Company">
                      <Input value={optTitle} onChange={setOptTitle} placeholder="e.g. Senior IT Support Technician @ Safaricom" />
                    </FieldGroup>

                    <FieldGroup label="Target Required Skills (comma-separated)">
                      <Input value={optSkills} onChange={setOptSkills} placeholder="Active Directory, Cisco, ITIL, VPN, Windows Server..." />
                    </FieldGroup>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button onClick={handleRunOptimizer} style={{ ...actionBtn, background: theme.primary, flex: 1 }}>
                        <Sparkles size={14} /> Calculate Match &amp; Analyze Missing Keywords
                      </button>

                      <button
                        disabled={isAutoGeneratingCV}
                        onClick={() => {
                          setIsAutoGeneratingCV(true);
                          setAutoGenMsg(null);
                          const skillsArr = optSkills.split(",").map((s) => s.trim()).filter(Boolean);
                          generateCVForJob.mutate(
                            {
                              job_title: optTitle || "Software Engineer",
                              company_name: "Target Enterprise",
                              required_skills: skillsArr.length > 0 ? skillsArr : ["Python", "React", "PostgreSQL"],
                              description: optJD || "",
                            },
                            {
                              onSuccess: (newCv) => {
                                setIsAutoGeneratingCV(false);
                                setSavedCvId(newCv.id);
                                setCV((prev) => ({
                                  ...prev,
                                  summary: newCv.parsed_sections?.summary || prev.summary,
                                  skills: newCv.skills || prev.skills,
                                }));
                                setAutoGenMsg(`✓ Tailored CV "${newCv.name}" generated & saved to library! (${newCv.ats_score}% ATS Score)`);
                              },
                              onError: (err: any) => {
                                setIsAutoGeneratingCV(false);
                                setAutoGenMsg(`⚠ ${err?.response?.data?.detail || err?.message || "Generation failed."}`);
                              },
                            }
                          );
                        }}
                        style={{ ...actionBtn, background: "#059669", opacity: isAutoGeneratingCV ? 0.7 : 1 }}
                      >
                        {isAutoGeneratingCV ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        <span>{isAutoGeneratingCV ? "Generating…" : "Auto-Generate 98% ATS CV"}</span>
                      </button>
                    </div>

                    {autoGenMsg && (
                      <div style={{ padding: 12, borderRadius: 10, fontSize: 12, fontWeight: 700, background: autoGenMsg.startsWith("⚠") ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)", color: autoGenMsg.startsWith("⚠") ? "#b45309" : "#047857", border: autoGenMsg.startsWith("⚠") ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(16,185,129,0.3)" }}>
                        {autoGenMsg}
                      </div>
                    )}

                    {optResult && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 14, background: "var(--input-bg)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: theme.primary }}>{optResult.matchRate}%</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Keyword Coverage Match</div>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                              {optResult.matchedCount} of {optResult.targetCount} target skills currently present in your CV.
                            </div>
                          </div>
                        </div>

                        {optResult.missing.length > 0 && (
                          <div style={{ padding: 14, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                              <AlertTriangle size={14} /> Missing High-Value Keywords:
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                              {optResult.missing.map((s: string) => (
                                <span key={s} style={{ padding: "3px 8px", background: "rgba(245,158,11,0.2)", color: "#b45309", fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
                                  + {s}
                                </span>
                              ))}
                            </div>
                            <button onClick={applyMissingSkills} style={{ ...addSmallBtn, background: "#d97706", fontSize: 11 }}>
                              <CheckCircle2 size={13} /> 1-Click Integrate Missing Skills into CV
                            </button>
                          </div>
                        )}

                        <div style={{ padding: 14, background: "var(--input-bg)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                            Optimized AI Summary:
                          </div>
                          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>{optResult.suggestedSummary}</p>
                          <button onClick={applyOptimizerSummary} style={{ ...addSmallBtn, background: theme.primary, fontSize: 11 }}>
                            Use Optimized Summary
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Preview Panel ── */}
          {showPreview && (
            <div style={{ ...panelStyle, padding: 0, overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Eye size={14} style={{ color: "var(--text-secondary)" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Live Preview ({template.toUpperCase()} · {theme.name})
                  </span>
                </div>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: theme.primary }} />
              </div>
              <div ref={previewRef} style={{ background: "#fff", minHeight: 800 }}>
                <CVPreview cv={cv} template={template} theme={theme} targetRole={optTitle} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Multi-Template Live Preview Component ─── */
function CVPreview({ cv, template, theme, targetRole }: { cv: CVData; template: TemplateId; theme: ThemeColor; targetRole?: string }) {
  const hasContent = cv.fullName || cv.summary || cv.skills.length > 0 || cv.experience.length > 0;

  const cleanCandidateName = (name: string) => {
    if (!name || name.includes("@") || name.toLowerCase().includes("head of") || name.toLowerCase().startsWith("tailored")) {
      return "Dennis K";
    }
    return (name || "")
      .replace(/\s*[\-—–|]\s*(EXECUTIVE|TECH_MINIMAL|CLASSIC_SERIF|CREATIVE_SPLIT|MODERN|MINIMAL)\b.*$/i, "")
      .replace(/^(Target Role Focus|Focus Area|Role Focus):\s*/i, "")
      .trim() || "Dennis K";
  };

  const cleanRoleTitle = (raw?: string) => {
    const src = raw || cv.experience[0]?.role || "";
    if (!src) return "";
    return src
      .replace(/@\s*[^|]+/gi, "")
      .replace(/\([^)]*(IDEALWORKS|m\/f\/d|m\/w\/d|m\/f\/x|remote|hybrid|full-time|part-time|internship)[^)]*\)/gi, "")
      .replace(/\b(M\/F\/D|M\/W\/D|M\/F\/X)\b/gi, "")
      .replace(/\(\s*\)/g, "")
      .replace(/^(Target Role Focus|Focus Area|Role Focus):\s*/gi, "")
      .trim()
      .replace(/\s+/g, " ");
  };

  const cleanSummaryText = (summary: string) => {
    return (summary || "")
      .replace(/^(Target Role Focus|Focus Area|Role Focus):\s*/i, "")
      .replace(/\s*[\-—–|]\s*(EXECUTIVE|TECH_MINIMAL|CLASSIC_SERIF|CREATIVE_SPLIT|MODERN|MINIMAL)\b.*$/i, "")
      .trim();
  };

  if (!hasContent) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
        <FileText size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
        <p style={{ fontSize: 14 }}>Fill in the form to render your resume preview.</p>
      </div>
    );
  }

  const displayName = cleanCandidateName(cv.fullName);
  const displayRoleTitle = cleanRoleTitle(targetRole);
  const displaySummary = cleanSummaryText(cv.summary);

  /* ── 1. Modern Executive ── */
  if (template === "executive") {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", padding: "48px 52px", color: "#1e293b", background: "#fff", fontSize: 13, lineHeight: 1.6 }}>
        {/* Header with primary color bar */}
        <div style={{ borderLeft: `6px solid ${theme.primary}`, paddingLeft: 20, marginBottom: 26 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 30, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
            {displayName}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", fontSize: 12, color: "#475569", fontWeight: 600 }}>
            {cv.email && <span>{cv.email}</span>}
            {cv.phone && <span>• {cv.phone}</span>}
            {cv.location && <span>• {cv.location}</span>}
            {cv.linkedin && <span>• {cv.linkedin}</span>}
          </div>
        </div>

        {displaySummary && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: theme.primary, borderBottom: `2px solid ${theme.borderLight}`, paddingBottom: 4, marginBottom: 8 }}>
              Executive Summary
            </h3>
            <p style={{ margin: 0, color: "#334155" }}>{displaySummary}</p>
          </div>
        )}

        {cv.skills.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: theme.primary, borderBottom: `2px solid ${theme.borderLight}`, paddingBottom: 4, marginBottom: 10 }}>
              Technical Core Competencies
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cv.skills.map((s) => (
                <span key={s} style={{ background: theme.bgLight, color: theme.primary, border: `1px solid ${theme.borderLight}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {cv.experience.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: theme.primary, borderBottom: `2px solid ${theme.borderLight}`, paddingBottom: 4, marginBottom: 12 }}>
              Professional Work History
            </h3>
            {cv.experience.map((exp) => (
              <div key={exp.id} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <strong style={{ fontSize: 14, color: "#0f172a", fontWeight: 800 }}>{exp.role}</strong>
                    {/* Company omitted */}
                  </div>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{exp.period}</span>
                </div>
                <ul style={{ margin: "6px 0 0 18px", padding: 0, color: "#334155" }}>
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} style={{ marginBottom: 3 }}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {cv.education.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: theme.primary, borderBottom: `2px solid ${theme.borderLight}`, paddingBottom: 4, marginBottom: 10 }}>
              Education &amp; Credentials
            </h3>
            {cv.education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong style={{ fontSize: 13, color: "#0f172a" }}>{edu.degree}</strong>
                  {edu.institution && <span style={{ color: "#475569" }}> — {edu.institution}</span>}
                </div>
                <span style={{ fontSize: 11, color: "#64748b" }}>{edu.period}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── 2. Tech Minimalist ── */
  if (template === "tech_minimal") {
    return (
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", padding: "44px 48px", color: "#0f172a", background: "#fff", fontSize: 12.5, lineHeight: 1.5 }}>
        <div style={{ borderBottom: `1px solid ${theme.primary}`, paddingBottom: 16, marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: theme.primary }}>
            {displayName}
          </h1>
          <div style={{ fontSize: 11, color: "#475569" }}>
            {cv.email} | {cv.phone} | {cv.location} | {cv.github}
          </div>
        </div>

        {displaySummary && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 800, color: theme.primary, marginBottom: 4 }}>// PROFILE_SUMMARY</div>
            <p style={{ margin: 0, color: "#334155" }}>{displaySummary}</p>
          </div>
        )}

        {cv.skills.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 800, color: theme.primary, marginBottom: 6 }}>// TECH_STACK</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {cv.skills.map((s) => (
                <span key={s} style={{ background: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", padding: "2px 6px", fontSize: 10, fontWeight: 700 }}>
                  [{s}]
                </span>
              ))}
            </div>
          </div>
        )}

        {cv.experience.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 800, color: theme.primary, marginBottom: 8 }}>// EXPERIENCE</div>
            {cv.experience.map((exp) => (
              <div key={exp.id} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>
                  {exp.role} <span style={{ color: "#64748b", fontWeight: 400 }}>({exp.period})</span>
                </div>
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <div key={i} style={{ color: "#334155", paddingLeft: 12, marginTop: 2 }}>&gt; {b}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── 3. Classic Serif ── */
  if (template === "classic_serif") {
    return (
      <div style={{ fontFamily: "'Georgia', serif", padding: "48px 52px", color: "#1e293b", background: "#fff", fontSize: 13, lineHeight: 1.6 }}>
        <div style={{ textAlign: "center", borderBottom: `2px double ${theme.primary}`, paddingBottom: 18, marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 700, color: "#0f172a" }}>
            {displayName}
          </h1>
          <div style={{ fontSize: 12, color: "#475569", fontStyle: "italic" }}>
            {[cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).join(" • ")}
          </div>
        </div>

        {displaySummary && (
          <div style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: theme.primary, borderBottom: "1px solid #cbd5e1", paddingBottom: 4, marginBottom: 8 }}>
              Professional Summary
            </h3>
            <p style={{ margin: 0 }}>{displaySummary}</p>
          </div>
        )}

        {cv.experience.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: theme.primary, borderBottom: "1px solid #cbd5e1", paddingBottom: 4, marginBottom: 12 }}>
              Experience
            </h3>
            {cv.experience.map((exp) => (
              <div key={exp.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{exp.role}</strong>
                  <span style={{ fontStyle: "italic", fontSize: 12 }}>{exp.period}</span>
                </div>
                <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── 4. Creative Split Sidebar ── */
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "grid", gridTemplateColumns: "220px 1fr", minHeight: 800, background: "#fff" }}>
      {/* Dark Sidebar */}
      <div style={{ background: theme.secondary, color: "#fff", padding: "36px 24px" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
          {displayName}
        </h2>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
          {cv.email && <div>{cv.email}</div>}
          {cv.phone && <div>{cv.phone}</div>}
          {cv.location && <div>{cv.location}</div>}
        </div>

        {cv.skills.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>
              SKILLS
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {cv.skills.map((s) => (
                <span key={s} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ padding: "36px 40px", color: "#1e293b", fontSize: 13, lineHeight: 1.6 }}>
        {displaySummary && (
          <div style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: theme.primary, borderBottom: `2px solid ${theme.borderLight}`, paddingBottom: 4, marginBottom: 8 }}>
              About
            </h3>
            <p style={{ margin: 0, color: "#334155" }}>{displaySummary}</p>
          </div>
        )}

        {cv.experience.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: theme.primary, borderBottom: `2px solid ${theme.borderLight}`, paddingBottom: 4, marginBottom: 12 }}>
              Work History
            </h3>
            {cv.experience.map((exp) => (
              <div key={exp.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: 14, color: "#0f172a" }}>{exp.role}</strong>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{exp.period}</span>
                </div>
                <ul style={{ margin: "4px 0 0 16px", padding: 0, color: "#334155" }}>
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helper Components ── */
function FieldGroup({ label, children, fullWidth }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      style={inputStyle}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

/* ── Styles ── */
const bannerStyle: React.CSSProperties = {
  background: "linear-gradient(135deg,rgba(37,99,235,0.12) 0%,rgba(29,78,216,0.04) 100%)",
  border: "1px solid rgba(59,130,246,0.2)", borderRadius: 18,
  padding: "22px 26px", display: "flex", justifyContent: "space-between",
  alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16,
};
const badgeStyle: React.CSSProperties = {
  display: "inline-block", fontSize: 11, fontWeight: 700, color: "#2563eb",
  background: "rgba(37,99,235,0.12)", padding: "3px 10px", borderRadius: 99,
  textTransform: "uppercase", letterSpacing: "0.06em",
};
const toolbarStyle: React.CSSProperties = {
  background: "var(--bg-card)", border: "1px solid var(--border-color)",
  borderRadius: 14, padding: "12px 18px", display: "flex",
  alignItems: "center", justifyContent: "space-between", gap: 16,
  flexWrap: "wrap", marginBottom: 20,
};
const templateBtn: React.CSSProperties = {
  padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
  border: "1px solid", cursor: "pointer", transition: "all 0.15s",
};
const viewToggleWrap: React.CSSProperties = {
  display: "flex", background: "var(--bg-card)", borderRadius: 10,
  border: "1px solid var(--border-color)", overflow: "hidden",
};
const viewToggleBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5, padding: "7px 14px",
  fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
  background: "transparent", color: "var(--text-secondary)", transition: "all 0.15s",
};
const viewToggleActive: React.CSSProperties = {
  background: "#2563eb", color: "#fff",
};
const actionBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, color: "#fff",
  border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 12,
  fontWeight: 700, cursor: "pointer",
};
const panelStyle: React.CSSProperties = {
  background: "var(--bg-card)", border: "1px solid var(--border-color)",
  borderRadius: 18, overflow: "hidden",
};
const sectionTabsWrap: React.CSSProperties = {
  display: "flex", gap: 2, padding: "12px 16px",
  borderBottom: "1px solid var(--border-color)", flexWrap: "wrap",
};
const sectionTab: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
  fontSize: 12, fontWeight: 600, borderRadius: 8, border: "none",
  cursor: "pointer", transition: "all 0.15s",
};
const fieldGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)",
  color: "var(--text-primary)", borderRadius: 10, padding: "9px 13px",
  fontSize: 13, outline: "none", boxSizing: "border-box",
};
const addSmallBtn: React.CSSProperties = {
  padding: "9px 16px", background: "#2563eb", color: "#fff", border: "none",
  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
};
const skillTagStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px",
  background: "rgba(37,99,235,0.12)", color: "#2563eb", fontWeight: 600,
  fontSize: 12, borderRadius: 99, border: "1px solid rgba(37,99,235,0.25)",
};
const expCardStyle: React.CSSProperties = {
  background: "var(--input-bg)", borderRadius: 12,
  border: "1px solid var(--border-color)", padding: "16px 18px",
};
const deleteMiniBtn: React.CSSProperties = {
  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
  color: "#ef4444", borderRadius: 8, padding: "4px 10px", cursor: "pointer",
  display: "inline-flex", alignItems: "center",
};
const addBlockBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, width: "100%",
  padding: "12px 16px", background: "var(--input-bg)",
  border: "2px dashed var(--border-color)", borderRadius: 12,
  color: "var(--text-secondary)", fontSize: 13, fontWeight: 600,
  cursor: "pointer", justifyContent: "center", transition: "all 0.15s",
};
