import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, Send, Sparkles, Briefcase, CheckCircle2,
  ExternalLink, FileText, Upload, ChevronDown, AlertTriangle, RefreshCw, Wand2,
  Eye, Edit3, Trash2, Save, RotateCcw, ArrowRight, Mail, Copy, Check, ShieldCheck,
  Globe, ClipboardList, GraduationCap, Zap,
} from "lucide-react";
import type { Job } from "../types/job.types";
import { useCreateApplication } from "../hooks/useApplications";
import { useCVVersions, useCreateCV, useGenerateCVForJob, useUpdateCV, useDeleteCV } from "../hooks/useCV";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { cvService } from "../services/cv.service";
import { analyzeJobApplicationChannel, extractResponsibilitiesAndRequirements } from "../utils/jobScrutiny";
import { formatCleanSkillsString, sanitizeSkillList } from "../utils/skillSanitizer";
import CVStyledPreview from "./CVStyledPreview";
import InAppWebPortalApplyStudio from "./InAppWebPortalApplyStudio";
import StructuredCVEditor from "./StructuredCVEditor";

interface ApplyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onSuccessApply: (jobId: string) => void;
}

export default function ApplyEditModal({ isOpen, onClose, job, onSuccessApply }: ApplyEditModalProps) {
  const navigate = useNavigate();
  const createApplication = useCreateApplication();
  const createCV = useCreateCV();
  const generateCVForJob = useGenerateCVForJob();
  const updateCV = useUpdateCV();
  const deleteCV = useDeleteCV();
  const { data: cvVersions = [] } = useCVVersions();

  const [form, setForm] = useState({
    company_name: "",
    role: "",
    stage: "Applied",
    date_applied: new Date().toISOString().split("T")[0],
    required_skills: "",
    salary_range: "",
    recruiter_email: "",
    notes: "",
    match_score: 85,
    ats_score: 80,
    cv_version_id: "",
  });

  const [applyMethod, setApplyMethod] = useState<"website" | "email">("website");
  const [coverLetter, setCoverLetter] = useState("");
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [generatedCVNotice, setGeneratedCVNotice] = useState<string | null>(null);

  // View & Edit CV inline states
  const [isPreviewingCV, setIsPreviewingCV] = useState(false);
  const [isEditingCV, setIsEditingCV] = useState(false);
  const [editedCVText, setEditedCVText] = useState("");
  const [cvEditMode, setCvEditMode] = useState<"structured" | "raw">("structured");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showStudio, setShowStudio] = useState(false);

  useEffect(() => {
    if (job) {
      const channelInfo = analyzeJobApplicationChannel(job);
      setForm({
        company_name: job.company_name,
        role: job.title,
        stage: "Applied",
        date_applied: new Date().toISOString().split("T")[0],
        required_skills: (job.required_skills || []).join(", "),
        salary_range: `${job.currency || "KES"} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`,
        recruiter_email: channelInfo.targetEmail || job.contact_email || "",
        notes: "",
        match_score: job.match_score || 85,
        ats_score: job.ats_score || 80,
        cv_version_id: cvVersions.length > 0 ? cvVersions[0].id : "",
      });
      setApplyMethod(channelInfo.channel);
      setCoverLetter("");
      setGeneratedCVNotice(null);
      setIsPreviewingCV(false);
      setIsEditingCV(false);
      setSubmitError(null);
      setSubmittedApp(null);
      setCopiedEmail(false);
    }
  }, [job, cvVersions]);

  const { data: currentUser } = useCurrentUser();

  if (!isOpen || !job) return null;

  const hasLiveLink = !!job.source_url && job.source_url.startsWith("http");
  const selectedCV = cvVersions.find((cv) => cv.id === form.cv_version_id);
  const channelInfo = analyzeJobApplicationChannel(job);
  const scrutinyData = extractResponsibilitiesAndRequirements(job.description, job.requirements, job.required_skills);

  const generateCoverLetter = () => {
    const rawSkills = form.required_skills ? form.required_skills.split(",") : job.required_skills;
    const cleanSkills = formatCleanSkillsString(
      rawSkills,
      "computer hardware and software troubleshooting, Windows environments, network connectivity, system administration, Microsoft Office, cybersecurity, data management"
    );
    const candidateName = currentUser
      ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.email
      : "Job Applicant";
    const candidatePhone = currentUser?.phone || "";
    const candidateEmail = currentUser?.email || "";
    const candidateLocation = currentUser?.location || "";
    const todayDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const targetTitle = (form.role || job?.title || "ICT ASSISTANT").toUpperCase();
    const company = form.company_name || job?.company_name || "Target Company";

    const letter = `${candidateName.toUpperCase()}
APPLICATION FOR ${targetTitle}
${candidateLocation} | ${candidatePhone} | ${candidateEmail}

${todayDate}

The Human Resources Manager
${company}
${candidateLocation}

RE: APPLICATION FOR ${targetTitle} POSITION

Dear Human Resources Manager,

I am writing to apply for the ${form.role || "ICT Assistant"} position at ${company} in ${candidateLocation}. I have completed my Bachelor of Science in Information Security and Forensics and am eager to apply my technical training and practical experience in a professional ICT support environment.

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
  };

  const handleGenerateCompliantCV = () => {
    setIsGeneratingCV(true);
    setGeneratedCVNotice(null);

    const skillsSource = form.required_skills || (Array.isArray(job?.required_skills) ? job.required_skills.join(", ") : "");
    let rawSkillsList = skillsSource
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    let skillsList = sanitizeSkillList(rawSkillsList);
    if (skillsList.length === 0) {
      skillsList = ["IT Support & Help Desk", "Hardware & Software Troubleshooting", "Windows & Microsoft 365", "Network Troubleshooting", "TCP/IP & IPv4", "Information Security"];
    }

    const jobTitle = (form.role || job?.title || "").trim() || "Software Engineer";
    const companyName = (form.company_name || job?.company_name || "").trim() || "Tech Company";

    generateCVForJob.mutate(
      {
        job_title: jobTitle,
        company_name: companyName,
        required_skills: skillsList,
        description: job?.description || "",
      },
      {
        onSuccess: (newCV) => {
          setIsGeneratingCV(false);
          setForm((prev) => ({ ...prev, cv_version_id: newCV.id, ats_score: newCV.ats_score || 98 }));
          setGeneratedCVNotice(`✓ Enhanced ATS-Compliant CV generated & attached! (${newCV.name} · ${newCV.ats_score}% ATS Score)`);
          setEditedCVText(newCV.parsed_content || "");
        },
        onError: (err: any) => {
          setIsGeneratingCV(false);
          const detail =
            err?.detail ||
            err?.body?.detail ||
            err?.response?.data?.detail ||
            (err?.message && !err.message.startsWith("API error") ? err.message : null) ||
            "CV generation failed. Please try again.";
          setGeneratedCVNotice(`⚠ ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
        },
      }
    );
  };

  const handleStartEditCV = () => {
    if (!selectedCV) return;
    setEditedCVText(selectedCV.parsed_content || `CV: ${selectedCV.name}\nSkills: ${selectedCV.skills.join(", ")}`);
    setIsEditingCV(true);
    setIsPreviewingCV(false); // collapse preview when opening edit
    setCvEditMode("structured"); // always start with structured editor
  };

  const handleSaveCVEdit = () => {
    if (!selectedCV) return;
    updateCV.mutate(
      { id: selectedCV.id, patch: { parsed_content: editedCVText } },
      {
        onSuccess: () => {
          setIsEditingCV(false);
          setGeneratedCVNotice(`✓ Saved edits to CV "${selectedCV.name}"!`);
        },
      }
    );
  };

  const handleDeleteAttachedCV = () => {
    if (!selectedCV) return;
    if (window.confirm(`Delete CV version "${selectedCV.name}" from library?`)) {
      deleteCV.mutate(selectedCV.id, {
        onSuccess: () => {
          setForm((prev) => ({ ...prev, cv_version_id: "" }));
          setGeneratedCVNotice("CV removed from application.");
          setIsPreviewingCV(false);
          setIsEditingCV(false);
        },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const skillsList = form.required_skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // If applying via official website portal, automatically prepare candidate payload & PDF
    if (applyMethod === "website" && job.source_url?.startsWith("http")) {
      // Build candidate payload using real profile data
      const candidateName = currentUser
        ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.email
        : "Candidate";
      const candidateEmail = currentUser?.email || "";
      const candidatePhone = currentUser?.phone || "";
      const candidateLocation = currentUser?.location || "";

      const copyPayload = `CANDIDATE APPLICATION DETAILS
Name: ${candidateName}
Email: ${candidateEmail}
Phone: ${candidatePhone}
Location: ${candidateLocation}

COVER LETTER:
${coverLetter.trim() || `Dear Hiring Team at ${form.company_name},\n\nI am writing to express my strong enthusiasm for the ${form.role} position at ${form.company_name}.\n\nBest regards,\n${candidateName}`}`;

      try {
        await navigator.clipboard.writeText(copyPayload);
      } catch (e) {
        console.warn("Clipboard copy skipped", e);
      }

      try {
        if (form.cv_version_id) {
          cvService.exportPDF(form.cv_version_id, "Sapphire", `Resume_Dennis_Koech_${form.company_name.replace(/\s+/g, "_")}`);
        }
      } catch (e) {
        console.warn("PDF export skipped", e);
      }

      window.open(job.source_url, "_blank", "noopener,noreferrer");
    }

    createApplication.mutate(
      {
        company_name: form.company_name,
        role: form.role,
        stage: form.stage as any,
        date_applied: form.date_applied,
        required_skills: skillsList,
        salary_range: form.salary_range,
        recruiter_email: form.recruiter_email,
        notes: coverLetter || form.notes || undefined,
        match_score: form.match_score,
        ats_score: form.ats_score,
        source_job_id: job.id,
        source_url: job.source_url || undefined,
        apply_method: applyMethod,
        cv_version_id: form.cv_version_id || undefined,
      },
      {
        onSuccess: (createdApp: any) => {
          setSubmittedApp(createdApp || { id: "new", ...form, apply_method: applyMethod });
          onSuccessApply(job.id);
        },
        onError: (err: any) => {
          setSubmitError(err?.message || "Failed to submit application. Due date may have passed.");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <Briefcase size={18} />
            </div>
            <div>
              <h2 style={{ color: "#ffffff" }} className="text-base font-bold text-white flex items-center gap-2 m-0">
                Confirm &amp; Submit Application
                <Sparkles size={14} className="text-amber-400" />
              </h2>
              <p style={{ color: "#cbd5e1" }} className="text-[11px] text-slate-300 mt-0.5 m-0">
                {job.title} · {job.company_name} · {job.mode}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasLiveLink && (
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#93c5fd" }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-300 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/50 rounded-lg transition-all"
                title="Open the original job listing"
              >
                <ExternalLink size={12} />
                View Listing
              </a>
            )}
            <button
              onClick={onClose}
              style={{ color: "#cbd5e1" }}
              className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors"
              title="Cancel and close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Submit Error / Deadline Lock Alert Banner ── */}
        {submitError && (
          <div className="bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-800 px-5 py-3 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-500" />
              <span>{submitError}</span>
            </div>
            <button onClick={() => setSubmitError(null)} className="text-rose-500 hover:text-rose-700 font-extrabold text-sm">×</button>
          </div>
        )}

        {submittedApp ? (
          /* ── Application Success Confirmation Screen ── */
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0">Application Successfully Submitted &amp; Saved!</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto m-0">
                {applyMethod === "email"
                  ? `Official application email dispatched to recruiter (${form.recruiter_email || "recruiter"}) with attached Cover Letter PDF & Resume PDF!`
                  : `Your application for ${form.role} at ${form.company_name} has been logged into your pipeline via company career portal.`
                }
              </p>
              <div className="pt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
                {applyMethod === "email" ? <><Mail size={11} /> Dispatched via Recruiter Email</> : <><Globe size={11} /> Applied via Company Career Portal</>}
              </div>
            </div>

            {/* Details Summary Grid */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 font-semibold block">Target Role</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{form.role}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Company</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{form.company_name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-500 font-semibold block">Pipeline Stage</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">{form.stage}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">ATS Match Score</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{form.ats_score}% ATS Compliant</span>
                </div>
              </div>

              {selectedCV && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 font-semibold block">Attached CV Snapshot</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedCV.name} ({selectedCV.focus || "General Profile"})</span>
                </div>
              )}

              {form.recruiter_email && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 font-semibold block">Recruiter Contact</span>
                    <span className="font-bold text-slate-900 dark:text-white">{form.recruiter_email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(form.recruiter_email);
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-[11px] text-blue-600 flex items-center gap-1"
                  >
                    {copiedEmail ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {copiedEmail ? "Copied!" : "Copy Email"}
                  </button>
                </div>
              )}
            </div>

            {/* Next Steps / Actions */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Next Actions:</div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/applications");
                  }}
                  className="w-full sm:flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Briefcase size={15} />
                  <span>Go to Applications Pipeline &rarr;</span>
                </button>

                {hasLiveLink && (
                  <a
                    href={job.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={15} />
                    <span>Open External Listing (Optional)</span>
                  </a>
                )}
              </div>
            </div>

            <div className="pt-3 text-right">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── No live link warning ── */}
            {!hasLiveLink && (
              <div className="mx-5 mt-4 flex items-center gap-2 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-xs font-semibold shrink-0">
                <AlertTriangle size={13} className="shrink-0" />
                This job has no live listing URL. It may be from a seeded/manual source.
              </div>
            )}

            {/* ── AI Channel Detection Badge ── */}
            <div className="mx-5 mt-3 p-3 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg font-bold shrink-0 flex items-center justify-center">
                    {channelInfo.channel === "email" ? <Mail size={13} /> : <Globe size={13} />}
                  </div>
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>AI Channel Detection: {channelInfo.channel === "email" ? "Direct Recruiter Email Application" : "Official Web Portal Application"}</span>
                  </div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                    {channelInfo.reason}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                channelInfo.channel === "email" ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              }`}>
                {channelInfo.channel}
              </span>
            </div>

            {/* ── Job Responsibilities & Requirements Scrutiny Panel ── */}
            <div className="mx-5 mt-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setShowFullDesc((p) => !p)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-blue-500" />
                  <span>Job Requirements &amp; Responsibilities Scrutiny</span>
                </span>
                <ChevronDown size={14} className={`transition-transform ${showFullDesc ? "rotate-180" : ""}`} />
              </button>

              {showFullDesc && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-700/60 space-y-3 text-xs">
                  {/* Responsibilities */}
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <ClipboardList size={12} className="text-blue-500" /> Key Responsibilities &amp; Tasks:
                    </div>
                    <ul className="space-y-1 pl-4 text-slate-700 dark:text-slate-300 list-disc">
                      {scrutinyData.responsibilities.map((resp, i) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Requirements */}
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <GraduationCap size={12} className="text-violet-500" /> Key Requirements &amp; Qualifications:
                    </div>
                    <ul className="space-y-1 pl-4 text-slate-700 dark:text-slate-300 list-disc">
                      {scrutinyData.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm flex-1">

          {/* ── Application Channel Selector (Website vs Email Dispatch) ── */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Application Method / Channel *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setApplyMethod("website")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  applyMethod === "website"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-bold"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <ExternalLink size={14} className={applyMethod === "website" ? "text-white" : "text-blue-500"} />
                  <span>Apply via Company Website</span>
                </div>
                <div className={`text-[10px] mt-1 ${applyMethod === "website" ? "opacity-90" : "text-slate-400"}`}>
                  Track application submitted on employer career website/portal.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setApplyMethod("email")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  applyMethod === "email"
                    ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20 font-bold"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400"
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Mail size={14} className={applyMethod === "email" ? "text-white" : "text-rose-500"} />
                  <span>Dispatch via Recruiter Email</span>
                </div>
                <div className={`text-[10px] mt-1 ${applyMethod === "email" ? "opacity-90" : "text-slate-400"}`}>
                  Dispatches HTML email with PDF Resume & Cover Letter attachments.
                </div>
              </button>
            </div>

            {applyMethod === "website" && (
              <div className="p-3.5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md border border-slate-800">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-blue-600 text-white rounded-xl font-bold shrink-0 flex items-center justify-center">
                    <Zap size={14} />
                  </div>
                  <div>
                    <div className="font-extrabold text-white flex items-center gap-1.5">
                      <span>In-App Application Studio Ready</span>
                    </div>
                    <div className="text-[11px] text-blue-200 font-medium mt-0.5">
                      Auto-fill requirements, generate ATS CV &amp; submit directly inside the platform!
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStudio(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-lg transition-all shrink-0 w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs"
                >
                  <span>Launch In-App Application Studio</span>
                  <Zap size={13} />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
              <input
                required
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role Title</label>
              <input
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Pipeline Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm"
              >
                <option value="Applied">Applied</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Assessment">Assessment</option>
                <option value="Technical">Technical Interview</option>
                <option value="HR Interview">HR Interview</option>
                <option value="Final Interview">Final Round</option>
                <option value="Offer">Offer Received</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Application Date</label>
              <input
                type="date"
                required
                value={form.date_applied}
                onChange={(e) => setForm({ ...form, date_applied: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Recruiter Email</label>
              <input
                type="email"
                value={form.recruiter_email}
                onChange={(e) => setForm({ ...form, recruiter_email: e.target.value })}
                placeholder="recruiter@company.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Salary Range</label>
              <input
                value={form.salary_range}
                onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Required Skills (Comma separated)</label>
            <input
              value={form.required_skills}
              onChange={(e) => setForm({ ...form, required_skills: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* ── CV Selector & Compliant CV Controls (View, Edit, Delete, Generate) ── */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText size={12} className="text-blue-500" />
                Attached CV Version
              </label>
              <button
                type="button"
                onClick={handleGenerateCompliantCV}
                disabled={isGeneratingCV}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Create a tailored CV version optimized for 95%+ ATS compliance with this specific job"
              >
                {isGeneratingCV ? (
                  <RefreshCw size={12} className="animate-spin text-emerald-600" />
                ) : (
                  <Wand2 size={12} className="text-amber-500" />
                )}
                <span>{isGeneratingCV ? "Tailoring CV…" : "Auto-Generate Compliant CV"}</span>
              </button>
            </div>

            {generatedCVNotice && (
              <div className={`mb-2 text-xs font-bold p-2.5 rounded-xl flex items-center justify-between border ${
                generatedCVNotice.startsWith("⚠") || generatedCVNotice.toLowerCase().includes("failed") || generatedCVNotice.toLowerCase().includes("error")
                  ? "bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                  : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
              }`}>
                <div className="flex items-center gap-2">
                  {generatedCVNotice.startsWith("⚠") || generatedCVNotice.toLowerCase().includes("failed") || generatedCVNotice.toLowerCase().includes("error") ? (
                    <AlertTriangle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                  )}
                  <span>{generatedCVNotice}</span>
                </div>
                <button type="button" onClick={() => setGeneratedCVNotice(null)} className="text-xs font-black">✕</button>
              </div>
            )}

            {cvVersions.length === 0 ? (
              <div className="flex justify-between items-center text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Upload size={13} />
                  No saved CV versions.
                </div>
                <button
                  type="button"
                  onClick={handleGenerateCompliantCV}
                  className="font-bold text-blue-600 dark:text-blue-400 underline"
                >
                  Click here to generate one now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* CV Selection Dropdown */}
                <select
                  value={form.cv_version_id}
                  onChange={(e) => {
                    setForm({ ...form, cv_version_id: e.target.value });
                    setIsPreviewingCV(false);
                    setIsEditingCV(false);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm font-semibold"
                >
                  <option value="">— Select Attached CV Version —</option>
                  {cvVersions.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.name} {cv.focus ? `· ${cv.focus}` : ""} · ATS {cv.ats_score}%
                    </option>
                  ))}
                </select>

                {/* ── CV Manager Styled Attached Card ── */}
                {selectedCV && (
                  <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-xs animate-fade-in">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white m-0">
                            {selectedCV.name}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-300 dark:border-emerald-800">
                            {selectedCV.ats_score}% ATS
                          </span>
                        </div>
                        {/* Target focus label removed per user preference */}
                      </div>

                      {/* CV Manager Action Toolbar */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => { setIsPreviewingCV((p) => !p); setIsEditingCV(false); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                            isPreviewingCV
                              ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200"
                          }`}
                          title="View CV content"
                        >
                          <Eye size={14} />
                          <span>{isPreviewingCV ? "Hide Preview" : "View"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleStartEditCV}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                            isEditingCV
                              ? "bg-amber-600 text-white border-amber-600 hover:bg-amber-700 shadow-sm"
                              : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                          }`}
                          title="Edit CV content inline"
                        >
                          <Edit3 size={14} />
                          <span>{isEditingCV ? "Editing…" : "Edit"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDeleteAttachedCV}
                          className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-rose-100 transition-colors"
                          title="Delete CV version from library"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setForm({ ...form, cv_version_id: "" })}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline ml-1"
                          title="Detach CV from this application"
                        >
                          Detach
                        </button>
                      </div>
                    </div>

                    {/* Associated Skills Grid matching CV Manager */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                        Extracted Skills &amp; Keywords ({(selectedCV.skills || []).length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedCV.skills || []).map((s) => (
                          <span
                            key={s}
                            className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1"
                          >
                            <span>{s}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Inline View Panel */}
                    {isPreviewingCV && (
                      <div className="mt-3 max-h-96 overflow-y-auto rounded-2xl animate-fade-in shadow-md border border-slate-200 dark:border-slate-800">
                        <CVStyledPreview
                          content={selectedCV.parsed_content}
                          name={selectedCV.name}
                          focus={selectedCV.focus}
                          skills={selectedCV.skills}
                          atsScore={selectedCV.ats_score}
                        />
                      </div>
                    )}

                    {/* Inline Edit Panel — Structured + Raw toggle */}
                    {isEditingCV && (
                      <div className="p-4 bg-amber-50/60 dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-3 text-xs animate-fade-in">
                        <div className="flex justify-between items-center font-extrabold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>Edit CV Document:</span>
                            {/* Mode toggle */}
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                              {(["structured", "raw"] as const).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setCvEditMode(m)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                    cvEditMode === m
                                      ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {m === "structured" ? "Section Editor" : "Raw Text"}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingCV(false)}
                              className="text-[11px] font-bold text-slate-500 hover:underline"
                            >
                              Cancel Edit
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveCVEdit}
                              disabled={updateCV.isPending}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md disabled:opacity-50"
                            >
                              <Save size={13} />
                              <span>{updateCV.isPending ? "Saving…" : "Save Changes"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Section editor or raw textarea */}
                        {cvEditMode === "structured" ? (
                          <StructuredCVEditor
                            content={editedCVText}
                            onChange={(full) => setEditedCVText(full)}
                            showToolbar={false}
                          />
                        ) : (
                          <textarea
                            rows={8}
                            value={editedCVText}
                            onChange={(e) => setEditedCVText(e.target.value)}
                            className="w-full p-3.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-[11px] leading-relaxed text-slate-900 dark:text-white outline-none focus:border-amber-500"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Cover Letter (View, Edit, Delete/Clear controls) ── */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Send size={12} className="text-blue-500" />
                Cover Letter
              </label>
              <div className="flex items-center gap-2">
                {coverLetter && (
                  <button
                    type="button"
                    onClick={() => setCoverLetter("")}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-800 hover:bg-red-100 flex items-center gap-1"
                    title="Clear/Delete cover letter text"
                  >
                    <Trash2 size={11} /> Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={generateCoverLetter}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all flex items-center gap-1"
                >
                  <Sparkles size={12} className="text-amber-400" />
                  Auto-Generate from Job
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              placeholder="Write or edit your cover letter here, or click Auto-Generate above…"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none focus:border-blue-500 font-mono text-xs leading-relaxed"
            />
          </div>

          {/* ── Score badges ── */}
          <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200/50 dark:border-blue-800/50 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
            <span>Match Score: <strong>{form.match_score}%</strong></span>
            <span>ATS Score: <strong>{form.ats_score}%</strong></span>
            {hasLiveLink && (
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold"
              >
                <ExternalLink size={11} /> Original Listing
              </a>
            )}
          </div>

          {/* ── Footer actions (Cancel & Confirm Submit) ── */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createApplication.isPending}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold transition-colors shadow-md disabled:opacity-50"
            >
              {createApplication.isPending ? (
                <span>Submitting…</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirm &amp; Save Application</span>
                </>
              )}
            </button>
          </div>
        </form>
        </>
        )}
      </div>

      <InAppWebPortalApplyStudio
        isOpen={showStudio}
        onClose={() => setShowStudio(false)}
        job={job}
        onSuccess={() => {
          setSubmittedApp({ company_name: job.company_name, role: job.title });
          onSuccessApply(job.id);
        }}
      />
    </div>
  );
}

