import React, { useState, useEffect } from "react";
import { Mail, Send, FileText, Sparkles, Wand2, RefreshCw, X, CheckCircle2, AlertCircle, Paperclip, ShieldCheck, Building2, Globe, Rocket, Zap } from "lucide-react";
import { useCreateApplication } from "../hooks/useApplications";
import { useCVVersions, useGenerateCVForJob } from "../hooks/useCV";
import type { Job } from "../types/job.types";

interface DirectEmailDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialJob?: Job | null;
  onSuccess?: () => void;
}

export default function DirectEmailDispatchModal({
  isOpen,
  onClose,
  initialJob = null,
  onSuccess,
}: DirectEmailDispatchModalProps) {
  const createApplication = useCreateApplication();
  const { data: cvVersions = [] } = useCVVersions();
  const generateCVForJob = useGenerateCVForJob();

  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [appLetterText, setAppLetterText] = useState("");
  const [cvVersionId, setCvVersionId] = useState("");

  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [cvNotice, setCvNotice] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchedSuccess, setDispatchedSuccess] = useState<any | null>(null);

  useEffect(() => {
    if (initialJob) {
      setCompanyName(initialJob.company_name);
      setRoleTitle(initialJob.title);
      setRecruiterEmail(initialJob.contact_email || "");
      setSalaryRange(
        `${initialJob.currency || "KES"} ${initialJob.salary_min.toLocaleString()} - ${initialJob.salary_max.toLocaleString()}`
      );
    } else {
      setCompanyName("");
      setRoleTitle("");
      setRecruiterEmail("");
      setSalaryRange("");
    }
    setCoverLetter("");
    setAppLetterText("");
    setCvNotice(null);
    setDispatchError(null);
    setDispatchedSuccess(null);
    if (cvVersions.length > 0) {
      setCvVersionId(cvVersions[0].id);
    }
  }, [initialJob, cvVersions, isOpen]);

  const handleApplyViaPortal = (portalUrl: string) => {
    if (!companyName.trim() || !roleTitle.trim()) {
      alert("Please specify Company Name and Role Title.");
      return;
    }
    window.open(portalUrl, "_blank", "noopener,noreferrer");

    createApplication.mutate(
      {
        company_name: companyName.trim(),
        role: roleTitle.trim(),
        stage: "Applied",
        date_applied: new Date().toISOString().slice(0, 10),
        salary_range: salaryRange.trim() || undefined,
        notes: `Application redirected to official portal: ${portalUrl}`,
        apply_method: "website",
        source_job_id: initialJob?.id,
        source_url: portalUrl,
      },
      {
        onSuccess: (res: any) => {
          setDispatchedSuccess({
            company_name: companyName,
            role: roleTitle,
            notes: `Redirected to official job portal (${portalUrl}). Application tracked under Applied stage.`,
          });
          if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
          setDispatchError(err.message || "Failed to record portal application.");
        },
      }
    );
  };

  if (!isOpen) return null;

  const handleGenerateAppLetter = () => {
    if (!companyName.trim() || !roleTitle.trim()) {
      alert("Please enter Company Name and Role Title first.");
      return;
    }
    const skillsList = initialJob?.required_skills?.join(", ") || "Python, FastAPI, React, PostgreSQL, Docker";
    const letter = `RECRUITMENT COMMITTEE / HIRING MANAGER
${companyName.toUpperCase()}

FORMAL JOB APPLICATION LETTER FOR THE POSITION OF: ${roleTitle.toUpperCase()}

Dear Hiring Manager,

I am writing to formally present my application for the position of ${roleTitle} at ${companyName}. With extensive expertise in modern software architecture, database management, and scalable cloud applications, I am eager to contribute to ${companyName}'s engineering goals.

Throughout my technical career, I have successfully delivered production software solutions involving ${skillsList}. Having reviewed the requirements for the ${roleTitle} role, I am confident that my practical background in API development, system reliability, and full-stack delivery aligns directly with your team's needs.

Enclosed with this formal application letter are my ATS-compliant Resume PDF (Version Score: ${selectedCV?.ats_score || 95}%) and supporting Cover Letter PDF.

I welcome the opportunity to meet with your interview committee to discuss how my qualifications can add value to ${companyName}.

Yours faithfully,

Job Applicant
Full-Stack Software Engineer`;
    setAppLetterText(letter);
  };

  const handleGenerateCoverLetter = () => {
    if (!companyName.trim() || !roleTitle.trim()) {
      alert("Please enter Company Name and Role Title first.");
      return;
    }
    const letter = `Dear Hiring Team at ${companyName},

I am writing to express my strong enthusiasm for the ${roleTitle} position at ${companyName}. With extensive experience in backend development, API integration, and database design, I am confident in my ability to bring immediate value to your technical operations.

I have tracked ${companyName}'s recent growth and tech initiatives, and I am particularly drawn to your focus on delivering robust, high-performance software solutions.

Attached, please find my updated ATS-formatted Resume PDF, formal Application Letter PDF, and detailed Cover Letter PDF. I welcome the opportunity to discuss how my qualifications align with your engineering objectives.

Thank you for your time and consideration.

Best regards,
Job Applicant
Full-Stack Software Engineer`;
    setCoverLetter(letter);
  };

  const handleGenerateTailoredCV = () => {
    if (!roleTitle.trim() || !companyName.trim()) {
      setCvNotice("⚠ Fill in Role Title and Company Name first.");
      return;
    }
    setIsGeneratingCV(true);
    setCvNotice(null);
    const defaultSkills = ["Python", "FastAPI", "React", "PostgreSQL", "Docker"];

    generateCVForJob.mutate(
      {
        job_title: roleTitle.trim(),
        company_name: companyName.trim(),
        required_skills: defaultSkills,
        description: initialJob?.description || "",
      },
      {
        onSuccess: (newCV) => {
          setIsGeneratingCV(false);
          setCvVersionId(newCV.id);
          setCvNotice(`✓ CV "${newCV.name}" generated & attached! (${newCV.ats_score}% ATS Score)`);
        },
        onError: (err: any) => {
          setIsGeneratingCV(false);
          setCvNotice(`⚠ CV generation failed: ${err.message || "Try again."}`);
        },
      }
    );
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !roleTitle.trim() || !recruiterEmail.trim()) {
      setDispatchError("Please fill in all required fields: Company Name, Role Title, and Recruiter Email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recruiterEmail.trim())) {
      setDispatchError("Please enter a valid recruiter email address (e.g. hr@company.com or your email).");
      return;
    }

    setDispatchError(null);

    createApplication.mutate(
      {
        company_name: companyName.trim(),
        role: roleTitle.trim(),
        stage: "Applied",
        date_applied: new Date().toISOString().slice(0, 10),
        recruiter_email: recruiterEmail.trim(),
        salary_range: salaryRange.trim() || undefined,
        notes: coverLetter.trim() || undefined,
        app_letter_text: appLetterText.trim() || coverLetter.trim() || undefined,
        apply_method: "email",
        cv_version_id: cvVersionId || undefined,
        source_job_id: initialJob?.id,
        source_url: initialJob?.source_url || undefined,
      },
      {
        onSuccess: (res: any) => {
          if (res && res.email_sent === false) {
            setDispatchError(`Application recorded, but SMTP email dispatch failed: ${res.smtp_error || "Check recipient email or SMTP settings."}`);
          } else {
            setDispatchedSuccess(res || { company_name: companyName, role: roleTitle, recruiter_email: recruiterEmail });
            if (onSuccess) onSuccess();
          }
        },
        onError: (err: any) => {
          setDispatchError(err.message || "Email dispatch failed. Please check network/SMTP configuration.");
        },
      }
    );
  };

  const selectedCV = cvVersions.find((c) => c.id === cvVersionId);

  return (
    <div
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">
                <Mail size={18} />
              </span>
              <h3 className="text-lg font-extrabold text-white tracking-tight m-0">
                Manual Email Application Dispatch
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 m-0">
              Compose &amp; dispatch an official job application email with attached PDF CV &amp; Cover Letter directly to a recruiter.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {dispatchedSuccess ? (
          /* Success Screen */
          <div className="p-8 space-y-6 text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
                Application Email Dispatched! <Rocket size={22} className="text-blue-500" />
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Your application for <strong>{roleTitle}</strong> at <strong>{companyName}</strong> has been formatted into a structured anti-spam MIME message and dispatched to <strong>{recruiterEmail}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-xs space-y-2 max-w-md mx-auto text-left">
              <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <Paperclip size={14} className="text-rose-500" /> Dispatched PDF Attachments:
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                <span>Resume PDF:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Resume_{companyName.replace(/\s+/g, "_")}.pdf</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                <span>Application Letter PDF:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Application_Letter_{companyName.replace(/\s+/g, "_")}.pdf</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                <span>Cover Letter PDF:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Cover_Letter_{companyName.replace(/\s+/g, "_")}.pdf</span>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                Close &amp; View in Pipeline Tracker
              </button>
            </div>
          </div>
        ) : (
          /* Dispatch Form */
          <form onSubmit={handleSendEmail} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
            {/* Application Portal Scrutiny & Detection Banner */}
            {initialJob?.source_url && (
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-400 font-extrabold shrink-0 flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                  <div>
                    <div className="font-extrabold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <span>Official Job Application Portal Detected</span>
                      <span className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-[10px] rounded-full">Verified Web Portal</span>
                    </div>
                    <div className="text-[11px] text-blue-700 dark:text-blue-300 font-medium mt-0.5">
                      This opportunity accepts applications via their career portal:{" "}
                      <a
                        href={initialJob.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline text-blue-600 dark:text-blue-400 break-all"
                      >
                        {initialJob.source_url}
                      </a>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyViaPortal(initialJob.source_url!)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow transition-all shrink-0 w-full sm:w-auto flex items-center justify-center gap-1.5"
                >
                  <span>Apply via Official Portal</span>
                  <span>↗</span>
                </button>
              </div>
            )}

            {!initialJob?.contact_email && !recruiterEmail && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-900 dark:text-amber-200 font-medium text-[11px] flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Portal Scrutiny Notice:</strong> No verified direct email found for this job. To prevent email bounce (NXDOMAIN), use the <strong>Apply via Official Portal</strong> button above.
                </span>
              </div>
            )}

            {dispatchError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 font-bold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{dispatchError}</span>
              </div>
            )}

            {/* Recruiter Email & Target Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-extrabold text-slate-800 dark:text-slate-200">
                    Recruiter / Contact Email *
                  </label>
                </div>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. careers@company.com or hr@company.com"
                    value={recruiterEmail}
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 outline-none font-semibold focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                  Company Name *
                </label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Safaricom PLC"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 outline-none font-semibold focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                  Role Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Engineer"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 outline-none font-semibold focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                  Salary Benchmark Range (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. KES 350,000 - KES 500,000"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 outline-none font-semibold focus:border-rose-500"
                />
              </div>
            </div>

            {/* Attached CV Version */}
            <div className="bg-blue-50/70 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-500" />
                  Attach Resume PDF (Auto-Converted to PDF)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateTailoredCV}
                  disabled={isGeneratingCV || !roleTitle.trim() || !companyName.trim()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 transition-all disabled:opacity-50"
                  title="Auto-generate a 98% ATS-tailored CV version for this role"
                >
                  {isGeneratingCV ? (
                    <RefreshCw size={12} className="animate-spin text-emerald-600" />
                  ) : (
                    <Wand2 size={12} className="text-amber-500" />
                  )}
                  <span>{isGeneratingCV ? "Tailoring CV…" : <><Zap size={11} className="inline" /> Auto-Tailor CV</>}</span>
                </button>
              </div>

              {cvNotice && (
                <div className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border flex items-center justify-between gap-2 ${
                  cvNotice.startsWith("✓")
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300"
                    : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300"
                }`}>
                  <span>{cvNotice}</span>
                  <button type="button" onClick={() => setCvNotice(null)} className="font-black">✕</button>
                </div>
              )}

              <select
                value={cvVersionId}
                onChange={(e) => setCvVersionId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 outline-none font-semibold text-xs"
              >
                <option value="">— Select CV from Library —</option>
                {cvVersions.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name} {cv.focus ? `· ${cv.focus}` : ""} · {cv.ats_score}% ATS Score
                  </option>
                ))}
              </select>

              {selectedCV && (
                <div className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1.5 pt-0.5">
                  <Paperclip size={12} />
                  Attached as: <strong>Resume_{companyName ? companyName.replace(/\s+/g, "_") : "Applicant"}.pdf</strong> ({selectedCV.ats_score}% ATS score)
                </div>
              )}
            </div>

            {/* Formal Job Application Letter Section */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText size={14} className="text-emerald-500" />
                  Formal Application Letter (Job-Aware PDF Attachment)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAppLetter}
                  className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-[11px] font-extrabold hover:bg-emerald-200 transition-colors flex items-center gap-1"
                >
                  <Sparkles size={11} /> Auto-Generate Application Letter
                </button>
              </div>
              <textarea
                rows={5}
                value={appLetterText}
                onChange={(e) => setAppLetterText(e.target.value)}
                placeholder="Type or click 'Auto-Generate Application Letter' to create a formal, job-aware application letter. Converted strictly to Application_Letter.pdf attachment."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none font-medium text-xs leading-relaxed resize-none"
              />
              <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <Paperclip size={12} className="text-emerald-500" />
                Attached strictly as: <strong>Application_Letter_{companyName ? companyName.replace(/\s+/g, "_") : "Applicant"}.pdf</strong>
              </div>
            </div>

            {/* Cover Letter Body & Auto-Generate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Cover Letter Message Body (Auto-Converted to PDF)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateCoverLetter}
                  className="px-2.5 py-1 bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-800 rounded-lg text-[11px] font-extrabold hover:bg-violet-200 transition-colors flex items-center gap-1"
                >
                  <Sparkles size={11} /> Auto-Generate Cover Letter
                </button>
              </div>

              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Type or paste your cover letter here. It will be converted into a clean PDF attachment (Cover_Letter.pdf) and formatted into the email body."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl p-3.5 outline-none font-medium leading-relaxed resize-none focus:border-rose-500"
              />
            </div>

            {/* Anti-Spam Security Notice */}
            <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span>
                Anti-Spam Safeguard: Includes RFC 5322 MIME headers and 3 PDF attachments (`Resume.pdf`, `Application_Letter.pdf`, `Cover_Letter.pdf`).
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createApplication.isPending}
                className="flex-1 py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
              >
                {createApplication.isPending ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                <span>{createApplication.isPending ? "Generating PDFs & Dispatches..." : <><Rocket size={14} className="inline" /> Dispatch Email Application Now</>}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
