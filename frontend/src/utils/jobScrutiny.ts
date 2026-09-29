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
  const combined = (description + " " + notes).toLowerCase();
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
