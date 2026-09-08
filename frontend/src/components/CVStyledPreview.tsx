import React from "react";
import { User, Mail, Phone, MapPin, Globe, ExternalLink, Briefcase, GraduationCap, Code, Sparkles, FolderOpen, Award } from "lucide-react";

interface CVStyledPreviewProps {
  content?: string | null;
  name?: string | null;
  focus?: string | null;
  skills?: string[];
  atsScore?: number;
  themeColor?: string; // e.g. 'blue', 'emerald', 'indigo', 'violet'
}

export default function CVStyledPreview({
  content = "",
  name,
  focus,
  skills = [],
  atsScore = 95,
  themeColor = "blue",
}: CVStyledPreviewProps) {
  // Helper to parse header and sections from text
  const parseCVText = (raw: string) => {
    // Strip ==================== and -------------------- lines
    const cleanRaw = raw.replace(/^[=\-]{10,}\s*$/gm, "").trim();
    const lines = cleanRaw.split("\n").map((l) => l.trim()).filter(Boolean);

    let parsedName = "";
    let candidateTitle = "";
    let contactInfo: string[] = [];
    let linkedinUrl = "";
    let githubUrl = "";

    // Check if string is an internal version label
    const isVersionLabel = (str: string) => {
      if (!str) return false;
      const l = str.toLowerCase();
      return (
        l.includes("@") ||
        l.startsWith("tailored") ||
        l.includes("head of") ||
        l.includes("version") ||
        l.includes("draft")
      );
    };

    // Check if string is a system account placeholder (e.g. "Admin User" or "Platform Administrator")
    const isSystemAccount = (str: string) => {
      if (!str) return true;
      const l = str.toLowerCase().trim();
      return (
        l === "admin user" ||
        l === "admin" ||
        l === "administrator" ||
        l === "platform administrator" ||
        l === "user" ||
        l.includes("admin@")
      );
    };

    // If passed `name` is a valid candidate name (not version label & not system account), use it
    if (name && !isVersionLabel(name) && !isSystemAccount(name)) {
      parsedName = name;
    }

    // Try parsing candidate name from raw text header
    if (!parsedName && lines.length > 0) {
      const line0 = lines[0];
      if (
        !line0.startsWith("1.") &&
        !line0.startsWith("EXECUTIVE") &&
        !line0.startsWith("PERSONAL") &&
        !isSystemAccount(line0)
      ) {
        parsedName = line0.replace(/^Name:\s*/i, "").trim();
      }
    }

    if (!parsedName || isSystemAccount(parsedName)) {
      parsedName = "Dennis Kariuki";
    }

    // Extract title / role if available
    if (lines.length > 1) {
      const line1 = lines[1];
      if (line1.includes("|") && (line1.includes("@") || line1.includes("+"))) {
        const parts = line1.split("|").map((p) => p.trim());
        if (parts.length > 1 && !parts[0].includes("@") && !parts[0].includes("+") && !isSystemAccount(parts[0])) {
          candidateTitle = parts[0];
        }
      }
    }

    if (candidateTitle && isSystemAccount(candidateTitle)) {
      candidateTitle = "";
    }

    // candidateTitle is intentionally left empty — role/job title is not shown below name in CV preview

    // Filter contact details to remove system admin roles
    const SYSTEM_ROLE_TERMS = [
      "platform administrator", "admin user", "system admin",
      "platform admin", "administrator", "admin", "user role"
    ];

    const contactLine = lines.find((l) => (l.includes("@") || l.includes("+")) && l.includes("|"));
    if (contactLine) {
      const rawParts = contactLine.split("|").map((s) => s.trim()).filter(Boolean);
      contactInfo = rawParts.filter((part) => {
        const lower = part.toLowerCase();
        if (SYSTEM_ROLE_TERMS.some((term) => lower === term || lower.includes("platform administrator"))) {
          return false;
        }
        return true;
      });
    }

    const linkedinLine = lines.find((l) => l.toLowerCase().includes("linkedin:"));
    if (linkedinLine) {
      linkedinUrl = linkedinLine.split(/linkedin:\s*/i)[1]?.split("|")[0]?.trim() || "";
    }

    const githubLine = lines.find((l) => l.toLowerCase().includes("github:"));
    if (githubLine) {
      githubUrl = githubLine.split(/github:\s*/i)[1]?.trim() || "";
    }

    // Split sections by numbers like "1. EXECUTIVE SUMMARY", "2. CORE TECHNICAL SKILLS", etc.
    const rawSections: { title: string; body: string }[] = [];
    const blockSplit = cleanRaw.split(/\n(?=\d+\.\s*|\b[A-Z\s&]{5,30}\b\n)/);

    let summaryText = "";

    blockSplit.forEach((block) => {
      const bLines = block.trim().split("\n");
      if (bLines.length > 0) {
        let firstLine = bLines[0].replace(/^\d+\.\s*/, "").trim();
        const body = bLines.slice(1).join("\n").trim();

        if (
          firstLine.includes("EXECUTIVE SUMMARY") ||
          firstLine.includes("SUMMARY") ||
          firstLine.includes("ABOUT") ||
          firstLine.includes("PROFILE")
        ) {
          summaryText = body;
        } else if (
          firstLine.includes("CORE TECHNICAL SKILLS") ||
          firstLine.includes("PROFESSIONAL WORK EXPERIENCE") ||
          firstLine.includes("KEY PROJECTS") ||
          firstLine.includes("EDUCATION") ||
          firstLine.includes("COMPETENCIES")
        ) {
          rawSections.push({
            title: firstLine,
            body: body,
          });
        }
      }
    });

    if (!summaryText && cleanRaw) {
      // Extract first paragraph if no explicit section title
      const p = cleanRaw.split("\n\n").find(b => b.length > 40 && !b.includes("|") && !b.includes("@"));
      if (p) summaryText = p.trim();
    }

    return {
      parsedName,
      candidateTitle,
      contactInfo,
      linkedinUrl,
      githubUrl,
      summaryText,
      rawSections: rawSections.length > 0 ? rawSections : [{ title: "DOCUMENT CONTENT", body: cleanRaw }],
    };
  };

  const data = parseCVText(content || "");

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden text-slate-800 dark:text-slate-200 text-xs font-sans">
      {/* ── Document Top Accent Bar ── */}
      <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

      <div className="p-6 md:p-8 space-y-6">
        {/* ── Candidate Header Section (Centered) ── */}
        <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-5">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight m-0 uppercase">
            {data.parsedName}
          </h1>
          {/* Role title omitted below name per user preference */}

          {/* Contact Details Badges (Centered) */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-3.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
            {data.contactInfo.map((info, i) => {
              const isEmail = info.includes("@");
              const isPhone = info.includes("+") || info.match(/\d{5}/);
              return (
                <span key={i} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  {isEmail ? (
                    <Mail size={12} className="text-blue-500" />
                  ) : isPhone ? (
                    <Phone size={12} className="text-emerald-500" />
                  ) : (
                    <MapPin size={12} className="text-slate-500" />
                  )}
                  <span>{info}</span>
                </span>
              );
            })}

            {data.linkedinUrl && (
              <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                <Globe size={12} />
                <span>{data.linkedinUrl}</span>
              </span>
            )}

            {data.githubUrl && (
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <ExternalLink size={12} />
                <span>{data.githubUrl}</span>
              </span>
            )}
          </div>
        </div>

        {/* ── About / Professional Summary Section ── */}
        <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 m-0">
            <User size={14} />
            About / Professional Summary
          </h3>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 m-0">
            {data.summaryText || "Results-driven Software & Cybersecurity Specialist with proven expertise in building resilient systems, threat analysis, and managing enterprise technical infrastructure."}
          </p>
        </div>

        {/* ── Parsed CV Content Sections ── */}
        <div className="space-y-5">
          {data.rawSections.map((sec, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center gap-2 m-0">
                {getSectionIcon(sec.title)}
                <span>{sec.title}</span>
              </h3>

              <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-1.5 pl-1">
                {sec.body.split("\n").map((line, lIdx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;

                  // Bullet line
                  if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
                    return (
                      <div key={lIdx} className="flex items-start gap-2 pl-2">
                        <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                        <span>{trimmed.replace(/^[•\-\*]\s*/, "")}</span>
                      </div>
                    );
                  }

                  // Job role header line e.g. "Senior / Lead Remote Office Assistant | Technology Solutions | 2022 – PRESENT"
                  if (trimmed.includes("|") && (trimmed.includes("20") || trimmed.includes("PRESENT") || trimmed.includes("2022"))) {
                    const parts = trimmed.split("|").map((p) => p.trim());
                    return (
                      <div key={lIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 pb-1 font-bold text-slate-900 dark:text-white">
                        <span>{parts[0]} {parts[1] ? `— ${parts[1]}` : ""}</span>
                        {parts[2] && <span className="text-[11px] text-slate-500 font-normal">{parts[2]}</span>}
                      </div>
                    );
                  }

                  return <p key={lIdx} className="m-0">{trimmed}</p>;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getSectionIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("summary")) return <User size={13} className="text-blue-500" />;
  if (t.includes("skill") || t.includes("competenc")) return <Code size={13} className="text-emerald-500" />;
  if (t.includes("experience") || t.includes("work")) return <Briefcase size={13} className="text-indigo-500" />;
  if (t.includes("project")) return <FolderOpen size={13} className="text-violet-500" />;
  if (t.includes("education") || t.includes("credential")) return <GraduationCap size={13} className="text-amber-500" />;
  return <Award size={13} className="text-blue-500" />;
}

function extractSkillsFromText(text: string): string[] {
  const match = text.match(/(?:SKILLS|COMPETENCIES)[^\n]*\n([^\n]+)/i);
  if (match && match[1]) {
    return match[1]
      .replace(/^[•\-\*:]\s*/, "")
      .split(/[,•|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}
