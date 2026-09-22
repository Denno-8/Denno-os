/**
 * Job Application Scrutiny & Application Channel AI Detection Engine
 */

export interface JobChannelAnalysis {
  channel: "email" | "website";
  targetEmail: string;
  portalUrl: string;
  reason: string;
  isEmailVerified: boolean;
}

export interface JobScrutinyDetails {
  responsibilities: string[];
  requirements: string[];
  matchedSkills: string[];
}

/**
 * Intelligent detector that determines whether a job opportunity
 * requires Direct Recruiter Email submission vs Official Website Portal submission.
 */
export function analyzeJobApplicationChannel(item: {
  contact_email?: string | null;
  recruiter_email?: string | null;
  source_url?: string | null;
  description?: string | null;
  notes?: string | null;
  requirements?: string[] | null;
  apply_method?: string | null;
}): JobChannelAnalysis {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

  const rawEmail = (item.recruiter_email || item.contact_email || "").trim();
  const descText = ((item.description || "") + " " + (item.notes || "") + " " + ((item.requirements || []).join(" "))).trim();
  const portalUrl = (item.source_url || "").trim();

  // Search for emails inside description or notes text
  const extractedEmails = descText.match(emailRegex) || [];
  const foundDescEmail = extractedEmails.find(
    (e) => !e.toLowerCase().includes("example.com") && !e.toLowerCase().includes("domain.com")
  ) || "";

  const finalEmail = (rawEmail && rawEmail.includes("@")) ? rawEmail : foundDescEmail;

  // ── PRIORITY 1: Explicit apply_method always wins ──────────────────────────
  // When a user explicitly chose "website" or "portal", we NEVER override this
  // to "email" even if a recruiter_email exists on the record (e.g., stored for
  // follow-up purposes but the actual application was submitted via portal).
  if (item.apply_method === "website" || item.apply_method === "portal") {
    const platformHint = _extractPortalPlatformFromUrl(portalUrl);
    return {
      channel: "website",
      targetEmail: finalEmail,
      portalUrl,
      reason: platformHint
        ? `Application submitted via ${platformHint} portal. ATS screening will process your CV automatically.`
        : portalUrl
        ? `Application submitted via official web portal. ATS screening will process your CV automatically.`
        : "Official Web Application Portal — application entered and tracked manually.",
      isEmailVerified: false,
    };
  }

  // ── PRIORITY 2: Explicit email apply_method ────────────────────────────────
  if (item.apply_method === "email") {
    return {
      channel: "email",
      targetEmail: finalEmail || "careers@company.com",
      portalUrl,
      reason: finalEmail
        ? `Direct Email Application dispatched to recruiter (${finalEmail}). Bypasses ATS portal — recruiter reads directly.`
        : "Direct Email Application — application dispatched to recruiter inbox.",
      isEmailVerified: !!finalEmail && !finalEmail.includes("example.com"),
    };
  }

  // ── PRIORITY 3: Infer from signals when apply_method is not set ────────────

  // Key phrases indicating explicit email application instructions
  const emailPhrases = [
    "apply via email",
    "send your cv",
    "send your resume",
    "email your application",
    "contact email",
    "send application to",
    "mail your cv",
    "apply to:",
    "email us at",
    "submit application to",
  ];

  const hasEmailPhrase = emailPhrases.some((phrase) => descText.toLowerCase().includes(phrase));

  if (finalEmail || hasEmailPhrase) {
    return {
      channel: "email",
      targetEmail: finalEmail || "careers@company.com",
      portalUrl,
      reason: finalEmail
        ? `Direct Email Application required by employer (Recipient: ${finalEmail})`
        : "Email application instructions detected in job description.",
      isEmailVerified: !!finalEmail && !finalEmail.includes("example.com"),
    };
  }

  // ── PRIORITY 4: Default to website / portal ────────────────────────────────
  return {
    channel: "website",
    targetEmail: finalEmail,
    portalUrl,
    reason: "Standard portal application — submitted via employer career page or job board.",
    isEmailVerified: false,
  };
}

/**
 * Detects the job portal platform name from a source URL for display purposes.
 */
export function _extractPortalPlatformFromUrl(url: string): string {
  if (!url) return "";
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return "LinkedIn";
  if (lower.includes("myjobmag")) return "MyJobMag";
  if (lower.includes("brightermonday")) return "BrighterMonday";
  if (lower.includes("fuzu.com")) return "Fuzu";
  if (lower.includes("glassdoor.com")) return "Glassdoor";
  if (lower.includes("indeed.com")) return "Indeed";
  if (lower.includes("jobwebkenya")) return "JobWebKenya";
  if (lower.includes("pigiame.co.ke")) return "PigiMe";
  if (lower.includes("greenhouse.io")) return "Greenhouse ATS";
  if (lower.includes("workday.com") || lower.includes("myworkday")) return "Workday ATS";
  if (lower.includes("lever.co")) return "Lever ATS";
  if (lower.includes("icims.com")) return "iCIMS ATS";
  if (lower.includes("bamboohr.com")) return "BambooHR";
  if (lower.includes("smartrecruiters.com")) return "SmartRecruiters";
  if (lower.includes("jobvite.com")) return "Jobvite";
  return "";
}

/**
 * Maps a known portal platform name to its common ATS system.
 */
export function getPortalAtsSystem(platform: string): string {
  const map: Record<string, string> = {
    "LinkedIn": "LinkedIn ATS / Native",
    "Greenhouse ATS": "Greenhouse",
    "Workday ATS": "Workday",
    "Lever ATS": "Lever",
    "iCIMS ATS": "iCIMS",
    "BambooHR": "BambooHR",
    "SmartRecruiters": "SmartRecruiters",
    "Jobvite": "Jobvite",
    "MyJobMag": "Custom / Email Forward",
    "BrighterMonday": "Custom Portal",
    "Fuzu": "Fuzu Native",
    "Glassdoor": "Employer ATS (varies)",
    "Indeed": "Indeed Apply / Employer ATS",
    "JobWebKenya": "Custom Portal",
    "PigiMe": "Custom Portal",
  };
  return map[platform] || "Unknown / Custom ATS";
}

/**
 * Scrutinizes job description and requirements text to extract
 * structured Responsibilities and Qualifications.
 */
export function extractResponsibilitiesAndRequirements(
  description: string = "",
  existingReqs: string[] = [],
  requiredSkills: string[] = []
): JobScrutinyDetails {
  const respList: string[] = [];
  const reqList: string[] = [...existingReqs];

  if (description) {
    const lines = description.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let mode: "resp" | "req" | "none" = "none";

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        lower.includes("responsibilit") ||
        lower.includes("what you will do") ||
        lower.includes("your role") ||
        lower.includes("tasks") ||
        lower.includes("what to expect")
      ) {
        mode = "resp";
        continue;
      } else if (
        lower.includes("requirement") ||
        lower.includes("qualifications") ||
        lower.includes("what you bring") ||
        lower.includes("skills needed") ||
        lower.includes("what we look for")
      ) {
        mode = "req";
        continue;
      }

      if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || /^\d+[\.\)]/.test(line)) {
        const clean = line.replace(/^[•\-\*\d\.\)]\s*/, "").trim();
        if (clean.length > 5) {
          if (mode === "resp") {
            respList.push(clean);
          } else if (mode === "req" && !reqList.includes(clean)) {
            reqList.push(clean);
          }
        }
      }
    }
  }

  // Smart defaults if description lacked explicit section headers
  if (respList.length === 0) {
    respList.push("Execute core engineering responsibilities & system delivery aligned with company objectives.");
    respList.push("Collaborate with technical leads on API architecture, testing, and system maintenance.");
  }

  if (reqList.length === 0) {
    if (requiredSkills.length > 0) {
      reqList.push(`Demonstrated proficiency with ${requiredSkills.slice(0, 3).join(", ")}.`);
    }
    reqList.push("Strong problem-solving skills, software design fundamentals, and technical communication.");
  }

  return {
    responsibilities: respList,
    requirements: reqList,
    matchedSkills: requiredSkills,
  };
}
