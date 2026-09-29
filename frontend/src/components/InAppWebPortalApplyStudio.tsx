import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X, CheckCircle2, AlertCircle, FileText, ExternalLink, Sparkles, Send,
  User, Mail, Phone, MapPin, DollarSign, Clock, ShieldCheck, Wand2, RefreshCw,
  Eye, Edit3, ArrowRight, Check, Download, Save, RotateCcw, Copy, Zap, Inbox, Globe,
  Building2, Briefcase, ListChecks, Info, BookOpen, ChevronDown, ChevronUp,
  Target, Cpu, FileCheck, AlertTriangle, Layers,
} from "lucide-react";
import type { Job } from "../types/job.types";
import { useCreateApplication } from "../hooks/useApplications";
import { useCVVersions, useGenerateCVForJob, useUpdateCV } from "../hooks/useCV";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { cvService } from "../services/cv.service";
import CVStyledPreview from "./CVStyledPreview";
import StructuredCVEditor from "./StructuredCVEditor";
import JobPortalPreviewCard from "./JobPortalPreviewCard";
import {
  extractResponsibilitiesAndRequirements,
  getPortalPlatformInfo,
  getPortalChecklist,
  getPortalRequiredDocuments,
  getPortalTips,
  _extractPortalPlatformFromUrl,
  extractApplicationDeadline,
  analyzeApplicationReadiness,
  getReadinessColor,
  getReadinessLabel,
  analyzeJobApplicationChannel,
  getPortalFormFields,
  extractPortalScreeningQuestions,
  groupPortalFieldsBySection,
  type ReadinessCheck,
  type PortalFormField,
  type PortalScreeningQuestion,
} from "../utils/jobScrutiny";
import { formatCleanSkillsString } from "../utils/skillSanitizer";
import { API_URL, getAccessToken } from "../services/api";

interface InAppWebPortalApplyStudioProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onSuccess?: () => void;
}

export default function InAppWebPortalApplyStudio({
  isOpen,
  onClose,
  job,
  onSuccess,
}: InAppWebPortalApplyStudioProps) {
  const createApplication = useCreateApplication();
  const { data: cvVersions = [] } = useCVVersions();
  const generateCVForJob = useGenerateCVForJob();
  const updateCV = useUpdateCV();
  const { data: currentUser } = useCurrentUser();

  // ── Active step ──────────────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState<"form" | "portal" | "review" | "success">("form");

  // ── Portal platform awareness ────────────────────────────────────────────
  const [portalChecklistChecked, setPortalChecklistChecked] = useState<boolean[]>([]);
  const [showPortalTips, setShowPortalTips] = useState(false);
  const [showAtsProcedures, setShowAtsProcedures] = useState(true);
  const [showReadinessPanel, setShowReadinessPanel] = useState(true);
  const [readinessAcknowledged, setReadinessAcknowledged] = useState(false);

  // ── Derived user defaults (real profile data) ─────────────────────────
  const userFullName =
    currentUser
      ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.email
      : "";
  const userEmail = currentUser?.email || "";
  const userPhone = currentUser?.phone || "";
  const userLocation = currentUser?.location || "";
  const userNoticePeriod = currentUser?.notice_period || "Immediate / 2 Weeks";

  // ── Form state ────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(userFullName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState(userPhone);
  const [location, setLocation] = useState(userLocation);
  const [idNumber, setIdNumber] = useState("38491024");
  const [kraPin, setKraPin] = useState("A019283471K");
  const [highestEducation, setHighestEducation] = useState("Bachelor of Science in Information Security and Forensics");
  const [institutionName, setInstitutionName] = useState("Jomo Kenyatta University of Agriculture and Technology (JKUAT)");
  const [yearsOfExperience, setYearsOfExperience] = useState("3+ Years");
  const [currentEmployer, setCurrentEmployer] = useState("Full-Stack Software Engineer");
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [noticePeriod, setNoticePeriod] = useState(userNoticePeriod);
  const [workAuthorization, setWorkAuthorization] = useState("Authorized / Citizen");
  const [visaSponsorship, setVisaSponsorship] = useState("No - Authorized to work without visa sponsorship");
  const [relocationPreference, setRelocationPreference] = useState("Open to Relocation / Hybrid / Remote");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [eeoGender, setEeoGender] = useState("Decline to disclose");
  const [eeoDisability, setEeoDisability] = useState("No disability");
  const [eeoVeteran, setEeoVeteran] = useState("Not a protected veteran");

  // Custom Screening Questions state (AI solved)
  const [screeningA1, setScreeningA1] = useState("");
  const [screeningA2, setScreeningA2] = useState("");
  const [screeningA3, setScreeningA3] = useState("");
  const [formTab, setFormTab] = useState<"audit" | "portal_form" | "job_screening" | "personal" | "education" | "legal" | "screening" | "eeoc">("audit");

  // Portal form field values map (field.id => value), allows inline editing
  const [portalFieldValues, setPortalFieldValues] = useState<Record<string, string>>({});
  // Screening question answer overrides (question.id => answer)
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});

  const [coverLetter, setCoverLetter] = useState("");
  const [cvVersionId, setCvVersionId] = useState("");

  // ── CV editing state ───────────────────────────────────────────────────
  const [cvViewMode, setCvViewMode] = useState<"preview" | "edit-structured" | "edit-raw">("preview");
  const [editedCVContent, setEditedCVContent] = useState("");
  const [cvSaveMsg, setCvSaveMsg] = useState<string | null>(null);

  // ── Portal / submission state ──────────────────────────────────────────
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [cvNotice, setCvNotice] = useState<string | null>(null);
  const [isPreviewingCV, setIsPreviewingCV] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // ── Sync form defaults when user profile loads or job changes ────────
  useEffect(() => {
    if (!job) return;

    // Update from profile whenever we get fresh profile data
    setFullName(
      currentUser
        ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.email
        : fullName
    );
    setEmail(currentUser?.email || email);
    setPhone(currentUser?.phone || phone);
    setLocation(currentUser?.location || location);
    setNoticePeriod(currentUser?.notice_period || noticePeriod);

    setSalaryExpectation(
      `${job.currency || "KES"} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
    );
    if (cvVersions.length > 0 && !cvVersionId) {
      setCvVersionId(cvVersions[0].id);
    }
    setActiveStep("form");
    setIsAutoFilled(false);
    setSubmitError(null);
    setSubmittedResult(null);
    setCvSaveMsg(null);

    // Set pre-filled custom screening question answers
    const company = job.company_name || "Target Company";
    const topSkill = (job.required_skills && job.required_skills[0]) || "Software Engineering";
    setLinkedinUrl(currentUser?.linkedin || "");
    setGithubUrl(currentUser?.github || "");

    setScreeningA1(
      `I am genuinely excited about the opportunity at ${company} because of your commitment to engineering quality. My practical background in software architecture, system administration, and technical problem-solving aligns directly with your team's goals.`
    );
    setScreeningA2(
      `I have practical experience working with ${topSkill} and related technical systems. I have designed backend APIs, troubleshot infrastructure bottlenecks, and written automated test suites to ensure high uptime.`
    );
    setScreeningA3(
      `In a recent project, I built a high-throughput data processing microservice serving 50,000+ active users. I integrated caching layers and CI/CD pipelines, reducing average response latency by 45%.`
    );

    // Auto-generate Cover Letter tailored for this job
    const cleanSkills = formatCleanSkillsString(
      job.required_skills || [],
      "computer hardware and software troubleshooting, Windows environments, network connectivity, system administration, Microsoft Office, cybersecurity, data management"
    );
    const candidateName = currentUser
      ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.email
      : "Job Applicant";
    const candidatePhone = currentUser?.phone || "";
    const candidateEmail = currentUser?.email || "";
    const candidateLocation = currentUser?.location || "";
    const todayDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const targetTitle = (job.title || "ICT ASSISTANT").toUpperCase();

    const letter = `${candidateName.toUpperCase()}
APPLICATION FOR ${targetTitle}
${candidateLocation} | ${candidatePhone} | ${candidateEmail}

${todayDate}

The Human Resources Manager
${company}
${candidateLocation}

RE: APPLICATION FOR ${targetTitle} POSITION

Dear Human Resources Manager,

I am writing to apply for the ${job.title} position at ${company} in ${candidateLocation}. I have completed my Bachelor of Science in Information Security and Forensics and am eager to apply my technical training and practical experience in a professional ICT support environment.

My background aligns closely with the requirements of the position. I have practical knowledge of ${cleanSkills}, system administration concepts, technical documentation, and supporting security technologies.

Through my practical projects, I have worked with OPNSense firewall, VirtualBox, Kali Linux, Wireshark, Nmap and Suricata. I have configured virtual LAN/WAN environments, investigated connectivity problems, analysed network traffic and explored intrusion detection and security monitoring. I have also developed a Python/Flask and MongoDB cybersecurity application involving authentication, threat analysis, dashboards and reporting.

I am particularly interested in this opportunity because the role combines first-line technical support, hardware and software maintenance, network troubleshooting, user support, IT asset management, backups and information security. These responsibilities match both my technical training and the practical ICT experience I am seeking to build.

I am a reliable, organized and quick-learning individual with strong analytical and problem-solving abilities. I understand the importance of professionalism, confidentiality, accurate documentation and timely support when assisting users. I am comfortable working independently, collaborating with colleagues and escalating complex technical issues when necessary.

I would appreciate the opportunity to contribute to ${company} while developing my professional ICT support and systems administration skills. I am available for an interview at your convenience and would be pleased to provide any additional information required.

Thank you for considering my application. I look forward to the opportunity to discuss my suitability for the position.

Yours faithfully,

${candidateName},
${candidatePhone},
${candidateEmail}.`;
    setCoverLetter(letter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, isOpen]);

  // Sync profile after currentUser loads
  useEffect(() => {
    if (!currentUser) return;
    setFullName(
      `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.email
    );
    setEmail(currentUser.email);
    if (currentUser.phone) setPhone(currentUser.phone);
    if (currentUser.location) setLocation(currentUser.location);
    if (currentUser.notice_period) setNoticePeriod(currentUser.notice_period);
    if (currentUser.linkedin) setLinkedinUrl(currentUser.linkedin);
    if (currentUser.github) setGithubUrl(currentUser.github);
  }, [currentUser]);

  if (!isOpen || !job) return null;

  const selectedCV = cvVersions.find((c) => c.id === cvVersionId);
  const scrutinyData = extractResponsibilitiesAndRequirements(job.description, job.requirements, job.required_skills);
  const jobChannel = analyzeJobApplicationChannel(job);
  const isPortalJobForced = job.apply_method === "website" || job.apply_method === "portal";

  // ── Live Readiness Report ──────────────────────────────────────────
  const readinessReport = analyzeApplicationReadiness({
    fullName,
    email,
    phone,
    location,
    cvVersionId,
    cvAtsScore: selectedCV?.ats_score,
    cvName: selectedCV?.name,
    coverLetter,
    screeningA1,
    screeningA2,
    screeningA3,
    applyMethod: "website",
    job,
    salaryExpectation,
    noticePeriod,
    idNumber,
    kraPin,
  });

  const canProceedToPortal = readinessReport.isReadyToProceed;
  const readinessColor = getReadinessColor(readinessReport.readinessScore);
  const readinessLabel = getReadinessLabel(readinessReport.readinessScore, readinessReport.blockerFailCount);

  // Categorized check lists for display
  const blockerChecks = readinessReport.checks.filter(c => c.status === "fail" && c.isBlocker);
  const warnChecks = readinessReport.checks.filter(c => c.status === "warn");
  const failChecks = readinessReport.checks.filter(c => c.status === "fail" && !c.isBlocker);

  // ── CV actions ─────────────────────────────────────────────────────────
  const handleGenerateTailoredCV = () => {
    setIsGeneratingCV(true);
    setCvNotice(null);
    generateCVForJob.mutate(
      {
        job_title: job.title,
        company_name: job.company_name,
        required_skills: job.required_skills || ["Python", "FastAPI", "React", "PostgreSQL"],
        description: job.description || "",
      },
      {
        onSuccess: (newCV) => {
          setIsGeneratingCV(false);
          setCvVersionId(newCV.id);
          setEditedCVContent(newCV.parsed_content || "");
          setCvNotice(`✓ Tailored CV generated! (${newCV.name} · ${newCV.ats_score}% ATS Compliance)`);
        },
        onError: (err: any) => {
          setIsGeneratingCV(false);
          setCvNotice(`⚠ CV generation failed: ${err.message || "Try again"}`);
        },
      }
    );
  };

  const handleSaveCVEdits = () => {
    if (!selectedCV || !editedCVContent) return;
    updateCV.mutate(
      { id: selectedCV.id, patch: { parsed_content: editedCVContent } },
      {
        onSuccess: () => {
          setCvSaveMsg(`✓ Saved edits to "${selectedCV.name}"`);
          setCvViewMode("preview");
          setTimeout(() => setCvSaveMsg(null), 3000);
        },
      }
    );
  };

  const handleStartCVEdit = (mode: "edit-structured" | "edit-raw") => {
    if (!selectedCV) return;
    setEditedCVContent(selectedCV.parsed_content || "");
    setCvViewMode(mode);
    setIsPreviewingCV(true);
  };

  // ── Auto-fill: copy candidate payload to clipboard ─────────────────────
  const handleAutoFillPortalForm = async () => {
    const payload = `=== CAREER PORTAL CANDIDATE APPLICATION PAYLOAD ===
Full Name: ${fullName}
Email: ${email}
Phone: ${phone}
Location / Residence: ${location}
National ID / Passport: ${idNumber}
KRA PIN (Tax Compliance): ${kraPin}
LinkedIn: ${linkedinUrl}
GitHub / Portfolio: ${githubUrl}

--- EDUCATION & WORK HISTORY ---
Highest Qualification: ${highestEducation}
University / Institution: ${institutionName}
Years of Experience: ${yearsOfExperience}
Current / Recent Role: ${currentEmployer}

--- WORK AUTHORIZATION & AVAILABILITY ---
Work Authorization: ${workAuthorization}
Visa Sponsorship Required: ${visaSponsorship}
Relocation Preference: ${relocationPreference}
Salary Expectation: ${salaryExpectation}
Notice Period / Start Date: ${noticePeriod}

--- CUSTOM SCREENING QUESTION ANSWERS ---
1. Why join ${job.company_name}?:
${screeningA1}

2. Experience with ${job.required_skills?.[0] || "core tech stack"}:
${screeningA2}

3. Complex Technical Project:
${screeningA3}

--- EEOC DISCLOSURES ---
Gender Identity: ${eeoGender}
Disability Status: ${eeoDisability}
Veteran Status: ${eeoVeteran}

--- COVER LETTER ---
${coverLetter}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2500);
    } catch { /* clipboard may be denied */ }
    setIsAutoFilled(true);
    setActiveStep("portal");
  };

  // ── Final submit ───────────────────────────────────────────────────────
  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    setSubmitError(null);

    createApplication.mutate(
      {
        company_name: job.company_name,
        role: job.title,
        stage: "Applied",
        date_applied: new Date().toISOString().slice(0, 10),
        salary_range: salaryExpectation,
        notes: coverLetter,
        recruiter_email: job.contact_email || undefined,
        apply_method: "website",
        source_job_id: job.id,
        source_url: job.source_url || undefined,
        cv_version_id: cvVersionId || undefined,
        match_score: job.match_score || 85,
        ats_score: selectedCV?.ats_score || job.ats_score || 90,
      },
      {
        onSuccess: (res: any) => {
          setIsSubmitting(false);
          setSubmittedResult(res || { company_name: job.company_name, role: job.title });
          setActiveStep("success");
          if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
          setIsSubmitting(false);
          setSubmitError(err.message || "Failed to submit application.");
        },
      }
    );
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white m-0 flex items-center gap-2">
                <span>In-App Application Studio</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                  Full Automation Workspace
                </span>
              </h2>
              <p className="text-xs text-blue-200 mt-0.5 m-0 font-medium">
                {job.title} · {job.company_name} · {job.mode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stepper Tabs */}
            <div className="hidden md:flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
              {(["form", "portal", "review"] as const).map((step, i) => (
                <button
                  key={step}
                  onClick={() => setActiveStep(step)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeStep === step ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {i + 1}. {step === "form" ? "Review & Edit" : step === "portal" ? "Live Portal" : "Confirm & Apply"}
                </button>
              ))}
            </div>

            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Success screen ────────────────────────────────────────────────── */}
        {activeStep === "success" ? (
          <div className="p-8 space-y-6 flex-1 overflow-y-auto text-center my-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white m-0">
                Application Successfully Submitted &amp; Verified!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed m-0">
                Your application for <strong>{job.title}</strong> at <strong>{job.company_name}</strong> has been
                logged in your pipeline under <strong>Applied</strong> stage.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl max-w-md mx-auto text-left flex items-start gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl shrink-0 flex items-center justify-center">
                <Inbox size={16} />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-extrabold text-emerald-900 dark:text-emerald-200">
                  Live Response Listener Active
                </div>
                <div className="text-emerald-700 dark:text-emerald-300 font-medium">
                  The system will automatically listen for recruiter emails arriving at{" "}
                  <strong>{email}</strong> and update your hiring stage in real-time!
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
              >
                Close &amp; View in Pipeline Tracker
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {submitError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 font-bold text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* ── Step tabs (mobile) ─────────────────────────────────────────── */}
            <div className="flex md:hidden bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs gap-1">
              {(["form", "portal", "review"] as const).map((step, i) => (
                <button
                  key={step}
                  onClick={() => setActiveStep(step)}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    activeStep === step
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {i + 1}. {step === "form" ? "Details" : step === "portal" ? "Portal" : "Confirm"}
                </button>
              ))}
            </div>

            {/* ════════════════════════════════════════════════════════════════
                Step 1 — Review & Edit Details
                ════════════════════════════════════════════════════════════════ */}
            {activeStep === "form" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Candidate Profile + CV + Cover Letter */}
                <div className="lg:col-span-7 space-y-4">

                  {/* ── Pre-Application AI Scrutiny & Career Portal Form Simulator ── */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                    {/* Header with AI Audit Verdict */}
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                          <ShieldCheck size={16} className="text-emerald-500" />
                          <span>Pre-Application AI Scrutiny &amp; Candidate Portal Form</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 m-0 font-medium">
                          Comprehensive suitability scrutiny &amp; standard career portal fields pre-populated for fast submission.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 size={12} /> {job.match_score || 88}% Job Fit
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black border border-blue-500/20">
                          {selectedCV?.ats_score || 90}% ATS
                        </span>
                      </div>
                    </div>

                    {/* Sub-Tab Navigation for Portal Forms */}
                    <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-900/70 p-1 rounded-xl text-xs overflow-x-auto shrink-0">
                      {[
                        { id: "audit",          label: "Readiness Gate",           dot: readinessReport.blockerFailCount > 0 ? "rose" : "emerald" },
                        { id: "portal_form",    label: "Portal Form Fields",        dot: "blue" },
                        { id: "job_screening",  label: "Job Screening Q&A",         dot: "violet" },
                        { id: "personal",       label: "Personal & Socials",        dot: null },
                        { id: "education",      label: "Education & Experience",    dot: null },
                        { id: "legal",          label: "Eligibility & Disclosures", dot: null },
                        { id: "eeoc",           label: "EEOC Disclosures",          dot: null },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setFormTab(tab.id as any)}
                          className={`relative px-3 py-1.5 rounded-lg font-extrabold text-[11px] whitespace-nowrap transition-all ${
                            formTab === tab.id
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {tab.label}
                          {tab.dot && (
                            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                              tab.dot === "rose" ? "bg-rose-500" :
                              tab.dot === "emerald" ? "bg-emerald-500" :
                              tab.dot === "blue" ? "bg-blue-400" :
                              "bg-violet-400"
                            }`} />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* ── Sub-Tab Content ── */}

                    {/* TAB 1: Pre-Application AI Readiness Gate */}
                    {formTab === "audit" && (
                      <div className="space-y-3 text-xs">

                        {/* ── Readiness Score Banner ── */}
                        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                          readinessColor === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" :
                          readinessColor === "amber" ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" :
                          "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                        }`}>
                          {/* Score Ring */}
                          <div className="relative w-16 h-16 shrink-0">
                            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                              <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor"
                                className="text-slate-200 dark:text-slate-700" strokeWidth="6" />
                              <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6"
                                stroke={readinessColor === "emerald" ? "#10b981" : readinessColor === "amber" ? "#f59e0b" : "#f43f5e"}
                                strokeDasharray={`${(readinessReport.readinessScore / 100) * 163.4} 163.4`}
                                strokeLinecap="round" />
                            </svg>
                            <span className={`absolute inset-0 flex items-center justify-center font-extrabold text-sm ${
                              readinessColor === "emerald" ? "text-emerald-700 dark:text-emerald-300" :
                              readinessColor === "amber" ? "text-amber-700 dark:text-amber-300" :
                              "text-rose-700 dark:text-rose-300"
                            }`}>{readinessReport.readinessScore}%</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-extrabold text-sm ${
                              readinessColor === "emerald" ? "text-emerald-800 dark:text-emerald-200" :
                              readinessColor === "amber" ? "text-amber-800 dark:text-amber-200" :
                              "text-rose-800 dark:text-rose-200"
                            }`}>{readinessLabel}</div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                <CheckCircle2 size={11} /> {readinessReport.passCount} passed
                              </span>
                              {readinessReport.warnCount > 0 && (
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                                  <AlertTriangle size={11} /> {readinessReport.warnCount} warnings
                                </span>
                              )}
                              {readinessReport.failCount > 0 && (
                                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                                  <AlertCircle size={11} /> {readinessReport.failCount} failed
                                </span>
                              )}
                            </div>
                            {readinessReport.blockerFailCount > 0 && (
                              <div className="mt-1.5 text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                                {readinessReport.blockerFailCount} blocker{readinessReport.blockerFailCount > 1 ? "s" : ""} must be resolved before advancing to the portal.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ── Channel Conflict Hard Block ── */}
                        {readinessReport.channelConflict && (
                          <div className="p-3 bg-rose-100 dark:bg-rose-950 border-2 border-rose-500 rounded-2xl flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                              <AlertTriangle size={16} />
                            </div>
                            <div>
                              <div className="font-extrabold text-rose-800 dark:text-rose-200 text-xs">PORTAL APPLICATION REQUIRED — EMAIL DISPATCH BLOCKED</div>
                              <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">{readinessReport.channelConflictReason}</div>
                            </div>
                          </div>
                        )}

                        {/* ── Blocker Checks (Red) ── */}
                        {blockerChecks.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[10px]">
                              <AlertCircle size={12} /> Blockers — Must Fix Before Proceeding
                            </div>
                            {blockerChecks.map((chk) => (
                              <div key={chk.id} className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle size={13} className="text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                      <div className="font-extrabold text-rose-800 dark:text-rose-200">{chk.label}</div>
                                      <div className="text-rose-600 dark:text-rose-400">{chk.detail}</div>
                                    </div>
                                  </div>
                                </div>
                                {chk.fixHint && (
                                  <div className="ml-5 flex items-start gap-1.5 text-rose-700 dark:text-rose-300">
                                    <ArrowRight size={10} className="shrink-0 mt-0.5" />
                                    <span>Fix: {chk.fixHint}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ── Warning Checks (Amber) ── */}
                        {warnChecks.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider text-[10px]">
                              <AlertTriangle size={12} /> Warnings — Review Before Submitting
                            </div>
                            {warnChecks.map((chk) => (
                              <div key={chk.id} className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                                  <div>
                                    <div className="font-extrabold text-amber-800 dark:text-amber-200">{chk.label}</div>
                                    <div className="text-amber-700 dark:text-amber-400">{chk.detail}</div>
                                  </div>
                                </div>
                                {chk.fixHint && (
                                  <div className="ml-5 flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
                                    <ArrowRight size={10} className="shrink-0 mt-0.5" />
                                    <span>Tip: {chk.fixHint}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ── Passed Checks (Collapsed) ── */}
                        {readinessReport.passCount > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-[10px]">
                              <CheckCircle2 size={12} /> Passed Checks ({readinessReport.passCount})
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                              {readinessReport.checks.filter(c => c.status === "pass").map((chk) => (
                                <div key={chk.id} className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-lg">
                                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{chk.label}</span>
                                  {chk.detail && <span className="text-emerald-600 dark:text-emerald-400 ml-auto text-[10px]">{chk.detail}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Job Requirements Alignment ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                            <div className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <ListChecks size={12} className="text-blue-500" /> Extracted Requirements:
                            </div>
                            <ul className="space-y-1 pl-4 text-slate-600 dark:text-slate-400 list-disc text-[11px]">
                              {scrutinyData.requirements.slice(0, 4).map((req, i) => (
                                <li key={i}>{req}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                            <div className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Target size={12} className="text-emerald-500" /> Matched Skills:
                            </div>
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {(job.required_skills && job.required_skills.length > 0
                                ? job.required_skills
                                : ["Python", "FastAPI", "React", "SQL"]
                              ).map((sk, i) => (
                                <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 rounded-md text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                                  <Check size={9} /> {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* ── Proceed Gate Confirmation ── */}
                        {canProceedToPortal ? (
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-2">
                            <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-500" />
                            <div>
                              <div className="font-extrabold text-emerald-800 dark:text-emerald-200">All critical requirements met — ready to advance to portal!</div>
                              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                                Your profile, CV, cover letter and screening answers have been verified. Click <strong>Next Step</strong> to open the live portal with your payload pre-loaded.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2">
                            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
                            <div>
                              <div className="font-extrabold text-rose-800 dark:text-rose-200">Cannot advance — {readinessReport.blockerFailCount} blocker{readinessReport.blockerFailCount > 1 ? "s" : ""} must be resolved</div>
                              <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                                Fix the red items above by switching to the relevant tab (Personal, CV, Cover Letter, or Screening Answers).
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: Personal & Social Links */}
                    {formTab === "personal" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <User size={12} /> Full Name
                          </label>
                          <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <Mail size={12} /> Email Address
                          </label>
                          <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <Phone size={12} /> Phone Number
                          </label>
                          <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <MapPin size={12} /> Location / Residence
                          </label>
                          <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <Globe size={12} /> LinkedIn Profile URL
                          </label>
                          <input
                            value={linkedinUrl}
                            onChange={(e) => setLinkedinUrl(e.target.value)}
                            placeholder="https://linkedin.in/in/username"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <Globe size={12} /> GitHub / Portfolio URL
                          </label>
                          <input
                            value={githubUrl}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            placeholder="https://github.com/username"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <ShieldCheck size={12} /> National ID / Passport Number
                          </label>
                          <input
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            placeholder="e.g. 38491024"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <ShieldCheck size={12} /> KRA PIN (Kenyan Employer Compliance)
                          </label>
                          <input
                            value={kraPin}
                            onChange={(e) => setKraPin(e.target.value)}
                            placeholder="e.g. A019283471K"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB 3: Education & Work History */}
                    {formTab === "education" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <FileText size={12} /> Highest Qualification / Degree
                          </label>
                          <input
                            value={highestEducation}
                            onChange={(e) => setHighestEducation(e.target.value)}
                            placeholder="e.g. BSc Computer Science / Cybersecurity"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <Building2 size={12} /> University / Institution Name
                          </label>
                          <input
                            value={institutionName}
                            onChange={(e) => setInstitutionName(e.target.value)}
                            placeholder="e.g. JKUAT / University of Nairobi"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <Clock size={12} /> Relevant Years of Technical Experience
                          </label>
                          <input
                            value={yearsOfExperience}
                            onChange={(e) => setYearsOfExperience(e.target.value)}
                            placeholder="e.g. 3+ Years"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <Briefcase size={12} /> Current / Recent Organization & Role
                          </label>
                          <input
                            value={currentEmployer}
                            onChange={(e) => setCurrentEmployer(e.target.value)}
                            placeholder="e.g. Full-Stack Software Engineer"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB 3: Work Eligibility & Sponsorship */}
                    {formTab === "legal" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <ShieldCheck size={12} /> Work Authorization Status
                          </label>
                          <select
                            value={workAuthorization}
                            onChange={(e) => setWorkAuthorization(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs"
                          >
                            <option value="Authorized / Citizen">Authorized / Citizen / Permanent Resident</option>
                            <option value="Work Permit Held">Valid Work Permit Held</option>
                            <option value="Student Visa">Student Visa (OPT/CPT)</option>
                            <option value="Requires Authorization">Requires Work Authorization</option>
                          </select>
                        </div>

                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <ShieldCheck size={12} /> Visa Sponsorship Requirement
                          </label>
                          <select
                            value={visaSponsorship}
                            onChange={(e) => setVisaSponsorship(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs"
                          >
                            <option value="No - Authorized to work without visa sponsorship">No — Do not require visa sponsorship now or in future</option>
                            <option value="Yes - Will require sponsorship">Yes — Require visa sponsorship now or in future</option>
                          </select>
                        </div>

                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <MapPin size={12} /> Relocation Preference
                          </label>
                          <select
                            value={relocationPreference}
                            onChange={(e) => setRelocationPreference(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs"
                          >
                            <option value="Open to Relocation / Hybrid / Remote">Open to Relocation / Hybrid / Remote</option>
                            <option value="Remote Only">Remote Only</option>
                            <option value="On-site Preferred">On-site Preferred</option>
                            <option value="Relocation Assistance Requested">Open to Relocation with Assistance</option>
                          </select>
                        </div>

                        <div>
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <DollarSign size={12} /> Salary Benchmark Expectation
                          </label>
                          <input
                            value={salaryExpectation}
                            onChange={(e) => setSalaryExpectation(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                            <Clock size={12} /> Notice Period / Availability
                          </label>
                          <input
                            value={noticePeriod}
                            onChange={(e) => setNoticePeriod(e.target.value)}
                            placeholder="e.g. Immediate / 2 Weeks Notice"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB: Portal Form Fields — all fields the portal will ask, pre-filled */}
                    {formTab === "portal_form" && (() => {
                      const candidateProfile = {
                        fullName, email, phone, location, linkedinUrl, githubUrl,
                        highestEducation, institutionName, yearsOfExperience,
                        currentEmployer, salaryExpectation, noticePeriod,
                        workAuthorization, visaSponsorship, relocationPreference,
                        idNumber, kraPin, eeoGender, eeoDisability, eeoVeteran,
                      };
                      const allFields = getPortalFormFields(job.source_url || "", candidateProfile);
                      const grouped = groupPortalFieldsBySection(allFields);

                      const sectionMeta: Record<string, { label: string; icon: string; color: string }> = {
                        personal:    { label: "Personal Details",         icon: "👤", color: "blue" },
                        education:   { label: "Education & Qualifications",icon: "🎓", color: "violet" },
                        experience:  { label: "Work Experience",           icon: "💼", color: "indigo" },
                        eligibility: { label: "Eligibility & Availability",icon: "✅", color: "emerald" },
                        salary:      { label: "Salary Expectation",        icon: "💰", color: "amber" },
                        documents:   { label: "Required Documents",        icon: "📎", color: "rose" },
                        eeoc:        { label: "EEO / Diversity Disclosures",icon: "⚖️", color: "slate" },
                      };

                      const fieldClass = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold outline-none focus:border-blue-500 text-xs transition-colors";

                      const getValue = (field: PortalFormField) =>
                        portalFieldValues[field.id] ?? field.defaultValue ?? "";

                      const setValue = (id: string, val: string) =>
                        setPortalFieldValues(prev => ({ ...prev, [id]: val }));

                      const requiredFields = allFields.filter(f => f.required);
                      const filledRequired = requiredFields.filter(f => getValue(f).trim().length > 0);
                      const completionPct = requiredFields.length > 0
                        ? Math.round((filledRequired.length / requiredFields.length) * 100) : 100;

                      return (
                        <div className="space-y-4 text-xs">
                          {/* Header with completion */}
                          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl">
                            <div>
                              <div className="font-extrabold text-blue-800 dark:text-blue-200">Portal Application Form — Pre-filled</div>
                              <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                                {filledRequired.length}/{requiredFields.length} required fields completed · Copy values into the portal form
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative w-10 h-10">
                                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                                  <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" className="text-blue-200 dark:text-blue-800" strokeWidth="4" />
                                  <circle cx="20" cy="20" r="16" fill="none" strokeWidth="4"
                                    stroke={completionPct === 100 ? "#10b981" : "#3b82f6"}
                                    strokeDasharray={`${(completionPct / 100) * 100.5} 100.5`}
                                    strokeLinecap="round" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center font-extrabold text-[10px] text-blue-700 dark:text-blue-300">{completionPct}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Sections */}
                          {(Object.entries(sectionMeta) as [PortalFormField["section"], typeof sectionMeta[string]][]).map(([section, meta]) => {
                            const sectionFields = grouped[section];
                            if (!sectionFields || sectionFields.length === 0) return null;
                            return (
                              <div key={section} className="space-y-2">
                                {/* Section header */}
                                <div className="flex items-center gap-2 font-extrabold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-1">
                                  <span>{meta.icon}</span>
                                  <span>{meta.label}</span>
                                  <span className="ml-auto text-[10px] font-normal text-slate-400">
                                    {sectionFields.filter(f => f.required).length} required
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {sectionFields.map((field) => {
                                    const val = getValue(field);
                                    const isEmpty = !val.trim();
                                    const hasError = field.required && isEmpty;

                                    return (
                                      <div key={field.id} className={field.type === "textarea" || field.id === "field_of_study" ? "sm:col-span-2" : ""}>
                                        {/* Label row */}
                                        <div className="flex items-center justify-between mb-1">
                                          <label className={`font-semibold flex items-center gap-1 ${
                                            hasError ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
                                          }`}>
                                            {field.label}
                                            {field.required && (
                                              <span className="text-rose-500 font-black">*</span>
                                            )}
                                          </label>
                                          {field.type === "file" ? (
                                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-black rounded">
                                              UPLOAD IN PORTAL
                                            </span>
                                          ) : hasError ? (
                                            <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded flex items-center gap-1">
                                              <AlertCircle size={9} /> REQUIRED
                                            </span>
                                          ) : val ? (
                                            <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded flex items-center gap-1">
                                              <CheckCircle2 size={9} /> FILLED
                                            </span>
                                          ) : null}
                                        </div>

                                        {/* Input */}
                                        {field.type === "file" ? (
                                          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                            <FileText size={13} className="text-blue-400 shrink-0" />
                                            <span>Upload this file directly in the portal form. Use the CV downloaded from the CV Manager above.</span>
                                          </div>
                                        ) : field.type === "select" || field.type === "yesno" ? (
                                          <select
                                            value={val}
                                            onChange={e => setValue(field.id, e.target.value)}
                                            className={`${fieldClass} ${hasError ? "border-rose-400" : ""}`}
                                          >
                                            {!val && <option value="">— Select —</option>}
                                            {field.options?.map(opt => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        ) : field.type === "textarea" ? (
                                          <textarea
                                            rows={3}
                                            value={val}
                                            onChange={e => setValue(field.id, e.target.value)}
                                            placeholder={field.placeholder}
                                            className={`${fieldClass} resize-none ${hasError ? "border-rose-400" : ""}`}
                                          />
                                        ) : (
                                          <input
                                            type={field.type === "url" ? "url" : field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
                                            value={val}
                                            onChange={e => setValue(field.id, e.target.value)}
                                            placeholder={field.placeholder}
                                            className={`${fieldClass} ${hasError ? "border-rose-400" : ""}`}
                                          />
                                        )}

                                        {/* Help text / validation note */}
                                        {(field.helpText || field.validationNote) && (
                                          <div className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
                                            {field.validationNote && (
                                              <span className="text-amber-600 dark:text-amber-400 font-semibold">{field.validationNote}. </span>
                                            )}
                                            {field.helpText}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          {/* Copy to clipboard CTA */}
                          <button
                            type="button"
                            onClick={async () => {
                              const summary = allFields.map(f =>
                                `${f.label}: ${getValue(f) || "(blank)"}`
                              ).join("\n");
                              try { await navigator.clipboard.writeText(summary); } catch {}
                              setCopiedPayload(true);
                              setTimeout(() => setCopiedPayload(false), 2000);
                            }}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                          >
                            <Copy size={13} />
                            {copiedPayload ? "Copied to Clipboard!" : "Copy All Portal Form Values to Clipboard"}
                          </button>
                        </div>
                      );
                    })()}

                    {/* TAB: Job-Specific Screening Questions */}
                    {formTab === "job_screening" && (() => {
                      const candidateProfile = {
                        fullName, email, location, yearsOfExperience,
                        salaryExpectation, noticePeriod,
                        screeningA1, screeningA2, screeningA3,
                      };
                      const questions = extractPortalScreeningQuestions(job, candidateProfile);

                      const categoryMeta: Record<string, { label: string; color: string }> = {
                        motivation:   { label: "Motivation",      color: "blue" },
                        technical:    { label: "Technical",       color: "indigo" },
                        behavioral:   { label: "Behavioural",     color: "violet" },
                        eligibility:  { label: "Eligibility",     color: "emerald" },
                        salary:       { label: "Salary",          color: "amber" },
                        availability: { label: "Availability",    color: "cyan" },
                        experience:   { label: "Experience",      color: "purple" },
                      };

                      const getAnswer = (q: PortalScreeningQuestion) =>
                        screeningAnswers[q.id] ?? q.suggestedAnswer ?? "";

                      const setAnswer = (id: string, val: string) =>
                        setScreeningAnswers(prev => ({ ...prev, [id]: val }));

                      const filledCount = questions.filter(q => getAnswer(q).trim().length > 0).length;

                      return (
                        <div className="space-y-3 text-xs">
                          {/* Header */}
                          <div className="p-3 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-2xl flex items-center justify-between">
                            <div>
                              <div className="font-extrabold text-violet-800 dark:text-violet-200">Job-Specific Portal Screening Questions</div>
                              <div className="text-[11px] text-violet-600 dark:text-violet-400 mt-0.5">
                                {filledCount}/{questions.length} questions answered · Pre-filled from your profile + AI responses
                              </div>
                            </div>
                            <div className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 text-[11px] font-black rounded-lg">
                              {job.company_name}
                            </div>
                          </div>

                          {questions.map((q, idx) => {
                            const answer = getAnswer(q);
                            const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
                            const cat = categoryMeta[q.category] || { label: q.category, color: "slate" };
                            const colorMap: Record<string, string> = {
                              blue:   "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
                              indigo: "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300",
                              violet: "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300",
                              emerald:"bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
                              amber:  "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
                              cyan:   "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300",
                              purple: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
                              slate:  "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                            };

                            return (
                              <div key={q.id} className="p-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                                {/* Question header */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-extrabold text-[10px] shrink-0 mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <div className="font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
                                      {q.question}
                                      {q.required && <span className="text-rose-500 ml-1">*</span>}
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${colorMap[cat.color]}`}>
                                    {cat.label}
                                  </span>
                                </div>

                                {/* Input */}
                                {q.type === "textarea" ? (
                                  <textarea
                                    rows={3}
                                    value={answer}
                                    onChange={e => setAnswer(q.id, e.target.value)}
                                    placeholder="Type your answer here or edit the pre-filled response..."
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-violet-500 font-medium resize-none leading-relaxed"
                                  />
                                ) : q.type === "select" ? (
                                  <select
                                    value={answer}
                                    onChange={e => setAnswer(q.id, e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold outline-none focus:border-violet-500"
                                  >
                                    {!answer && <option value="">— Select —</option>}
                                    {q.options?.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : q.type === "yesno" ? (
                                  <div className="flex gap-2">
                                    {(q.options || ["Yes", "No"]).map(opt => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setAnswer(q.id, opt)}
                                        className={`flex-1 py-2 rounded-xl font-extrabold text-[11px] border transition-all ${
                                          answer === opt
                                            ? opt === "Yes"
                                              ? "bg-emerald-600 text-white border-emerald-600"
                                              : "bg-rose-600 text-white border-rose-600"
                                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={answer}
                                    onChange={e => setAnswer(q.id, e.target.value)}
                                    placeholder="Type your answer..."
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold outline-none focus:border-violet-500"
                                  />
                                )}

                                {/* Footer: word count + help text */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 flex-1">
                                    {q.helpText}
                                  </div>
                                  {q.type === "textarea" && (
                                    <span className={`text-[10px] font-bold shrink-0 ${
                                      wordCount >= 40 ? "text-emerald-600 dark:text-emerald-400" :
                                      wordCount >= 20 ? "text-amber-600 dark:text-amber-400" :
                                      "text-rose-500"
                                    }`}>
                                      {wordCount} words {wordCount < 30 ? "— aim for 30+" : wordCount < 40 ? "— good" : "✓"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Copy all answers */}
                          <button
                            type="button"
                            onClick={async () => {
                              const text = questions.map((q, i) =>
                                `Q${i+1}. ${q.question}\nA: ${getAnswer(q) || "(blank)"}\n`
                              ).join("\n");
                              try { await navigator.clipboard.writeText(text); } catch {}
                              setCopiedPayload(true);
                              setTimeout(() => setCopiedPayload(false), 2000);
                            }}
                            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                          >
                            <Copy size={13} />
                            {copiedPayload ? "Copied!" : "Copy All Q&A Answers to Clipboard"}
                          </button>
                        </div>
                      );
                    })()}

                    {/* TAB 4: AI Screening Question Answers */}
                    {formTab === "screening" && (
                      <div className="space-y-3 text-xs">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>Greenhouse / Lever Standard Portal Questions (AI Pre-Filled):</span>
                          <span className="text-emerald-500 font-bold">✓ Pre-generated by AI</span>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                                1. Why are you interested in joining {job.company_name}?
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setScreeningA1(
                                    `I am drawn to ${job.company_name} because of your commitment to technical innovation and quality. My practical background in system delivery and engineering directly aligns with your goals.`
                                  );
                                }}
                                className="text-[10px] text-blue-600 dark:text-blue-400 font-bold underline flex items-center gap-1"
                              >
                                <Sparkles size={10} /> Regenerate
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={screeningA1}
                              onChange={(e) => setScreeningA1(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                                2. Relevant experience with {(job.required_skills && job.required_skills[0]) || "core tech stack"}:
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const skill = (job.required_skills && job.required_skills[0]) || "core systems";
                                  setScreeningA2(
                                    `I have extensive experience working with ${skill} and building reliable microservices, configuring automated pipelines, and maintaining system stability.`
                                  );
                                }}
                                className="text-[10px] text-blue-600 dark:text-blue-400 font-bold underline flex items-center gap-1"
                              >
                                <Sparkles size={10} /> Regenerate
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={screeningA2}
                              onChange={(e) => setScreeningA2(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                                3. Describe a recent technical accomplishment or challenge solved:
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setScreeningA3(
                                    `Recently, I architected a low-latency API service handling high throughput, reducing response times by over 40% while maintaining robust security and test coverage.`
                                  );
                                }}
                                className="text-[10px] text-blue-600 dark:text-blue-400 font-bold underline flex items-center gap-1"
                              >
                                <Sparkles size={10} /> Regenerate
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={screeningA3}
                              onChange={(e) => setScreeningA3(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 5: EEOC & Diversity Disclosures */}
                    {formTab === "eeoc" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-500 font-semibold mb-1">Gender Identity</label>
                          <select
                            value={eeoGender}
                            onChange={(e) => setEeoGender(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs"
                          >
                            <option value="Decline to disclose">Decline to disclose</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary / Other">Non-binary / Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 font-semibold mb-1">Disability Status</label>
                          <select
                            value={eeoDisability}
                            onChange={(e) => setEeoDisability(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs"
                          >
                            <option value="No disability">No disability</option>
                            <option value="Yes, I have a disability">Yes, I have a disability</option>
                            <option value="Decline to disclose">Decline to disclose</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 font-semibold mb-1">Veteran Status</label>
                          <select
                            value={eeoVeteran}
                            onChange={(e) => setEeoVeteran(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 text-xs"
                          >
                            <option value="Not a protected veteran">Not a protected veteran</option>
                            <option value="I am a protected veteran">I am a protected veteran</option>
                            <option value="Decline to disclose">Decline to disclose</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CV Manager */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={14} className="text-blue-500" /> Attached ATS Resume Version
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateTailoredCV}
                        disabled={isGeneratingCV}
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs hover:bg-emerald-100 transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        {isGeneratingCV ? <RefreshCw size={12} className="animate-spin" /> : <Wand2 size={12} className="text-amber-500" />}
                        <span>{isGeneratingCV ? "Tailoring…" : "Auto-Generate Tailored CV"}</span>
                      </button>
                    </div>

                    {cvNotice && (
                      <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <span>{cvNotice}</span>
                        <button onClick={() => setCvNotice(null)}>✕</button>
                      </div>
                    )}

                    <select
                      value={cvVersionId}
                      onChange={(e) => {
                        setCvVersionId(e.target.value);
                        setIsPreviewingCV(false);
                        setCvViewMode("preview");
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    >
                      <option value="">— Select CV Version —</option>
                      {cvVersions.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.name} {cv.focus ? `· ${cv.focus}` : ""} ({cv.ats_score}% ATS)
                        </option>
                      ))}
                    </select>

                    {selectedCV && (
                      <>
                        <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            ATS Compliance:{" "}
                            <strong className="text-emerald-600 dark:text-emerald-400">{selectedCV.ats_score}%</strong>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsPreviewingCV((p) => !p);
                                setCvViewMode("preview");
                              }}
                              className="text-blue-600 dark:text-blue-400 font-bold underline flex items-center gap-1"
                            >
                              <Eye size={12} /> {isPreviewingCV && cvViewMode === "preview" ? "Hide" : "Preview"}
                            </button>
                             <button
                              type="button"
                              onClick={() => handleStartCVEdit("edit-structured")}
                              className="text-amber-600 dark:text-amber-400 font-bold underline flex items-center gap-1"
                            >
                              <Edit3 size={12} /> Edit Sections
                            </button>
                            <button
                              type="button"
                              onClick={() => cvService.exportPDF(selectedCV.id, "Sapphire", selectedCV.name)}
                              className="text-violet-600 dark:text-violet-400 font-bold underline flex items-center gap-1"
                            >
                              <Download size={12} /> Export PDF
                            </button>
                          </div>
                        </div>

                        {cvSaveMsg && (
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {cvSaveMsg}
                          </div>
                        )}

                        {/* CV view / edit panel */}
                        {isPreviewingCV && (
                          <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 space-y-0">
                            {/* CV toolbar */}
                            <div className="sticky top-0 z-10 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                              {(["preview", "edit-structured", "edit-raw"] as const).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    if (m !== "preview") handleStartCVEdit(m);
                                    else setCvViewMode("preview");
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                    cvViewMode === m
                                      ? "bg-blue-600 text-white"
                                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                  }`}
                                >
                                  {m === "preview" ? "Styled Preview" : m === "edit-structured" ? "Section Editor" : "Raw Text"}
                                </button>
                              ))}
                              {cvViewMode !== "preview" && (
                                <div className="ml-auto flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setCvViewMode("preview")}
                                    className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                                  >
                                    <RotateCcw size={10} /> Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSaveCVEdits}
                                    disabled={updateCV.isPending}
                                    className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <Save size={10} /> {updateCV.isPending ? "Saving…" : "Save"}
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="p-2">
                              {cvViewMode === "preview" && (
                                <CVStyledPreview
                                  content={selectedCV.parsed_content}
                                  name={selectedCV.name}
                                  focus={selectedCV.focus}
                                  skills={selectedCV.skills}
                                  atsScore={selectedCV.ats_score}
                                />
                              )}
                              {cvViewMode === "edit-structured" && (
                                <StructuredCVEditor
                                  content={editedCVContent}
                                  onChange={setEditedCVContent}
                                  showToolbar={false}
                                />
                              )}
                              {cvViewMode === "edit-raw" && (
                                <textarea
                                  value={editedCVContent}
                                  onChange={(e) => setEditedCVContent(e.target.value)}
                                  rows={14}
                                  className="w-full bg-slate-950 text-slate-100 border border-slate-700 text-xs font-mono leading-relaxed rounded-xl px-3 py-2.5 outline-none resize-y"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Cover Letter */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Tailored Application Cover Letter
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const skills = (job.required_skills || []).join(", ");
                          const nm = fullName || "Hiring Committee";
                          setCoverLetter(
                            `Dear Hiring Committee at ${job.company_name},\n\nI am writing to apply for the ${job.title} position. With expertise in ${skills}, I am confident I can make an immediate impact.\n\nBest regards,\n${nm}\n${email} | ${phone}`
                          );
                        }}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 underline flex items-center gap-1"
                      >
                        <Sparkles size={11} /> Regenerate
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs leading-relaxed font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Right: Job Portal Preview + Scrutiny + Portal Intelligence */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Portal Platform Identity Card */}
                  {(() => {
                    const portalUrl = job.source_url || "";
                    const platformInfo = getPortalPlatformInfo(portalUrl);
                    const platformName = _extractPortalPlatformFromUrl(portalUrl);
                    const deadline = extractApplicationDeadline(job.description || "", "");
                    if (!platformName && !platformInfo) return null;
                    return (
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                              <Layers size={14} />
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white text-xs">{platformName || platformInfo?.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{platformInfo?.atsSystem || "Custom Portal"}</div>
                            </div>
                          </div>
                          {platformInfo?.region && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              platformInfo.region === "kenya" ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" :
                              platformInfo.region === "africa" ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" :
                              "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            }`}>
                              {platformInfo.region}
                            </span>
                          )}
                        </div>
                        {platformInfo?.atsNotes && (
                          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-[11px] text-blue-800 dark:text-blue-200 flex items-start gap-2">
                            <Cpu size={12} className="shrink-0 mt-0.5 text-blue-500" />
                            <span>{platformInfo.atsNotes}</span>
                          </div>
                        )}
                        {deadline && (
                          <div className="flex items-center gap-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] text-rose-700 dark:text-rose-300 font-bold">
                            <AlertTriangle size={12} className="text-rose-500 shrink-0" />
                            Deadline: {deadline}
                          </div>
                        )}
                        {platformInfo?.avgResponseDays && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <Clock size={11} className="text-amber-500" />
                            <span>Typical response: <strong className="text-slate-700 dark:text-slate-300">{platformInfo.avgResponseDays} business days</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Live Portal Workspace */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="font-extrabold text-xs flex items-center gap-2">
                        <Globe size={13} className="text-blue-400" /> <span>Portal Auto-Fill Tools</span>
                      </div>
                      {job.source_url && (
                        <a
                          href={job.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={12} /> Open Full Portal
                        </a>
                      )}
                    </div>

                    {/* Auto-Fill Banner */}
                    {/* Auto-Fill & Bookmarklet Section */}
                    <div className="p-3 bg-blue-950/80 border border-blue-800 rounded-xl space-y-2">
                      <div className="text-xs font-bold text-blue-200 flex items-center justify-between">
                        <span>Automated Field Auto-Filler:</span>
                        {isAutoFilled && (
                          <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                            <Check size={12} />
                            {copiedPayload ? "Copied to Clipboard!" : "Fields Auto-Filled"}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleAutoFillPortalForm}
                          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <Copy size={13} className="text-amber-300" />
                          <span>Copy Candidate Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const token = getAccessToken();
                              const res = await fetch(`${API_URL}/jobs/${job.id}/autofill-payload`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.bookmarklet_code) {
                                  await navigator.clipboard.writeText(data.bookmarklet_code);
                                  alert("✦ 1-Click Auto-Fill Bookmarklet Script copied! Paste into browser console on Greenhouse/Lever portal tab to auto-fill.");
                                }
                              }
                            } catch (e) {
                              alert("Copied fallback profile auto-filler.");
                            }
                          }}
                          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <Zap size={13} className="text-amber-300" />
                          <span>Copy 1-Click Bookmarklet</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-blue-300 text-center">
                        Copies structured payload or auto-fill script for Greenhouse, Lever & Workday portals
                      </p>
                    </div>

                    {/* AI Screening Question Solver Panel */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                      <div className="font-extrabold text-blue-400 flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-amber-400" /> AI Screening Question Solver</span>
                        <span className="text-[10px] text-slate-400 font-normal">Greenhouse / Lever Questions</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          id="portalQuestionInput"
                          placeholder="Paste portal question e.g. 'Why join us?'"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              const q = target.value.trim();
                              if (!q) return;
                              try {
                                const token = getAccessToken();
                                const res = await fetch(`${API_URL}/jobs/screening-question`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ question: q, role_title: job.title, company_name: job.company_name })
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  const ansArea = document.getElementById("portalQuestionAnswer");
                                  if (ansArea) ansArea.innerText = data.answer;
                                }
                              } catch { }
                            }
                          }}
                        />
                      </div>
                      <div id="portalQuestionAnswer" className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono leading-relaxed min-h-[40px]">
                        Press Enter in input above to generate instant AI answer tailored for {job.company_name}...
                      </div>
                    </div>

                    {/* Job Requirements Scrutiny */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="font-extrabold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                        <ShieldCheck size={13} className="text-emerald-400" />
                        Job Scrutiny &amp; Key Requirements:
                      </div>
                      <ul className="space-y-1 pl-4 text-slate-400 list-disc text-[11px]">
                        {scrutinyData.requirements.slice(0, 4).map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Job Portal Preview Card */}
                  <JobPortalPreviewCard job={job} height={360} showChrome />
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                Step 2 — Live Portal View + Portal Awareness Intelligence
                ════════════════════════════════════════════════════════════════ */}
            {activeStep === "portal" && (() => {
              const portalUrl = job.source_url || "";
              const platformInfo = getPortalPlatformInfo(portalUrl);
              const platformName = _extractPortalPlatformFromUrl(portalUrl) || platformInfo?.name || "Web Portal";
              const checklist = getPortalChecklist(portalUrl);
              const requiredDocs = getPortalRequiredDocuments(portalUrl);
              const tips = getPortalTips(portalUrl);
              const deadline = extractApplicationDeadline(job.description || "", "");

              // Initialize checkbox state if needed
              if (portalChecklistChecked.length !== checklist.length) {
                // Don't setState here — just render with defaults
              }
              const checked = portalChecklistChecked.length === checklist.length
                ? portalChecklistChecked
                : new Array(checklist.length).fill(false);

              return (
                <div className="space-y-4">
                  {/* ── Payload copied banner ───────────────────────────── */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs font-semibold text-blue-800 dark:text-blue-200 flex items-start gap-2">
                    <Copy size={13} className="shrink-0 mt-0.5 text-blue-500" />
                    <span>Your candidate details have been copied to clipboard. Open the portal below and paste them into the relevant fields as you go.</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* LEFT COLUMN: Portal awareness intelligence */}
                    <div className="lg:col-span-5 space-y-3">

                      {/* Portal Platform Identity Card */}
                      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                              <Globe size={16} />
                            </div>
                            <div>
                              <div className="font-extrabold text-white text-xs">{platformName}</div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {platformInfo?.atsSystem || "Custom / Unknown ATS"}
                              </div>
                            </div>
                          </div>
                          {platformInfo?.region && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              platformInfo.region === "kenya" ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/30" :
                              platformInfo.region === "africa" ? "bg-amber-600/30 text-amber-300 border border-amber-500/30" :
                              "bg-blue-600/30 text-blue-300 border border-blue-500/30"
                            }`}>
                              {platformInfo.region}
                            </span>
                          )}
                        </div>

                        {platformInfo?.atsNotes && (
                          <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-[11px] text-slate-300 flex items-start gap-2">
                            <Cpu size={13} className="shrink-0 mt-0.5 text-blue-400" />
                            <span>{platformInfo.atsNotes}</span>
                          </div>
                        )}

                        {platformInfo?.avgResponseDays && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <Clock size={12} className="text-amber-400" />
                            <span>Avg. response time: <strong className="text-amber-300">{platformInfo.avgResponseDays} business days</strong></span>
                          </div>
                        )}

                        {deadline && (
                          <div className="flex items-center gap-2 p-2 bg-rose-900/40 border border-rose-500/30 rounded-lg text-[11px] text-rose-300 font-bold">
                            <AlertTriangle size={12} className="text-rose-400 shrink-0" />
                            Application Deadline: {deadline}
                          </div>
                        )}

                        {portalUrl && (
                          <a
                            href={portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all"
                          >
                            <ExternalLink size={13} />
                            Open {platformName} Portal in Browser
                          </a>
                        )}
                      </div>

                      {/* Required Documents Checklist */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                          <FileCheck size={14} className="text-violet-500" />
                          Required Documents
                        </div>
                        <ul className="space-y-1.5">
                          {requiredDocs.map((doc, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Portal Optimization Tips */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setShowPortalTips(v => !v)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles size={13} className="text-amber-500" />
                            Portal Optimization Tips
                          </span>
                          {showPortalTips ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        {showPortalTips && (
                          <ul className="space-y-1.5 px-3.5 pb-3">
                            {tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <span className="text-amber-500 font-black shrink-0 mt-0.5">→</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Step-by-step submission procedures + portal preview */}
                    <div className="lg:col-span-7 space-y-3">

                      {/* ATS Submission Procedure */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setShowAtsProcedures(v => !v)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                        >
                          <span className="flex items-center gap-2">
                            <ListChecks size={14} className="text-blue-500" />
                            Step-by-Step Portal Submission Procedure
                          </span>
                          {showAtsProcedures ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        {showAtsProcedures && (
                          <div className="px-4 pb-4 space-y-1.5">
                            {checklist.map((item, i) => (
                              <label
                                key={i}
                                className="flex items-start gap-2.5 cursor-pointer group"
                              >
                                <div
                                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                    checked[i]
                                      ? "bg-emerald-500 border-emerald-500"
                                      : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
                                  }`}
                                  onClick={() => {
                                    const next = [...(portalChecklistChecked.length === checklist.length
                                      ? portalChecklistChecked
                                      : new Array(checklist.length).fill(false))];
                                    next[i] = !next[i];
                                    setPortalChecklistChecked(next);
                                  }}
                                >
                                  {checked[i] && <Check size={10} className="text-white" />}
                                </div>
                                <span className={`text-xs leading-relaxed ${
                                  checked[i]
                                    ? "line-through text-slate-400 dark:text-slate-600"
                                    : "text-slate-700 dark:text-slate-300"
                                }`}>
                                  {item}
                                </span>
                              </label>
                            ))}
                            {/* Progress */}
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                                <span>Submission progress</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  {checked.filter(Boolean).length} / {checklist.length} steps
                                </span>
                              </div>
                              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${(checked.filter(Boolean).length / checklist.length) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Live Portal Preview card */}
                      <JobPortalPreviewCard job={job} height={380} showChrome />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ════════════════════════════════════════════════════════════════
                Step 3 — Review & Confirm
                ════════════════════════════════════════════════════════════════ */}
            {activeStep === "review" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Application Summary */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Application Summary
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden text-xs">
                    {[
                      { label: "Full Name", value: fullName },
                      { label: "Email", value: email },
                      { label: "Phone", value: phone },
                      { label: "Location", value: location },
                      { label: "Salary Expectation", value: salaryExpectation },
                      { label: "Notice Period", value: noticePeriod },
                      { label: "Work Authorization", value: workAuthorization },
                      { label: "CV Version", value: selectedCV ? `${selectedCV.name} (${selectedCV.ats_score}% ATS)` : "None selected" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex px-4 py-2.5 gap-2">
                        <span className="text-slate-500 font-semibold w-32 shrink-0">{label}</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cover Letter Preview */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Cover Letter Preview
                  </h4>
                  <pre className="w-full bg-slate-950 text-slate-200 rounded-2xl p-4 text-[11px] font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto border border-slate-800">
                    {coverLetter || "No cover letter added."}
                  </pre>
                  {selectedCV && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs">
                      <div className="font-bold text-blue-800 dark:text-blue-200">Attached CV:</div>
                      <div className="text-blue-700 dark:text-blue-300 mt-0.5">
                        {selectedCV.name} — {selectedCV.focus || "General"} — {selectedCV.ats_score}% ATS Score
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Footer Actions ──────────────────────────────────────────────── */}
        {activeStep !== "success" && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3 shrink-0">
            {/* Blocker warning bar — only when on form step with issues */}
            {activeStep === "form" && !canProceedToPortal && (
              <div className="flex items-start gap-2.5 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-[11px]">
                <AlertCircle size={13} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-rose-700 dark:text-rose-300">Cannot advance: </span>
                  <span className="text-rose-600 dark:text-rose-400">
                    {blockerChecks.map(c => c.label).join(" · ")} — fix these in the relevant tab above, then return to <strong>AI Scrutiny Audit</strong>.
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Next Step (form → portal) — GATED */}
                {activeStep === "form" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!canProceedToPortal) {
                        setFormTab("audit");
                        return;
                      }
                      handleAutoFillPortalForm();
                    }}
                    title={!canProceedToPortal ? `Fix ${readinessReport.blockerFailCount} blocker(s) before advancing` : "Proceed to Live Portal"}
                    className={`w-full sm:w-auto px-6 py-2.5 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all ${
                      canProceedToPortal
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70"
                    }`}
                  >
                    {canProceedToPortal ? (
                      <><Zap size={14} className="text-amber-300" /> Open Live Portal <ArrowRight size={13} /></>
                    ) : (
                      <><AlertCircle size={14} /> Fix {readinessReport.blockerFailCount} Blocker{readinessReport.blockerFailCount > 1 ? "s" : ""} First</>
                    )}
                  </button>
                )}

                {/* Next Step (portal → review) */}
                {activeStep === "portal" && (
                  <button
                    type="button"
                    onClick={() => setActiveStep("review")}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    Review Application <ArrowRight size={14} />
                  </button>
                )}

                {/* Final Submit — Review step */}
                {activeStep === "review" && (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting || !canProceedToPortal}
                    title={!canProceedToPortal ? "Readiness blockers prevent submission" : "Submit application"}
                    className="w-full sm:w-auto py-3 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><RefreshCw size={14} className="animate-spin" /> Submitting &amp; Verifying…</>
                    ) : (
                      <><CheckCircle2 size={16} /><span>Confirm &amp; Submit Application</span><ArrowRight size={14} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
