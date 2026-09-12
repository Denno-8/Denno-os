import React, { useState, useEffect, useRef } from "react";
import {
  X, CheckCircle2, AlertCircle, FileText, ExternalLink, Sparkles, Send,
  User, Mail, Phone, MapPin, DollarSign, Clock, ShieldCheck, Wand2, RefreshCw,
  Eye, Edit3, ArrowRight, Check, Download, Save, RotateCcw, Copy, Zap, Inbox, Globe,
} from "lucide-react";
import type { Job } from "../types/job.types";
import { useCreateApplication } from "../hooks/useApplications";
import { useCVVersions, useGenerateCVForJob, useUpdateCV } from "../hooks/useCV";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { cvService } from "../services/cv.service";
import CVStyledPreview from "./CVStyledPreview";
import StructuredCVEditor from "./StructuredCVEditor";
import JobPortalPreviewCard from "./JobPortalPreviewCard";
import { extractResponsibilitiesAndRequirements } from "../utils/jobScrutiny";
import { formatCleanSkillsString } from "../utils/skillSanitizer";

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
  const [formTab, setFormTab] = useState<"audit" | "personal" | "legal" | "screening" | "eeoc">("audit");

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
Location: ${location}
LinkedIn: ${linkedinUrl}
GitHub / Portfolio: ${githubUrl}

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
                    <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-900/70 p-1 rounded-xl text-xs overflow-x-auto">
                      {[
                        { id: "audit", label: "📊 AI Scrutiny Audit" },
                        { id: "personal", label: "👤 Personal & Socials" },
                        { id: "legal", label: "💼 Work Eligibility & Sponsorship" },
                        { id: "screening", label: "❓ AI Screening Answers" },
                        { id: "eeoc", label: "🛡️ EEOC Disclosures" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setFormTab(tab.id as any)}
                          className={`px-3 py-1.5 rounded-lg font-extrabold text-[11px] whitespace-nowrap transition-all ${
                            formTab === tab.id
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* ── Sub-Tab Content ── */}

                    {/* TAB 1: Pre-Application AI Scrutiny Audit */}
                    {formTab === "audit" && (
                      <div className="space-y-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <div className="flex items-center justify-between font-extrabold text-slate-900 dark:text-white">
                          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                            <Sparkles size={14} /> AI Application Verdict &amp; Compatibility Analysis
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px]">
                            HIGHLY RECOMMENDED
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                            <div className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300">
                              Extracted Core Requirements:
                            </div>
                            <ul className="space-y-1 pl-4 text-slate-600 dark:text-slate-400 list-disc text-[11px]">
                              {scrutinyData.requirements.slice(0, 3).map((req, i) => (
                                <li key={i}>{req}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                            <div className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300">
                              Key Skill Alignment:
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {(job.required_skills && job.required_skills.length > 0
                                ? job.required_skills
                                : ["Python", "FastAPI", "React", "SQL"]
                              ).map((sk, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 rounded-md text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1"
                                >
                                  <Check size={10} /> {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                          <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-500" />
                          <div>
                            <strong>Pre-Application Scrutiny Summary:</strong> Your profile and attached ATS resume version have been verified against <strong>{job.company_name}</strong>'s role expectations. Candidate data, legal disclosures, and AI screening responses are pre-filled below and ready for dispatch.
                          </div>
                        </div>
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

                {/* Right: Job Portal Preview + Scrutiny */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Live Portal Preview */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="font-extrabold text-xs flex items-center gap-2">
                        <Globe size={13} className="text-blue-400" /> <span>Live Employer Portal Workspace</span>
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
                              const token = localStorage.getItem("token") || "";
                              const res = await fetch(`/api/jobs/${job.id}/autofill-payload`, {
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
                                const token = localStorage.getItem("token") || "";
                                const res = await fetch("/api/jobs/screening-question", {
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
                Step 2 — Live Portal View
                ════════════════════════════════════════════════════════════════ */}
            {activeStep === "portal" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs font-semibold text-blue-800 dark:text-blue-200 flex items-start gap-2">
                  <Copy size={14} className="shrink-0 mt-0.5 text-blue-500" />
                  Your candidate details have been copied to clipboard. Open the portal and paste them into the relevant fields.
                </div>
                <JobPortalPreviewCard job={job} height={480} showChrome />
              </div>
            )}

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

        {/* ── Footer Actions ─────────────────────────────────────────────────── */}
        {activeStep !== "success" && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {activeStep !== "review" && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveStep((s) =>
                      s === "form" ? "portal" : s === "portal" ? "review" : "review"
                    )
                  }
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  Next Step <ArrowRight size={14} />
                </button>
              )}

              {activeStep === "review" && (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto py-3 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting &amp; Verifying Application…</span>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm &amp; Submit Application</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
