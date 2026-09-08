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

  if (item.apply_method === "email" || finalEmail || hasEmailPhrase) {
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

  if (portalUrl && portalUrl.startsWith("http")) {
    return {
      channel: "website",
      targetEmail: "",
      portalUrl,
      reason: "Official Web Application Portal detected for online submission.",
      isEmailVerified: false,
    };
  }

  return {
    channel: "website",
    targetEmail: finalEmail,
    portalUrl,
    reason: "Standard application entry.",
    isEmailVerified: false,
  };
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
