/**
 * Job Application Scrutiny & Application Channel AI Detection Engine
 * Extended with comprehensive portal platform detection, ATS procedures,
 * submission checklists, and portal-specific awareness.
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

// ─── Portal Platform Metadata ─────────────────────────────────────────────────

export interface PortalPlatformInfo {
  name: string;
  atsSystem: string;
  region: "global" | "kenya" | "africa" | "us" | "uk";
  submissionType: "ats_form" | "email_forward" | "linkedin_easyapply" | "custom_form" | "direct_upload";
  /** Key procedures specific to this portal */
  procedures: string[];
  /** Documents typically required */
  requiredDocuments: string[];
  /** Tips for optimizing application on this portal */
  tips: string[];
  /** Known ATS keywords / parsing behavior */
  atsNotes: string;
  /** Average response time in days */
  avgResponseDays?: number;
}

const PORTAL_DATABASE: Record<string, PortalPlatformInfo> = {
  "linkedin.com": {
    name: "LinkedIn",
    atsSystem: "LinkedIn ATS / Employer ATS (varies)",
    region: "global",
    submissionType: "linkedin_easyapply",
    procedures: [
      "Log in to LinkedIn and click 'Easy Apply' or 'Apply' button on the job listing",
      "Complete all required fields — LinkedIn pre-fills from your profile but verify accuracy",
      "Upload your tailored CV/Resume (PDF format strongly recommended)",
      "Answer any additional screening questions honestly and concisely",
      "Review application summary carefully before final submission",
      "Save the application confirmation for your records",
    ],
    requiredDocuments: ["CV/Resume (PDF)", "Cover Letter (optional unless required)", "LinkedIn profile updated"],
    tips: [
      "Ensure your LinkedIn headline matches the target role keywords",
      "Set 'Open to Work' privately to avoid alerting current employer",
      "Attach a tailored CV even on Easy Apply — recruiters download and compare",
      "Answer screening questions with specific numbers and results where possible",
      "Follow the company page before applying — increases visibility",
    ],
    atsNotes: "LinkedIn ATS scores profiles against job keywords. Match job title, skills, and experience keywords in your CV headline and summary.",
    avgResponseDays: 14,
  },
  "greenhouse.io": {
    name: "Greenhouse",
    atsSystem: "Greenhouse ATS",
    region: "global",
    submissionType: "ats_form",
    procedures: [
      "Click 'Apply for this job' button on the Greenhouse job page",
      "Create a Greenhouse account or proceed as a guest applicant",
      "Fill in all required personal information fields (name, email, phone, location)",
      "Upload CV/Resume and Cover Letter as separate PDF files",
      "Complete EEOC/voluntary demographic disclosure questions",
      "Answer structured behavioral or technical screening questions",
      "Review all data accuracy on the summary page before submission",
      "You will receive an automated confirmation email from Greenhouse",
    ],
    requiredDocuments: ["CV/Resume (PDF)", "Cover Letter (PDF)", "Work authorization status"],
    tips: [
      "Greenhouse ATS parses PDFs — use clean, single-column CV layouts",
      "Keywords in job description should appear verbatim in your CV",
      "Avoid tables, graphics, or headers in your CV — they break ATS parsing",
      "Use standard section titles: 'Work Experience', 'Education', 'Skills'",
      "Fill every optional field — incomplete applications rank lower in queue",
    ],
    atsNotes: "Greenhouse uses structured scoring. Your CV is keyword-matched against the job description. Skills, titles, and years of experience are weighted heavily.",
    avgResponseDays: 10,
  },
  "lever.co": {
    name: "Lever",
    atsSystem: "Lever ATS",
    region: "global",
    submissionType: "ats_form",
    procedures: [
      "Navigate to the Lever-hosted job posting (usually at jobs.lever.co/company)",
      "Click 'Apply' and fill in your name, email, phone, and LinkedIn/resume URL",
      "Upload your CV/Resume as a PDF or Word document",
      "Complete any custom application questions added by the employer",
      "Submit — Lever sends a confirmation email immediately",
      "Track your application status via the link in the confirmation email",
    ],
    requiredDocuments: ["CV/Resume (PDF or DOCX)", "Cover Letter (often optional)", "Portfolio/GitHub URL"],
    tips: [
      "Lever stores all your data — update your profile if reapplying to the same company",
      "Include a portfolio link — Lever prominently displays external links",
      "Cover letter on Lever is usually a text box, not a file upload",
      "Lever recruiters frequently search by keyword in candidate notes",
      "Personalize the cover letter for the specific team/role mentioned in the posting",
    ],
    atsNotes: "Lever indexes full-text of your CV and cover letter. Natural language keyword matching — use the same terminology as the job description.",
    avgResponseDays: 7,
  },
  "workday.com": {
    name: "Workday",
    atsSystem: "Workday Recruiting",
    region: "global",
    submissionType: "ats_form",
    procedures: [
      "Sign in to or create a Workday account (account required for all applications)",
      "Search for the job and click 'Apply' — the multi-step form begins",
      "Step 1: Confirm contact information and legal eligibility",
      "Step 2: Upload CV — Workday will attempt to parse and auto-fill your profile",
      "Step 3: Verify auto-filled work history entries and correct any parsing errors",
      "Step 4: Provide education history with exact dates and GPA if requested",
      "Step 5: Complete voluntary self-identification (EEO/OFCCP) forms",
      "Step 6: Answer job-specific screening questions",
      "Step 7: Review and submit — save confirmation number",
    ],
    requiredDocuments: ["CV/Resume (PDF)", "Cover Letter", "Education transcripts (sometimes)", "Work authorization proof"],
    tips: [
      "Workday's CV parser is notoriously imperfect — always manually verify all auto-filled fields",
      "Use standard date formats (MM/YYYY) for employment dates",
      "Workday requires you to log in each time — save your credentials",
      "Complete your Workday profile fully — it persists across multiple employers using Workday",
      "Avoid applying on mobile — Workday's mobile experience has known form issues",
      "If prompted for a cover letter, always include one — it signals thoroughness",
    ],
    atsNotes: "Workday ATS uses structured data fields. CV parsing accuracy varies. Always manually verify every auto-filled field to ensure accuracy.",
    avgResponseDays: 21,
  },
  "myworkday": {
    name: "Workday",
    atsSystem: "Workday Recruiting",
    region: "global",
    submissionType: "ats_form",
    procedures: [
      "Sign in to or create a Workday account (account required for all applications)",
      "Search for the job and click 'Apply' — the multi-step form begins",
      "Step 1: Confirm contact information and legal eligibility",
      "Step 2: Upload CV — Workday will attempt to parse and auto-fill your profile",
      "Step 3: Verify auto-filled work history entries and correct any parsing errors",
      "Step 4: Provide education history with exact dates and GPA if requested",
      "Step 5: Complete voluntary self-identification (EEO/OFCCP) forms",
      "Step 6: Answer job-specific screening questions",
      "Step 7: Review and submit — save confirmation number",
    ],
    requiredDocuments: ["CV/Resume (PDF)", "Cover Letter", "Education transcripts (sometimes)", "Work authorization proof"],
    tips: [
      "Workday's CV parser is notoriously imperfect — always manually verify all auto-filled fields",
      "Use standard date formats (MM/YYYY) for employment dates",
      "Workday requires you to log in each time — save your credentials",
      "Complete your Workday profile fully — it persists across multiple employers using Workday",
      "Avoid applying on mobile — Workday's mobile experience has known form issues",
    ],
    atsNotes: "Workday ATS uses structured data fields. CV parsing accuracy varies. Always manually verify every auto-filled field to ensure accuracy.",
    avgResponseDays: 21,
  },
  "icims.com": {
    name: "iCIMS",
    atsSystem: "iCIMS Talent Cloud",
    region: "global",
    submissionType: "ats_form",
    procedures: [
      "Click 'Apply Now' on the iCIMS-powered careers page",
      "Create an iCIMS account or use social sign-in (LinkedIn/Google)",
      "Upload your CV — iCIMS will parse it to auto-fill fields",
      "Verify and manually correct all auto-populated fields",
      "Complete the work history, education, and skills sections",
      "Answer assessment/screening questions if presented",
      "Agree to privacy policy and submit",
    ],
    requiredDocuments: ["CV/Resume (PDF/Word)", "Cover Letter (varies)", "References (sometimes requested)"],
    tips: [
      "iCIMS allows saving and returning to complete an application — use this feature",
      "Your iCIMS profile persists — update it before each application",
      "Include all employment gaps with explanations in the notes field",
      "Match your job title history exactly to how it appears on LinkedIn",
    ],
    atsNotes: "iCIMS scores based on completeness and keyword density. Incomplete profiles rank lower. Ensure all mandatory fields are filled.",
    avgResponseDays: 14,
  },
  "bamboohr.com": {
    name: "BambooHR",
    atsSystem: "BambooHR Applicant Tracking",
    region: "global",
    submissionType: "ats_form",
    procedures: [
      "Navigate to the company's BambooHR career portal (usually careers.bamboohr.com/company)",
      "Click the job title and then 'Apply for this Job'",
      "Fill in contact details, work history, and education",
      "Upload your CV/Resume and any requested documents",
      "Complete any custom screening questions",
      "Submit and save the confirmation",
    ],
    requiredDocuments: ["CV/Resume", "Cover Letter (if required)", "Work samples (if requested)"],
    tips: [
      "BambooHR portals are often customized per employer — read all instructions carefully",
      "Cover letter fields on BambooHR are usually text boxes, not file uploads",
      "Include your salary expectations if there is a field for it",
    ],
    atsNotes: "BambooHR ATS performs basic keyword matching. Simple, clean CV format recommended.",
    avgResponseDays: 10,
  },
  "smartrecruiters.com": {
    name: "SmartRecruiters",
    atsSystem: "SmartRecruiters ATS",
    region: "global",
    submissionType: "ats_form",
    procedures: [
      "Click 'Apply' on the SmartRecruiters job posting",
      "Sign in with Google/LinkedIn or create an account",
      "Upload your CV — SmartRecruiters will auto-parse it",
      "Verify and complete all auto-filled profile fields",
      "Add a cover letter in the text field or upload as a file",
      "Submit application and check your email for confirmation",
    ],
    requiredDocuments: ["CV/Resume (PDF)", "Cover Letter", "Portfolio (if required)"],
    tips: [
      "SmartRecruiters supports LinkedIn import — use it for faster profile completion",
      "Include measurable achievements in your CV — SmartRecruiters uses AI scoring",
      "Check your spam folder for confirmation emails from SmartRecruiters",
    ],
    atsNotes: "SmartRecruiters uses AI to rank candidates. Measurable achievements, relevant skills, and keyword alignment are weighted heavily.",
    avgResponseDays: 7,
  },
  "jobvite.com": {
    name: "Jobvite",
    atsSystem: "Jobvite ATS",
    region: "us",
    submissionType: "ats_form",
    procedures: [
      "Click 'Apply' on the Jobvite-powered careers page",
      "Connect with LinkedIn for faster profile import, or fill manually",
      "Upload your resume and cover letter",
      "Complete any additional application questions",
      "Submit and save your application confirmation",
    ],
    requiredDocuments: ["CV/Resume", "Cover Letter (often optional)"],
    tips: [
      "Jobvite heavily prioritizes employee referrals — if you know anyone at the company, ask for a referral first",
      "Customize your LinkedIn headline before importing to Jobvite",
    ],
    atsNotes: "Jobvite ATS scores candidates on skills match, job title proximity, and years of experience.",
    avgResponseDays: 10,
  },
  "myjobmag": {
    name: "MyJobMag",
    atsSystem: "MyJobMag Custom Portal",
    region: "africa",
    submissionType: "email_forward",
    procedures: [
      "Create or log in to your MyJobMag account",
      "Click 'Apply' on the job listing",
      "Upload your CV in PDF format (max 2MB usually)",
      "Write a brief cover letter in the provided text field",
      "Submit — MyJobMag forwards your application to the employer by email",
      "Track application status in your MyJobMag dashboard",
    ],
    requiredDocuments: ["CV/Resume (PDF)", "Cover Letter (text)"],
    tips: [
      "Keep CV under 2MB — MyJobMag has file size limits",
      "Update your MyJobMag profile before each application — it appears alongside your CV",
      "Set up job alerts for similar roles to apply early",
      "Applications submitted in the first 24 hours get more visibility",
    ],
    atsNotes: "MyJobMag forwards applications as email to the employer. There is no ATS scoring — quality of your CV and cover letter is critical.",
    avgResponseDays: 21,
  },
  "brightermonday": {
    name: "BrighterMonday Kenya",
    atsSystem: "BrighterMonday Custom Portal",
    region: "kenya",
    submissionType: "custom_form",
    procedures: [
      "Log in or register on BrighterMonday Kenya",
      "Ensure your BrighterMonday profile is 100% complete before applying",
      "Click 'Apply Now' on the job listing",
      "Your BrighterMonday profile is submitted as your application",
      "Optionally upload an additional CV document",
      "Write a customized cover letter in the provided field",
      "Submit — receive confirmation via email",
    ],
    requiredDocuments: ["Completed BrighterMonday Profile", "CV/Resume (optional supplement)", "Cover Letter"],
    tips: [
      "BrighterMonday uses your platform profile as the primary application — complete it to 100%",
      "Add all skills from the job description to your profile skills section",
      "Upload a professional profile photo — BrighterMonday profiles show photos",
      "Apply early — BrighterMonday shows application counts to employers",
      "Set your profile as 'Actively Looking' to appear in recruiter searches",
    ],
    atsNotes: "BrighterMonday scores candidates based on profile completeness, skill overlap, and experience relevance. Profile quality matters more than the CV file.",
    avgResponseDays: 14,
  },
  "fuzu.com": {
    name: "Fuzu",
    atsSystem: "Fuzu Native ATS",
    region: "africa",
    submissionType: "custom_form",
    procedures: [
      "Log in or create a Fuzu account",
      "Complete your Fuzu career profile to 100% (critical for scoring)",
      "Click 'Apply' on the target job posting",
      "Answer any Fuzu-specific competency questions",
      "Upload additional CV if the employer requests it",
      "Submit — Fuzu sends a profile and score to the employer",
    ],
    requiredDocuments: ["Completed Fuzu Profile", "Competency assessments", "CV (if employer requests)"],
    tips: [
      "Fuzu scores your profile against job requirements automatically — complete every section",
      "Take Fuzu's built-in skill assessments to increase your match score",
      "Fuzu shows you a 'fit score' before applying — aim for 70%+ before submitting",
      "Fuzu's courses can boost your profile score — complete relevant ones",
      "Apply within 24 hours of a job posting for maximum visibility",
    ],
    atsNotes: "Fuzu calculates a quantitative fit score based on skills, education, experience, and competency assessments. Higher scores appear first in employer queues.",
    avgResponseDays: 10,
  },
  "glassdoor.com": {
    name: "Glassdoor",
    atsSystem: "Employer ATS (varies per company)",
    region: "global",
    submissionType: "custom_form",
    procedures: [
      "Click 'Easy Apply' or 'Apply on Company Site' on Glassdoor",
      "For Easy Apply: sign in with Google/LinkedIn and complete the form",
      "For company site redirect: follow that employer's specific portal procedures",
      "Upload CV and complete all required fields",
      "Submit application and note the confirmation",
    ],
    requiredDocuments: ["CV/Resume (PDF)", "Cover Letter (if required)"],
    tips: [
      "Research the company on Glassdoor before applying — use reviews to tailor your cover letter",
      "Check Glassdoor interview reviews to prepare for screening questions",
      "Glassdoor Easy Apply routes to the employer's own ATS — your data may be processed by a different system",
    ],
    atsNotes: "Glassdoor Easy Apply typically forwards to the employer's native ATS. ATS parsing rules depend on the employer's system, not Glassdoor.",
    avgResponseDays: 14,
  },
  "indeed.com": {
    name: "Indeed",
    atsSystem: "Indeed Apply / Employer ATS",
    region: "global",
    submissionType: "custom_form",
    procedures: [
      "Click 'Apply Now' or 'Easy Apply' on the Indeed job listing",
      "For Indeed Apply: complete the integrated form — upload CV and answer screening questions",
      "For external apply: you will be redirected to the employer's own portal — follow their procedures",
      "Complete all required fields including work authorization and expected salary if asked",
      "Submit and save confirmation",
    ],
    requiredDocuments: ["CV/Resume", "Cover Letter (if requested)", "Work authorization status"],
    tips: [
      "Indeed Apply is faster but external portals give you more control — weigh carefully",
      "Set up an Indeed Resume and keep it current — Indeed Apply uses it directly",
      "Use Indeed's salary tool to benchmark your salary expectation before listing it",
      "Apply within 24-48 hours of posting for 3x more visibility",
    ],
    atsNotes: "Indeed's native ATS ranks candidates by keyword match and application completeness. External applications are forwarded to employer ATS.",
    avgResponseDays: 7,
  },
  "jobwebkenya": {
    name: "JobWebKenya",
    atsSystem: "JobWebKenya Custom Portal",
    region: "kenya",
    submissionType: "email_forward",
    procedures: [
      "Register or log in to JobWebKenya",
      "Navigate to the job listing and click 'Apply'",
      "Upload your CV in PDF format",
      "Fill in the application form fields (name, contact, experience summary)",
      "Submit — applications are forwarded to employer by email or through the portal",
    ],
    requiredDocuments: ["CV/Resume (PDF)", "Cover Letter (if specified in job ad)"],
    tips: [
      "Read the job description carefully — some JobWebKenya listings require applying directly by email",
      "Include your National ID or passport number if requested",
      "Include your KRA PIN for government or regulated sector jobs",
      "Ensure your CV is ATS-clean (no tables, graphics, or unusual fonts)",
    ],
    atsNotes: "JobWebKenya is a Kenya-specific board. Applications are often forwarded to the employer as email attachments. No automated ATS scoring.",
    avgResponseDays: 21,
  },
  "pigiame.co.ke": {
    name: "PigiMe",
    atsSystem: "PigiMe Custom Portal",
    region: "kenya",
    submissionType: "email_forward",
    procedures: [
      "Navigate to the PigiMe job listing",
      "Click 'Apply' or use the contact information in the listing",
      "Some PigiMe listings require direct email application — check the listing instructions",
      "Upload or email your CV in PDF or Word format",
      "Include a cover letter if specified in the listing",
    ],
    requiredDocuments: ["CV/Resume", "Cover Letter (if specified)"],
    tips: [
      "PigiMe listings often include direct email contacts — verify the application method",
      "Keep your application email subject line professional: 'Application: [Job Title] — [Your Name]'",
      "PigiMe is popular for SME job listings — tailor your application to smaller company culture",
    ],
    atsNotes: "PigiMe listings are mostly forwarded via email. No ATS scoring. Quality and personalization of your cover letter are critical.",
    avgResponseDays: 14,
  },
  "taleo": {
    name: "Oracle Taleo",
    atsSystem: "Oracle Taleo ATS",
    region: "global",
    submissionType: "ats_form",
    procedures: [
      "Click 'Apply' on the Taleo-powered careers page",
      "Create a Taleo account (required — no guest applications)",
      "Fill in all work history entries manually with exact dates",
      "Upload your CV — Taleo will attempt to parse it but manual verification is essential",
      "Complete all custom screening questions",
      "Agree to background check authorization and EEO disclosures",
      "Submit and note your application reference number",
    ],
    requiredDocuments: ["CV/Resume", "Cover Letter", "Employment authorization form", "Background check consent"],
    tips: [
      "Taleo is known for being tedious — budget 45-90 minutes for a complete application",
      "Taleo's parser frequently misreads dates and job titles — verify every field",
      "Save your Taleo profile for reuse across companies that use Oracle Taleo",
      "Use the 'Save and Continue Later' feature for long applications",
    ],
    atsNotes: "Oracle Taleo performs strict keyword matching. Use the exact job title and skill keywords from the job description in your CV.",
    avgResponseDays: 21,
  },
  "successfactors": {
    name: "SAP SuccessFactors",
    atsSystem: "SAP SuccessFactors Recruiting",
    region: "global",
    submissionType: "ats_form",
    procedures: [
      "Sign in to the company's SAP SuccessFactors career portal",
      "Click 'Apply' on the job posting",
      "Complete your profile sections (Personal Info, Work Experience, Education, Skills)",
      "Upload CV as PDF",
      "Complete additional questions or assessments if required",
      "Submit and receive email confirmation",
    ],
    requiredDocuments: ["CV/Resume (PDF)", "Cover Letter (if requested)"],
    tips: [
      "SAP SuccessFactors is used by large enterprise companies — follow corporate application norms",
      "Include quantifiable achievements in work experience (%, KPIs, revenue impact)",
      "Update your SAP profile — it persists and can be reused across applications at the same company",
    ],
    atsNotes: "SAP SuccessFactors ATS scores candidates on structured data fields. Complete profile quality and keyword matching are key ranking factors.",
    avgResponseDays: 14,
  },
};

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
    "send cv to",
    "forward your cv",
    "send to:",
    "apply by email",
    "applications to:",
    "attach your cv",
    "attach cv",
    "kindly send",
    "please send",
    "send your application",
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
 * Detects the job portal platform key from a source URL.
 */
export function _detectPortalKey(url: string): string {
  if (!url) return "";
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return "linkedin.com";
  if (lower.includes("myjobmag")) return "myjobmag";
  if (lower.includes("brightermonday")) return "brightermonday";
  if (lower.includes("fuzu.com")) return "fuzu.com";
  if (lower.includes("glassdoor.com")) return "glassdoor.com";
  if (lower.includes("indeed.com")) return "indeed.com";
  if (lower.includes("jobwebkenya")) return "jobwebkenya";
  if (lower.includes("pigiame.co.ke")) return "pigiame.co.ke";
  if (lower.includes("greenhouse.io")) return "greenhouse.io";
  if (lower.includes("workday.com") || lower.includes("myworkday")) return "workday.com";
  if (lower.includes("lever.co")) return "lever.co";
  if (lower.includes("icims.com")) return "icims.com";
  if (lower.includes("bamboohr.com")) return "bamboohr.com";
  if (lower.includes("smartrecruiters.com")) return "smartrecruiters.com";
  if (lower.includes("jobvite.com")) return "jobvite.com";
  if (lower.includes("taleo.net") || lower.includes("taleo.com")) return "taleo";
  if (lower.includes("successfactors.com") || lower.includes("sapsf.com")) return "successfactors";
  return "";
}

/**
 * Detects the job portal platform name from a source URL for display purposes.
 */
export function _extractPortalPlatformFromUrl(url: string): string {
  const key = _detectPortalKey(url);
  return PORTAL_DATABASE[key]?.name || "";
}

/**
 * Returns full portal platform metadata including procedures, tips, required docs.
 */
export function getPortalPlatformInfo(url: string): PortalPlatformInfo | null {
  const key = _detectPortalKey(url);
  return PORTAL_DATABASE[key] || null;
}

/**
 * Maps a known portal platform name to its common ATS system.
 */
export function getPortalAtsSystem(platform: string): string {
  const entry = Object.values(PORTAL_DATABASE).find(
    (p) => p.name.toLowerCase() === platform.toLowerCase()
  );
  return entry?.atsSystem || "Unknown / Custom ATS";
}

/**
 * Returns portal-specific application checklist items.
 */
export function getPortalChecklist(url: string): string[] {
  const info = getPortalPlatformInfo(url);
  if (!info) {
    return [
      "Open the job portal URL in a new browser tab",
      "Prepare your tailored CV/Resume in PDF format",
      "Write a personalized cover letter for this role",
      "Complete all required application fields accurately",
      "Review your application for errors before submitting",
      "Save the application confirmation or reference number",
      "Log your application in this tracker with the correct date",
    ];
  }

  return [
    ...info.procedures.map((p, i) => `Step ${i + 1}: ${p}`),
    "Save the application confirmation email/number",
    "Log this application in your pipeline tracker immediately",
    `Expected response time: ~${info.avgResponseDays || "14"} business days`,
  ];
}

/**
 * Returns required documents for a given portal URL.
 */
export function getPortalRequiredDocuments(url: string): string[] {
  const info = getPortalPlatformInfo(url);
  if (!info) {
    return [
      "Tailored CV/Resume (PDF format, ATS-optimized)",
      "Cover Letter (tailored to this specific role and company)",
      "Portfolio or GitHub URL (if applicable)",
    ];
  }
  return info.requiredDocuments;
}

/**
 * Returns portal-specific optimization tips.
 */
export function getPortalTips(url: string): string[] {
  const info = getPortalPlatformInfo(url);
  if (!info) {
    return [
      "Tailor your CV to match the exact keywords in the job description",
      "Apply within 24-48 hours of the posting for maximum visibility",
      "Write a personalized cover letter — generic letters are immediately dismissed",
      "Follow up by email 5-7 business days after submitting your application",
    ];
  }
  return info.tips;
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
        lower.includes("what to expect") ||
        lower.includes("key duties") ||
        lower.includes("primary duties") ||
        lower.includes("job duties") ||
        lower.includes("key accountabilities")
      ) {
        mode = "resp";
        continue;
      } else if (
        lower.includes("requirement") ||
        lower.includes("qualifications") ||
        lower.includes("what you bring") ||
        lower.includes("skills needed") ||
        lower.includes("what we look for") ||
        lower.includes("must have") ||
        lower.includes("minimum qualifications") ||
        lower.includes("preferred qualifications") ||
        lower.includes("experience required") ||
        lower.includes("about you")
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

/**
 * Detect if a job description contains deadline/closing date information.
 */
export function extractApplicationDeadline(description: string = "", notes: string = ""): string | null {
  const deadlinePatterns = [
    /deadline[:\s]+([a-z]+ \d{1,2},?\s*\d{4})/i,
    /closing date[:\s]+([a-z]+ \d{1,2},?\s*\d{4})/i,
    /apply by[:\s]+([a-z]+ \d{1,2},?\s*\d{4})/i,
    /applications close[:\s]+([a-z]+ \d{1,2},?\s*\d{4})/i,
    /due date[:\s]+([a-z]+ \d{1,2},?\s*\d{4})/i,
    /close[s]? on[:\s]+([a-z]+ \d{1,2},?\s*\d{4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
  ];

  for (const pattern of deadlinePatterns) {
    const match = (description + " " + notes).match(pattern);
    if (match) return match[1] || match[0];
  }
  return null;
}

// ─── Portal Form Fields System ────────────────────────────────────────────────
// Defines every field a portal form typically collects, pre-filled from
// the candidate profile, with per-platform customization.

export type PortalFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "date"
  | "file"
  | "url"
  | "number"
  | "yesno"
  | "checkbox";

export interface PortalFormField {
  id: string;
  label: string;
  type: PortalFieldType;
  section: "personal" | "education" | "experience" | "eligibility" | "documents" | "screening" | "eeoc" | "salary";
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select / yesno / radio
  helpText?: string;
  /** Pre-filled value from candidate profile */
  defaultValue?: string;
  /** Whether the portal will reject blank submissions */
  validationNote?: string;
}

export interface PortalScreeningQuestion {
  id: string;
  question: string;
  type: "text" | "textarea" | "yesno" | "select" | "number";
  category: "motivation" | "experience" | "eligibility" | "salary" | "availability" | "technical" | "behavioral";
  required: boolean;
  suggestedAnswer?: string;
  options?: string[];
  helpText?: string;
}

/**
 * Returns the standard set of portal form fields, pre-filled from the candidate profile,
 * customized per portal platform AND job-specific requirements.
 *
 * Field `required` is determined by:
 *  1. Platform rules (e.g. LinkedIn always needs LinkedIn URL)
 *  2. Job description signals (e.g. mentions 'linkedin' → LinkedIn field required)
 *  3. Region rules (e.g. Kenya portals need National ID, KRA PIN)
 *  4. Everything else is optional and clearly labelled
 */
export function getPortalFormFields(
  portalUrl: string,
  candidate: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedinUrl: string;
    githubUrl: string;
    highestEducation: string;
    institutionName: string;
    yearsOfExperience: string;
    currentEmployer: string;
    salaryExpectation: string;
    noticePeriod: string;
    workAuthorization: string;
    visaSponsorship: string;
    relocationPreference: string;
    idNumber: string;
    kraPin: string;
    eeoGender: string;
    eeoDisability: string;
    eeoVeteran: string;
  },
  job?: {
    title?: string;
    description?: string | null;
    requirements?: string[] | null;
    required_skills?: string[] | null;
    mode?: string;
    employment_type?: string;
    level?: string;
  }
): PortalFormField[] {
  const platform = _detectPortalKey(portalUrl);
  const platformInfo = PORTAL_DATABASE[platform];
  const isKenyanPortal = platformInfo?.region === "kenya" || platformInfo?.region === "africa";

  // Derive job-specific field requirements from description + requirements
  const desc = ((job?.description || "") + " " + (job?.requirements || []).join(" ")).toLowerCase();
  const skills = (job?.required_skills || []).map(s => s.toLowerCase());

  // Field requirement heuristics derived from job context
  const jobRequiresLinkedIn   = platform === "linkedin.com" || desc.includes("linkedin");
  const jobRequiresGithub     = desc.includes("github") || desc.includes("portfolio") || skills.some(s => ["react","node","python","javascript","typescript","go","rust"].includes(s));
  const jobRequiresSalary     = desc.includes("salary expectation") || desc.includes("compensation") || desc.includes("remuneration");
  const jobRequiresNoticePeriod = desc.includes("notice period") || desc.includes("start date") || desc.includes("available");
  const jobRequiresCoverLetter  = platform === "greenhouse.io" || platform === "lever.co" || platform === "workday.com" || desc.includes("cover letter");
  const jobRequiresNationalId   = isKenyanPortal && (desc.includes("national id") || desc.includes("id number") || desc.includes("passport"));
  const jobRequiresKraPin       = isKenyanPortal && (desc.includes("kra") || desc.includes("tax compliance") || desc.includes("pin number"));
  const jobRequiresWorkAuth     = desc.includes("work permit") || desc.includes("work authorization") || desc.includes("right to work") || desc.includes("citizen");
  const jobRequiresRelocation   = job?.mode === "Onsite" || desc.includes("relocation") || desc.includes("willing to relocate");
  const jobRequiresVisa         = desc.includes("visa") || desc.includes("sponsorship");
  const jobIsRemoteOrHybrid     = job?.mode === "Remote" || job?.mode === "Hybrid";
  const jobIsSenior             = (job?.level || "").toLowerCase().includes("senior") || (job?.level || "").toLowerCase().includes("lead") || (job?.level || "").toLowerCase().includes("manager");


  const fields: PortalFormField[] = [
    // ── PERSONAL DETAILS ───────────────────────────────────────────────────────
    {
      id: "full_name",
      label: "Full Legal Name",
      type: "text",
      section: "personal",
      required: true,
      placeholder: "As it appears on official documents",
      defaultValue: candidate.fullName,
      validationNote: "Must match government ID exactly",
    },
    {
      id: "email",
      label: "Email Address",
      type: "email",
      section: "personal",
      required: true,
      placeholder: "you@example.com",
      defaultValue: candidate.email,
      helpText: "Application confirmation and status updates will be sent here",
    },
    {
      id: "phone",
      label: "Phone Number",
      type: "phone",
      section: "personal",
      required: true,
      placeholder: "+254 7XX XXX XXX",
      defaultValue: candidate.phone,
      validationNote: "Include country code",
    },
    {
      id: "location",
      label: "Current Location / City",
      type: "text",
      section: "personal",
      required: true,
      placeholder: "e.g. Nairobi, Kenya",
      defaultValue: candidate.location,
    },
    {
      id: "linkedin_url",
      label: "LinkedIn Profile URL",
      type: "url",
      section: "personal",
      required: jobRequiresLinkedIn,
      placeholder: "https://linkedin.com/in/username",
      defaultValue: candidate.linkedinUrl,
      helpText: jobRequiresLinkedIn
        ? "Required by this job posting. Ensure your profile is up to date."
        : "Strongly recommended — many ATS systems verify your LinkedIn profile",
    },
    {
      id: "github_url",
      label: "GitHub / Portfolio URL",
      type: "url",
      section: "personal",
      required: jobRequiresGithub,
      placeholder: "https://github.com/username",
      defaultValue: candidate.githubUrl,
      helpText: jobRequiresGithub
        ? "Required for this role — include your best repositories or portfolio."
        : "Optional — include if relevant to the role (especially for tech positions)",
    },

    // ── EDUCATION ──────────────────────────────────────────────────────────────
    {
      id: "highest_education",
      label: "Highest Level of Education",
      type: "select",
      section: "education",
      required: true,
      options: [
        "Bachelor's Degree",
        "Master's Degree",
        "PhD / Doctorate",
        "Diploma / Certificate",
        "High School / A-Levels",
        "Professional Certification",
        "Other",
      ],
      defaultValue: candidate.highestEducation.includes("Bachelor") ? "Bachelor's Degree"
        : candidate.highestEducation.includes("Master") ? "Master's Degree"
        : candidate.highestEducation.includes("Diploma") ? "Diploma / Certificate"
        : "Bachelor's Degree",
      helpText: "Select the highest qualification you have completed",
    },
    {
      id: "field_of_study",
      label: "Field of Study / Degree Title",
      type: "text",
      section: "education",
      required: true,
      placeholder: "e.g. Bachelor of Science in Information Security",
      defaultValue: candidate.highestEducation,
    },
    {
      id: "institution_name",
      label: "University / Institution Name",
      type: "text",
      section: "education",
      required: true,
      placeholder: "e.g. University of Nairobi",
      defaultValue: candidate.institutionName,
    },
    {
      id: "graduation_year",
      label: "Year of Graduation",
      type: "text",
      section: "education",
      required: false,
      placeholder: "e.g. 2023",
      helpText: "Enter the year you completed / expect to complete your degree",
    },

    // ── WORK EXPERIENCE ────────────────────────────────────────────────────────
    {
      id: "years_experience",
      label: "Total Years of Relevant Experience",
      type: "select",
      section: "experience",
      required: true,
      options: ["0 – 1 Year", "1 – 2 Years", "2 – 3 Years", "3 – 5 Years", "5 – 7 Years", "7 – 10 Years", "10+ Years"],
      defaultValue: candidate.yearsOfExperience.includes("3") ? "3 – 5 Years"
        : candidate.yearsOfExperience.includes("5") ? "5 – 7 Years"
        : candidate.yearsOfExperience.includes("1") ? "1 – 2 Years"
        : "3 – 5 Years",
    },
    {
      id: "current_employer",
      label: "Current / Most Recent Job Title",
      type: "text",
      section: "experience",
      required: true,
      placeholder: "e.g. Full-Stack Software Engineer",
      defaultValue: candidate.currentEmployer,
    },
    {
      id: "current_company",
      label: "Current / Most Recent Employer",
      type: "text",
      section: "experience",
      required: false,
      placeholder: "e.g. Tech Startup Ltd",
      defaultValue: "",
      helpText: "Leave blank if currently unemployed or if employer is confidential",
    },

    // ── ELIGIBILITY & AVAILABILITY ─────────────────────────────────────────────
    {
      id: "work_authorization",
      label: "Work Authorization Status",
      type: "select",
      section: "eligibility",
      required: jobRequiresWorkAuth,
      options: [
        "Authorized / Citizen",
        "Permanent Resident",
        "Work Permit Holder",
        "Require Visa Sponsorship",
        "Student Visa / OPT",
      ],
      defaultValue: candidate.workAuthorization,
      helpText: jobRequiresWorkAuth
        ? "This job explicitly requires work authorization confirmation"
        : "Optional — most portals ask this to filter ineligible candidates",
    },
    {
      id: "requires_visa_sponsorship",
      label: "Do you require visa sponsorship?",
      type: "yesno",
      section: "eligibility",
      required: jobRequiresVisa,
      options: ["Yes", "No"],
      defaultValue: candidate.visaSponsorship.toLowerCase().startsWith("no") ? "No" : "Yes",
      helpText: jobRequiresVisa
        ? "This job mentions visa/sponsorship requirements — answer accurately"
        : "Optional disclosure",
    },
    {
      id: "relocation",
      label: "Open to Relocation?",
      type: "select",
      section: "eligibility",
      required: jobRequiresRelocation,
      options: [
        "Yes – willing to relocate",
        "No – local candidates only",
        "Open to Hybrid / Remote",
        "Negotiable",
      ],
      defaultValue: candidate.relocationPreference.includes("Open") ? "Open to Hybrid / Remote"
        : candidate.relocationPreference.includes("relocat") ? "Yes – willing to relocate"
        : "Negotiable",
      helpText: jobRequiresRelocation
        ? "This is an on-site role that may require relocation"
        : "Optional — only relevant for on-site roles",
    },
    {
      id: "notice_period",
      label: "Notice Period / Availability to Start",
      type: "select",
      section: "eligibility",
      required: jobRequiresNoticePeriod,
      options: [
        "Immediately available",
        "1 week",
        "2 weeks",
        "1 month",
        "2 months",
        "3 months",
        "Other",
      ],
      defaultValue: candidate.noticePeriod.toLowerCase().includes("immediate") ? "Immediately available"
        : candidate.noticePeriod.includes("2") ? "2 weeks"
        : candidate.noticePeriod.includes("1") ? "1 month"
        : "Immediately available",
      helpText: "Most portals require this. Ensure accuracy — misrepresentation can result in withdrawal of offer.",
    },

    // ── SALARY ─────────────────────────────────────────────────────────────────
    {
      id: "salary_expectation",
      label: "Salary Expectation",
      type: "text",
      section: "salary",
      required: jobRequiresSalary,
      placeholder: "e.g. KES 80,000 – 120,000 per month",
      defaultValue: candidate.salaryExpectation,
      helpText: jobRequiresSalary
        ? "This portal requires a salary figure. Quote a range aligned to the advertised band."
        : "Optional — but leaving blank may disadvantage your application. Be specific with currency and period.",
      validationNote: jobRequiresSalary
        ? "Required by this portal — provide a numeric range"
        : undefined,
    },

    // ── DOCUMENTS ──────────────────────────────────────────────────────────────
    {
      id: "cv_upload",
      label: "CV / Resume Upload",
      type: "file",
      section: "documents",
      required: true,
      helpText: "PDF format strongly recommended. Max size: 5MB. Use ATS-clean single-column layout.",
      validationNote: "REQUIRED — portal will reject applications without a CV file",
    },
    {
      id: "cover_letter_upload",
      label: "Cover Letter",
      type: "file",
      section: "documents",
      required: jobRequiresCoverLetter,
      helpText: jobRequiresCoverLetter
        ? "Required by this portal — upload PDF or paste into the portal's text field"
        : "Optional — upload as PDF or paste into the portal's cover letter text field if provided",
    },

    // ── KENYA-SPECIFIC ──────────────────────────────────────────────────────────
    ...(isKenyanPortal ? [
      {
        id: "national_id",
        label: "National ID / Passport Number",
        type: "text" as PortalFieldType,
        section: "documents" as PortalFormField["section"],
        required: jobRequiresNationalId,
        placeholder: "e.g. 38491024",
        defaultValue: candidate.idNumber,
        validationNote: jobRequiresNationalId
          ? "Required by this portal for identity verification"
          : "May be required — check the portal form before submitting",
        helpText: "National ID or Passport Number for Kenyan employment compliance",
      },
      {
        id: "kra_pin",
        label: "KRA PIN (Tax Compliance)",
        type: "text" as PortalFieldType,
        section: "documents" as PortalFormField["section"],
        required: jobRequiresKraPin,
        placeholder: "e.g. A019283471K",
        defaultValue: candidate.kraPin,
        helpText: "Kenya Revenue Authority PIN — required by government, regulated sector, and major corporate portals",
        validationNote: jobRequiresKraPin
          ? "Required by this portal based on job description signals"
          : "May be required — check the portal form",
      },
    ] : []),

    // ── EEOC / DIVERSITY ────────────────────────────────────────────────────────
    {
      id: "eeo_gender",
      label: "Gender Identity (Optional EEO)",
      type: "select",
      section: "eeoc",
      required: false,
      options: ["Male", "Female", "Non-binary", "Prefer not to say", "Decline to disclose"],
      defaultValue: candidate.eeoGender,
      helpText: "Voluntary equal opportunity disclosure — does not affect application scoring",
    },
    {
      id: "eeo_disability",
      label: "Disability Status (Optional EEO)",
      type: "select",
      section: "eeoc",
      required: false,
      options: ["No disability", "Yes, I have a disability", "Prefer not to say"],
      defaultValue: candidate.eeoDisability,
    },
    {
      id: "eeo_veteran",
      label: "Veteran Status (Optional EEO)",
      type: "select",
      section: "eeoc",
      required: false,
      options: ["Not a protected veteran", "I am a protected veteran", "Prefer not to say"],
      defaultValue: candidate.eeoVeteran,
    },
  ];

  return fields;
}

/**
 * Extracts job-specific portal screening questions from a job description.
 * These are questions the portal form will ask about eligibility, motivation,
 * and technical fit — distinct from generic profile fields.
 */
export function extractPortalScreeningQuestions(
  job: {
    title: string;
    company_name: string;
    description?: string | null;
    requirements?: string[] | null;
    required_skills?: string[] | null;
    mode?: string;
    employment_type?: string;
    salary_min?: number;
    salary_max?: number;
    currency?: string;
    level?: string;
  },
  candidate: {
    fullName: string;
    email: string;
    location: string;
    yearsOfExperience: string;
    salaryExpectation: string;
    noticePeriod: string;
    screeningA1: string;
    screeningA2: string;
    screeningA3: string;
  }
): PortalScreeningQuestion[] {
  const skills = job.required_skills || [];
  const topSkill = skills[0] || "the required technology stack";
  const secondSkill = skills[1] || "supporting tools";
  const desc = (job.description || "").toLowerCase();

  const questions: PortalScreeningQuestion[] = [];

  // ── MOTIVATION ─────────────────────────────────────────────────────────────
  questions.push({
    id: "sq_motivation",
    question: `Why are you interested in the ${job.title} role at ${job.company_name}?`,
    type: "textarea",
    category: "motivation",
    required: true,
    suggestedAnswer: candidate.screeningA1,
    helpText: "Be specific about the company, team, or impact area. Generic answers are filtered out.",
  });

  // ── TECHNICAL EXPERIENCE ───────────────────────────────────────────────────
  questions.push({
    id: "sq_tech_experience",
    question: `Describe your experience with ${topSkill}${secondSkill !== "supporting tools" ? ` and ${secondSkill}` : ""}.`,
    type: "textarea",
    category: "technical",
    required: true,
    suggestedAnswer: candidate.screeningA2,
    helpText: "Include specific projects, tools, and measurable outcomes.",
  });

  questions.push({
    id: "sq_project",
    question: "Describe a complex technical project you have worked on. What was your role and what was the outcome?",
    type: "textarea",
    category: "behavioral",
    required: true,
    suggestedAnswer: candidate.screeningA3,
    helpText: "Use the STAR method: Situation, Task, Action, Result. Include metrics.",
  });

  // ── ELIGIBILITY ────────────────────────────────────────────────────────────
  questions.push({
    id: "sq_years_exp",
    question: `How many years of experience do you have in ${topSkill} or a closely related field?`,
    type: "select",
    category: "eligibility",
    required: true,
    options: ["Less than 1 year", "1 – 2 years", "2 – 3 years", "3 – 5 years", "5 – 7 years", "7+ years"],
    suggestedAnswer: candidate.yearsOfExperience.includes("3") ? "3 – 5 years"
      : candidate.yearsOfExperience.includes("5") ? "5 – 7 years"
      : candidate.yearsOfExperience.includes("1") ? "1 – 2 years"
      : "3 – 5 years",
    helpText: "Select the range that best reflects your direct hands-on experience",
  });

  questions.push({
    id: "sq_work_authorization",
    question: "Are you legally authorized to work in this country without requiring visa sponsorship?",
    type: "yesno",
    category: "eligibility",
    required: true,
    options: ["Yes", "No"],
    suggestedAnswer: "Yes",
    helpText: "Most employers require legal work authorization. Answer truthfully.",
  });

  // ── SALARY ─────────────────────────────────────────────────────────────────
  questions.push({
    id: "sq_salary",
    question: "What are your salary expectations for this role?",
    type: "text",
    category: "salary",
    required: false,
    suggestedAnswer: candidate.salaryExpectation || (job.salary_min && job.salary_max
      ? `${job.currency || "KES"} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
      : "Negotiable based on full compensation package"),
    helpText: "Tip: Quote a range aligned with the job's advertised salary band to avoid immediate elimination.",
  });

  // ── AVAILABILITY ────────────────────────────────────────────────────────────
  questions.push({
    id: "sq_start_date",
    question: "What is your earliest available start date / notice period?",
    type: "text",
    category: "availability",
    required: true,
    suggestedAnswer: candidate.noticePeriod,
    helpText: "Be accurate. Misrepresenting availability can lead to offer withdrawal.",
  });

  // ── MODE-SPECIFIC ──────────────────────────────────────────────────────────
  if (job.mode === "Remote" || job.mode === "Hybrid") {
    questions.push({
      id: "sq_remote_setup",
      question: "Do you have a reliable home office setup (internet, quiet workspace, equipment)?",
      type: "yesno",
      category: "eligibility",
      required: job.mode === "Remote",
      options: ["Yes", "No – but I can arrange one"],
      suggestedAnswer: "Yes",
      helpText: "Remote roles often require a dedicated workspace and minimum internet speed.",
    });
  }

  // ── DESCRIPTION-DERIVED ─────────────────────────────────────────────────────
  // Detect if job description mentions specific screening criteria
  if (desc.includes("driver") || desc.includes("driving")) {
    questions.push({
      id: "sq_driving",
      question: "Do you hold a valid driver's licence?",
      type: "yesno",
      category: "eligibility",
      required: true,
      options: ["Yes", "No"],
      suggestedAnswer: "Yes",
    });
  }

  if (desc.includes("clearance") || desc.includes("background check") || desc.includes("police")) {
    questions.push({
      id: "sq_clearance",
      question: "Are you willing to undergo a background check / security clearance screening?",
      type: "yesno",
      category: "eligibility",
      required: true,
      options: ["Yes", "No"],
      suggestedAnswer: "Yes",
    });
  }

  if (desc.includes("language") || desc.includes("french") || desc.includes("swahili") || desc.includes("arabic")) {
    questions.push({
      id: "sq_language",
      question: "What languages are you proficient in (spoken and written)?",
      type: "text",
      category: "eligibility",
      required: false,
      suggestedAnswer: "English (Fluent), Swahili (Native)",
    });
  }

  if (desc.includes("travel") || desc.includes("field work") || desc.includes("site visits")) {
    questions.push({
      id: "sq_travel",
      question: "Are you willing and able to travel as required by the role?",
      type: "yesno",
      category: "eligibility",
      required: true,
      options: ["Yes", "No"],
      suggestedAnswer: "Yes",
    });
  }

  if (skills.some(s => s.toLowerCase().includes("python") || s.toLowerCase().includes("sql") || s.toLowerCase().includes("java"))) {
    questions.push({
      id: "sq_coding",
      question: `Rate your proficiency in ${topSkill} on a scale of 1–10.`,
      type: "select",
      category: "technical",
      required: false,
      options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      suggestedAnswer: "8",
      helpText: "Be honest — some portals follow up with a technical assessment that validates your self-rating.",
    });
  }

  return questions;
}

/**
 * Groups portal form fields by their section for tabbed display.
 */
export function groupPortalFieldsBySection(
  fields: PortalFormField[]
): Record<PortalFormField["section"], PortalFormField[]> {
  return fields.reduce((acc, field) => {
    if (!acc[field.section]) acc[field.section] = [];
    acc[field.section].push(field);
    return acc;
  }, {} as Record<PortalFormField["section"], PortalFormField[]>);
}

// ─── Pre-Application Readiness Analysis Engine ────────────────────────────────


export type ReadinessCheckStatus = "pass" | "warn" | "fail";

export interface ReadinessCheck {
  id: string;
  category: "identity" | "cv" | "cover_letter" | "screening" | "channel" | "documents" | "profile";
  label: string;
  description: string;
  status: ReadinessCheckStatus;
  detail?: string;
  /** If true, this is a blocker — cannot proceed without passing */
  isBlocker: boolean;
  /** Optional fix hint shown to the user */
  fixHint?: string;
}

export interface ReadinessReport {
  checks: ReadinessCheck[];
  passCount: number;
  warnCount: number;
  failCount: number;
  blockerFailCount: number;
  readinessScore: number; // 0-100
  isReadyToProceed: boolean;
  isPortalApplication: boolean;
  channelConflict: boolean; // email attempted on portal-only job
  channelConflictReason: string;
}

export interface ReadinessInput {
  // Candidate identity
  fullName: string;
  email: string;
  phone: string;
  location: string;
  // CV
  cvVersionId: string;
  cvAtsScore?: number;
  cvName?: string;
  // Cover letter
  coverLetter: string;
  // Screening answers
  screeningA1: string;
  screeningA2: string;
  screeningA3: string;
  // Channel info
  applyMethod: "website" | "email";
  // Job context
  job: {
    source_url?: string | null;
    contact_email?: string | null;
    recruiter_email?: string | null;
    apply_method?: string | null;
    description?: string | null;
    requirements?: string[] | null;
    required_skills?: string[] | null;
    company_name: string;
    title: string;
  };
  // Optional extra
  salaryExpectation?: string;
  noticePeriod?: string;
  idNumber?: string;
  kraPin?: string;
}

/**
 * Analyzes all application readiness criteria before portal or email submission.
 * Returns a comprehensive report with pass/warn/fail status for each check.
 */
export function analyzeApplicationReadiness(input: ReadinessInput): ReadinessReport {
  const checks: ReadinessCheck[] = [];

  const jobChannel = analyzeJobApplicationChannel(input.job);
  const portalInfo = getPortalPlatformInfo(input.job.source_url || "");
  const isPortalApp = jobChannel.channel === "website" || input.applyMethod === "website";

  // ── Channel conflict detection ──────────────────────────────────────────────
  // A conflict exists when: the job signals portal-only but email is selected,
  // OR when portal fields are blank but email is selected for a portal job.
  const hasPortalUrl = !!(input.job.source_url?.startsWith("http"));
  const hasRecruiterEmail = !!(input.job.recruiter_email || input.job.contact_email);
  const jobForcesWebsite = input.job.apply_method === "website" || input.job.apply_method === "portal";
  const channelConflict = jobForcesWebsite && input.applyMethod === "email";
  const channelConflictReason = channelConflict
    ? `This job requires portal/website application (apply_method="${input.job.apply_method}"). Email dispatch is not permitted for this role.`
    : hasPortalUrl && !hasRecruiterEmail && input.applyMethod === "email"
    ? "This job has a portal URL but no recruiter email. Switching to email dispatch may result in application loss."
    : "";

  // ─── 1. IDENTITY CHECKS ─────────────────────────────────────────────────────

  checks.push({
    id: "name",
    category: "identity",
    label: "Full Name",
    description: "Applicant full name must be present",
    status: input.fullName.trim().length >= 3 ? "pass" : "fail",
    detail: input.fullName.trim() || "Not provided",
    isBlocker: true,
    fixHint: "Enter your full name in the Personal & Socials tab",
  });

  checks.push({
    id: "email",
    category: "identity",
    label: "Email Address",
    description: "Valid email address required for portal registration and correspondence",
    status: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) ? "pass" : "fail",
    detail: input.email || "Not provided",
    isBlocker: true,
    fixHint: "Enter a valid email address in the Personal & Socials tab",
  });

  checks.push({
    id: "phone",
    category: "identity",
    label: "Phone Number",
    description: "Phone number is required by most portals for shortlisting and interview scheduling",
    status: input.phone.trim().length >= 7 ? "pass" : "warn",
    detail: input.phone.trim() || "Not provided",
    isBlocker: false,
    fixHint: "Add your phone number (e.g. +254 7XX XXX XXX) in the Personal tab",
  });

  checks.push({
    id: "location",
    category: "identity",
    label: "Location / City",
    description: "Location is required for eligibility screening (remote/on-site) and work authorization",
    status: input.location.trim().length >= 2 ? "pass" : "warn",
    detail: input.location.trim() || "Not provided",
    isBlocker: false,
    fixHint: "Add your city/location in the Personal tab (e.g. Nairobi, Kenya)",
  });

  // ─── 2. CV CHECKS ──────────────────────────────────────────────────────────

  checks.push({
    id: "cv_attached",
    category: "cv",
    label: "CV / Resume Attached",
    description: "A CV version must be selected and attached to the application",
    status: input.cvVersionId ? "pass" : "fail",
    detail: input.cvName || (input.cvVersionId ? "Attached" : "No CV selected"),
    isBlocker: true,
    fixHint: "Select a CV version from the dropdown or click 'Auto-Generate Tailored CV'",
  });

  if (input.cvVersionId) {
    const atsScore = input.cvAtsScore ?? 0;
    checks.push({
      id: "cv_ats_score",
      category: "cv",
      label: "CV ATS Compliance Score",
      description: "ATS score should be ≥70% to pass automated screening. Scores below 60% are likely rejected.",
      status: atsScore >= 75 ? "pass" : atsScore >= 60 ? "warn" : "fail",
      detail: `${atsScore}% ATS Score (${atsScore >= 75 ? "Good" : atsScore >= 60 ? "Borderline" : "Below threshold"})`,
      isBlocker: false,
      fixHint: atsScore < 70
        ? "Use 'Auto-Generate Tailored CV' to create a job-specific version with higher ATS compliance"
        : undefined,
    });
  }

  // ─── 3. COVER LETTER CHECKS ────────────────────────────────────────────────

  const coverLetterWordCount = input.coverLetter.trim().split(/\s+/).filter(Boolean).length;
  checks.push({
    id: "cover_letter",
    category: "cover_letter",
    label: "Cover Letter",
    description: "Cover letter should be present and substantive (minimum 80 words recommended)",
    status: coverLetterWordCount >= 100 ? "pass" : coverLetterWordCount >= 50 ? "warn" : "fail",
    detail: coverLetterWordCount > 0
      ? `${coverLetterWordCount} words written`
      : "Cover letter is empty",
    isBlocker: true,
    fixHint: coverLetterWordCount < 80
      ? "Click 'Regenerate' on the cover letter section to generate a tailored letter, then personalize it"
      : undefined,
  });

  const hasCompanyName = input.coverLetter.toLowerCase().includes(input.job.company_name.toLowerCase());
  checks.push({
    id: "cover_letter_personalized",
    category: "cover_letter",
    label: "Cover Letter Personalization",
    description: `Cover letter must specifically mention ${input.job.company_name} to avoid generic rejection`,
    status: hasCompanyName ? "pass" : "warn",
    detail: hasCompanyName
      ? `Company name "${input.job.company_name}" found in letter`
      : `Company name "${input.job.company_name}" not found — letter may appear generic`,
    isBlocker: false,
    fixHint: !hasCompanyName
      ? `Edit your cover letter to explicitly mention ${input.job.company_name} and why you want to join specifically`
      : undefined,
  });

  // ─── 4. SCREENING QUESTION CHECKS ──────────────────────────────────────────

  if (isPortalApp) {
    const s1Words = input.screeningA1.trim().split(/\s+/).filter(Boolean).length;
    checks.push({
      id: "screening_q1",
      category: "screening",
      label: "Screening Q1: Motivation / Why This Company",
      description: "Answer for 'Why do you want to join us?' must be substantive (≥30 words)",
      status: s1Words >= 40 ? "pass" : s1Words >= 20 ? "warn" : "fail",
      detail: s1Words > 0 ? `${s1Words} words` : "Empty — portals reject blank screening answers",
      isBlocker: false,
      fixHint: s1Words < 30 ? "Expand your answer to mention the company mission and how your skills align" : undefined,
    });

    const s2Words = input.screeningA2.trim().split(/\s+/).filter(Boolean).length;
    checks.push({
      id: "screening_q2",
      category: "screening",
      label: "Screening Q2: Technical Experience",
      description: "Technical experience answer must be specific and include concrete examples (≥30 words)",
      status: s2Words >= 40 ? "pass" : s2Words >= 20 ? "warn" : "fail",
      detail: s2Words > 0 ? `${s2Words} words` : "Empty — must be completed before proceeding",
      isBlocker: false,
      fixHint: s2Words < 30 ? "Mention specific technologies, tools, and outcomes with numbers/metrics" : undefined,
    });

    const s3Words = input.screeningA3.trim().split(/\s+/).filter(Boolean).length;
    checks.push({
      id: "screening_q3",
      category: "screening",
      label: "Screening Q3: Complex Project / Achievement",
      description: "Technical achievement answer must demonstrate scope and impact (≥30 words)",
      status: s3Words >= 40 ? "pass" : s3Words >= 20 ? "warn" : "fail",
      detail: s3Words > 0 ? `${s3Words} words` : "Empty — must be completed before proceeding",
      isBlocker: false,
      fixHint: s3Words < 30 ? "Describe a specific project: what problem it solved, your role, and measurable results" : undefined,
    });
  }

  // ─── 5. CHANNEL ENFORCEMENT CHECKS ─────────────────────────────────────────

  if (channelConflict) {
    checks.push({
      id: "channel_conflict",
      category: "channel",
      label: "Application Channel Conflict — Portal Required",
      description: "This job is explicitly set to portal/website application. Email dispatch is blocked.",
      status: "fail",
      detail: channelConflictReason,
      isBlocker: true,
      fixHint: "Switch the application method back to 'Apply via Company Website / Portal'",
    });
  } else if (hasPortalUrl && !hasRecruiterEmail && input.applyMethod === "email") {
    checks.push({
      id: "channel_no_email",
      category: "channel",
      label: "No Recruiter Email — Portal Application Recommended",
      description: "This job has no confirmed recruiter email. Applications sent to unknown addresses are likely lost.",
      status: "warn",
      detail: "No recruiter/contact email on this job record. The portal URL is the verified application method.",
      isBlocker: false,
      fixHint: "Switch to 'Apply via Company Website' and use the portal URL to submit directly",
    });
  } else {
    checks.push({
      id: "channel_ok",
      category: "channel",
      label: "Application Channel",
      description: "Application channel confirmed",
      status: "pass",
      detail: input.applyMethod === "website"
        ? `Portal application via ${getPortalPlatformInfo(input.job.source_url || "")?.name || "career portal"}`
        : `Email dispatch to ${input.job.recruiter_email || input.job.contact_email || "recruiter"}`,
      isBlocker: false,
    });
  }

  // ─── 6. PORTAL-SPECIFIC DOCUMENT CHECKS ────────────────────────────────────

  if (isPortalApp && portalInfo) {
    const jobDesc = (input.job.description || "").toLowerCase();
    const jobReqs = (input.job.requirements || []).join(" ").toLowerCase();
    const jobText = jobDesc + " " + jobReqs;

    const jobRequiresSalary     = jobText.includes("salary expectation") || jobText.includes("compensation") || jobText.includes("remuneration");
    const jobRequiresNotice     = jobText.includes("notice period") || jobText.includes("start date") || jobText.includes("available immediately");
    const jobRequiresNationalId = (portalInfo.region === "kenya" || portalInfo.region === "africa") &&
      (jobText.includes("national id") || jobText.includes("id number") || jobText.includes("passport number"));
    const jobRequiresKraPin     = (portalInfo.region === "kenya" || portalInfo.region === "africa") &&
      (jobText.includes("kra") || jobText.includes("tax compliance") || jobText.includes("pin number"));

    // Kenya-specific: National ID — warn always, blocker only if job explicitly requires it
    if (portalInfo.region === "kenya" || portalInfo.region === "africa") {
      checks.push({
        id: "id_number",
        category: "documents",
        label: "National ID / Passport Number",
        description: "Kenyan portals frequently require National ID or Passport for identity verification",
        status: (input.idNumber || "").replace(/\s/g, "").length >= 6 ? "pass" : (jobRequiresNationalId ? "fail" : "warn"),
        detail: input.idNumber ? `ID: ${input.idNumber}` : `Not provided${jobRequiresNationalId ? " — required by this job" : " (check portal form)"}`,
        isBlocker: jobRequiresNationalId,
        fixHint: "Enter your National ID number in the Personal & Socials tab",
      });

      checks.push({
        id: "kra_pin",
        category: "documents",
        label: "KRA PIN (Tax Compliance Certificate)",
        description: "Required for government, regulated sector and major corporate portals in Kenya",
        status: (input.kraPin || "").replace(/\s/g, "").length >= 8 ? "pass" : (jobRequiresKraPin ? "fail" : "warn"),
        detail: input.kraPin ? `KRA PIN: ${input.kraPin}` : `Not provided${jobRequiresKraPin ? " — required by this job" : " (check portal form)"}`,
        isBlocker: jobRequiresKraPin,
        fixHint: "Enter your KRA PIN in the Personal & Socials tab (format: A0XXXXXXXXK)",
      });
    }

    // Salary expectation — only flag as warn/fail if job explicitly requires it
    checks.push({
      id: "salary_expectation",
      category: "documents",
      label: "Salary Expectation / Benchmark",
      description: jobRequiresSalary
        ? "This job requires salary expectation in the application form"
        : "Salary expectation is optional — leaving blank may disadvantage your application",
      status: (input.salaryExpectation || "").trim().length >= 3 ? "pass" : (jobRequiresSalary ? "fail" : "warn"),
      detail: input.salaryExpectation || (jobRequiresSalary ? "Required — not specified" : "Optional — not specified"),
      isBlocker: jobRequiresSalary,
      fixHint: "Enter your salary expectation in the Eligibility tab (e.g. KES 80,000 – 120,000/month)",
    });

    // Notice period — only warn if job mentions it; never a blocker
    if (jobRequiresNotice || !input.noticePeriod) {
      checks.push({
        id: "notice_period",
        category: "documents",
        label: "Notice Period / Availability",
        description: jobRequiresNotice
          ? "This job's description specifically asks for notice period / earliest start date"
          : "Portal forms commonly ask for notice period",
        status: (input.noticePeriod || "").trim().length >= 3 ? "pass" : "warn",
        detail: input.noticePeriod || "Not specified",
        isBlocker: false,
        fixHint: "Set your notice period in the Eligibility tab (e.g. 'Immediate / 2 Weeks')",
      });
    }
  }


  // ─── 7. PROFILE COMPLETENESS CHECKS ────────────────────────────────────────

  // Compute metrics
  const passCount = checks.filter(c => c.status === "pass").length;
  const warnCount = checks.filter(c => c.status === "warn").length;
  const failCount = checks.filter(c => c.status === "fail").length;
  const blockerFailCount = checks.filter(c => c.status === "fail" && c.isBlocker).length;

  // Weighted score: pass=100pts, warn=50pts, fail=0pts per check
  const totalChecks = checks.length;
  const rawScore = totalChecks > 0
    ? Math.round(((passCount * 100 + warnCount * 50) / (totalChecks * 100)) * 100)
    : 0;
  const readinessScore = Math.min(rawScore, 100);

  return {
    checks,
    passCount,
    warnCount,
    failCount,
    blockerFailCount,
    readinessScore,
    isReadyToProceed: blockerFailCount === 0,
    isPortalApplication: isPortalApp,
    channelConflict,
    channelConflictReason,
  };
}

/**
 * Returns a color class based on readiness score for UI display.
 */
export function getReadinessColor(score: number): string {
  if (score >= 85) return "emerald";
  if (score >= 65) return "amber";
  return "rose";
}

/**
 * Returns a readiness label based on score.
 */
export function getReadinessLabel(score: number, blockerFails: number): string {
  if (blockerFails > 0) return "Not Ready — Blockers Must Be Fixed";
  if (score >= 85) return "Ready to Submit";
  if (score >= 65) return "Review Warnings Before Proceeding";
  return "Incomplete — Address Issues";
}

