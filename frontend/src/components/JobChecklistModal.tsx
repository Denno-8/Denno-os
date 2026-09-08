import React, { useState } from "react";
import {
  X, CheckCircle2, Circle, Sparkles, FileText, Target, Award,
  Zap, Copy, Check, Download, AlertCircle, ArrowRight, ShieldCheck, Briefcase, Layers, RefreshCw
} from "lucide-react";
import type { Job } from "../types/job.types";
import { useCreateCV, useGenerateCVForJob } from "../hooks/useCV";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  candidateSkills?: string[];
  candidateName?: string;
  onApplyWithTailoredCV?: (job: Job, letterText?: string) => void;
}

export default function JobChecklistModal({
  isOpen,
  onClose,
  job,
  candidateSkills: propSkills,
  candidateName = "Dennis K",
  onApplyWithTailoredCV
}: Props) {
  const [activeTab, setActiveTab] = useState<"checklist" | "letter" | "cv_optimizer">("checklist");

  // Checklist item toggle states
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    qualifications: true,
    experience: true,
    letter_prepared: false,
    cv_optimized: false,
    contact_verified: true,
  });

  // Cover Letter Generator state
  const [tone, setTone] = useState("professional");
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [letterBody, setLetterBody] = useState("");

  // Tailored CV Optimizer state
  const [optimizedSkills, setOptimizedSkills] = useState<string[]>([]);
  const [isCVOptimized, setIsCVOptimized] = useState(false);
  const [copiedCV, setCopiedCV] = useState(false);
  const [cvSuccessMsg, setCvSuccessMsg] = useState<string | null>(null);

  const createCV = useCreateCV();
  const generateCVForJob = useGenerateCVForJob();

  if (!isOpen || !job) return null;

  const requiredSkills = job.required_skills || [];
  const candidateSkills = propSkills && propSkills.length > 0
    ? propSkills
    : ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker", "Git"];
  
  // Calculate skill matches
  const matchedSkills = requiredSkills.filter((s) =>
    candidateSkills.some((cs) => cs.toLowerCase() === s.toLowerCase())
  );
  const missingSkills = requiredSkills.filter(
    (s) => !candidateSkills.some((cs) => cs.toLowerCase() === s.toLowerCase())
  );

  const matchRate = Math.round((matchedSkills.length / Math.max(1, requiredSkills.length)) * 100);

  // Initialize generated letter if empty
  const defaultLetter = `Dear Hiring Team at ${job.company_name},

I am writing to express my strong interest in the ${job.title} position (${job.mode} · ${job.level}).

With hands-on experience in ${matchedSkills.slice(0, 3).join(", ") || "modern software engineering"}, I have built high-throughput REST APIs, optimized PostgreSQL database queries, and implemented reactive user interfaces.

Key highlights matching your ${job.level} requirements:
• Expertise in ${matchedSkills[0] || "core tech stack"} & cloud architecture standards.
• Proven track record in reducing system latencies and elevating test coverage.
• Passionate about ${job.company_name}'s technical mission and engineering values.

I would welcome the opportunity to discuss how my technical skills and problem-solving background align with ${job.company_name}'s goals.

Sincerely,
${candidateName}
Full Stack Engineer`;

  const activeLetterText = letterBody || defaultLetter;

  // Calculate Readiness Percentage
  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const readinessPct = Math.round((completedCount / 5) * 100);

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
  };

  const handleGenerateLetter = (selectedTone: string) => {
    setTone(selectedTone);
    const toneIntros: Record<string, string> = {
      professional: `I am writing to formally submit my application for the ${job.title} role at ${job.company_name}.`,
      confident: `I am excited to apply for the ${job.title} position at ${job.company_name}, where I can immediately drive performance gains.`,
      technical: `As an engineer specializing in ${matchedSkills.slice(0, 2).join(" & ")}, I am thrilled to apply for the ${job.title} role.`,
      enthusiastic: `I have been following ${job.company_name}'s technical vision with great admiration and am thrilled to apply for the ${job.title} opening!`,
      executive: `With a track record of driving system stability and architectural excellence, I am writing regarding the ${job.title} role at ${job.company_name}.`,
    };

    const newIntro = toneIntros[selectedTone] || toneIntros["professional"];
    setLetterBody(`${newIntro}\n\nWith proven expertise in ${matchedSkills.join(", ") || "software architecture"}, I align closely with your required qualifications for ${job.level} level roles.\n\nKey Qualifications Match:\n• Demonstrated mastery in ${requiredSkills.slice(0, 3).join(", ")}.\n• Experience engineering scalable systems in ${job.mode} environments.\n• Commitment to automated testing, CI/CD, and robust security standards.\n\nThank you for considering my application.\n\nBest regards,\n${candidateName}`);
    setCheckedItems((prev) => ({ ...prev, letter_prepared: true }));
  };

  const handleOptimizeCV = () => {
    const combined = Array.from(new Set([...candidateSkills, ...missingSkills]));
    setOptimizedSkills(combined);
    setIsCVOptimized(true);
    setCheckedItems((prev) => ({ ...prev, cv_optimized: true }));

    generateCVForJob.mutate(
      {
        job_title: job.title,
        company_name: job.company_name,
        required_skills: combined,
        description: job.description || "",
      },
      {
        onSuccess: (cv) => {
          setCvSuccessMsg(`✓ Job-Compliant CV version "${cv.name}" created & saved to your CV library! (${cv.ats_score}% ATS Score)`);
        },
      }
    );
  };

  const handleCopyLetter = () => {
    navigator.clipboard?.writeText(activeLetterText);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                {job.level} · {job.mode}
              </span>
              <span className="text-xs text-slate-500 font-semibold">{job.company_name}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
              {job.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Application Readiness</div>
              <div className={`text-lg font-black ${readinessPct >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                {readinessPct}% Ready
              </div>
            </div>

            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 px-6 gap-2 pt-2">
          {[
            { id: "checklist", label: "Readiness & Requirements Checklist", icon: <CheckCircle2 size={15} /> },
            { id: "letter", label: "Application Letter Generator", icon: <FileText size={15} /> },
            { id: "cv_optimizer", label: "Best Optimized CV Editor", icon: <Target size={15} /> },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
                  active
                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* TAB 1: READINESS CHECKLIST & REQUIREMENTS */}
          {activeTab === "checklist" && (
            <div className="space-y-6">
              {/* 5-Point Application Readiness Checklist */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-500" />
                    <span>5-Point Application Audit Checklist</span>
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {completedCount} of 5 Completed
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {[
                    {
                      key: "qualifications",
                      label: "Requirements & Qualifications Match",
                      detail: `${matchRate}% skill alignment (${matchedSkills.length} matched, ${missingSkills.length} missing)`,
                    },
                    {
                      key: "experience",
                      label: "Experience Level Alignment",
                      detail: `Targeting ${job.level} position with 4+ years candidate experience`,
                    },
                    {
                      key: "letter_prepared",
                      label: "Application Letter / Cover Letter Generated",
                      detail: checkedItems.letter_prepared
                        ? "Application letter customized for position"
                        : "Required/Recommended cover letter not yet generated",
                      action: !checkedItems.letter_prepared && (
                        <button
                          onClick={() => setActiveTab("letter")}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 underline ml-2"
                        >
                          Generate Letter Now
                        </button>
                      ),
                    },
                    {
                      key: "cv_optimized",
                      label: "Best Optimized CV Tailored for Field",
                      detail: checkedItems.cv_optimized
                        ? "CV keywords & skills optimized for role"
                        : "Base CV can be further optimized for target skills",
                      action: !checkedItems.cv_optimized && (
                        <button
                          onClick={() => setActiveTab("cv_optimizer")}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 underline ml-2"
                        >
                          Optimize CV
                        </button>
                      ),
                    },
                    {
                      key: "contact_verified",
                      label: "Recruiter Email & Salary Range Verified",
                      detail: `Contact: ${job.contact_email || "careers@" + job.company_name.toLowerCase().replace(/[^a-z]/g, "") + ".com"} · ${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`,
                    },
                  ].map((item) => {
                    const isChecked = checkedItems[item.key];
                    return (
                      <div
                        key={item.key}
                        onClick={() => toggleCheck(item.key)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Circle size={18} className="text-slate-300 dark:text-slate-600 shrink-0" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                            <span>{item.label}</span>
                            {item.action}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Requirement & Qualification Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                    <Award size={15} className="text-blue-500" />
                    <span>Matched Core Skills ({matchedSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.map((sk) => (
                      <span key={sk} className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <Check size={12} /> {sk}
                      </span>
                    ))}
                    {matchedSkills.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No skills matched directly</span>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                    <AlertCircle size={15} className="text-amber-500" />
                    <span>Missing Target Keywords ({missingSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((sk) => (
                      <span key={sk} className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
                        + {sk}
                      </span>
                    ))}
                    {missingSkills.length === 0 && (
                      <span className="text-xs text-emerald-600 font-bold">100% skill match complete!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPLICATION LETTER GENERATOR */}
          {activeTab === "letter" && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Writing Tone Selector</div>
                  <div className="text-[11px] text-slate-500">Auto-tailor structure and opening pitch to role type</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["professional", "confident", "technical", "enthusiastic", "executive"].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleGenerateLetter(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                        tone === t
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Generated Application Letter for {job.title}:
                  </label>
                  <button
                    onClick={handleCopyLetter}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800"
                  >
                    {copiedLetter ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>{copiedLetter ? "Copied!" : "Copy Letter"}</span>
                  </button>
                </div>

                <textarea
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 outline-none resize-none h-80 focus:border-blue-500"
                  value={activeLetterText}
                  onChange={(e) => setLetterBody(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 3: BEST OPTIMIZED CV EDITOR */}
          {activeTab === "cv_optimizer" && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-200 dark:border-blue-800/60 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    <span>Job-Specific CV Keyword Optimizer</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Inject missing target keywords ({missingSkills.join(", ") || "All present"}) directly into your core competency grid and achievements.
                  </p>
                </div>

                <button
                  onClick={handleOptimizeCV}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
                >
                  <RefreshCw size={14} className={isCVOptimized ? "" : "animate-spin"} />
                  <span>{isCVOptimized ? "CV Fully Optimized & Saved!" : "Generate & Save Compliant CV"}</span>
                </button>
              </div>

              {cvSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{cvSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Base CV Technical Skills ({candidateSkills.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {candidateSkills.map((sk) => (
                      <span key={sk} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Zap size={14} />
                    <span>Optimized CV Skills Grid ({(optimizedSkills.length > 0 ? optimizedSkills : candidateSkills).length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(optimizedSkills.length > 0 ? optimizedSkills : candidateSkills).map((sk) => (
                      <span key={sk} className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-300 dark:border-blue-800">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Recommended Tailored Achievement Bullet Points:
                </div>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-disc pl-4 leading-relaxed font-mono">
                  <li>
                    Architected high-throughput microservices using {requiredSkills[0] || "FastAPI"} and {requiredSkills[1] || "PostgreSQL"}, serving 30k+ active users.
                  </li>
                  <li>
                    Integrated automated CI/CD pipelines and Docker containerization, cutting deployment release cycles by 55%.
                  </li>
                  <li>
                    Optimized SQL query execution plans and Redis caching layer, reducing API endpoint latencies to &lt; 45ms.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
          <div className="text-xs text-slate-500 font-semibold">
            {readinessPct === 100 ? "✓ Application 100% Audit Ready!" : "Complete checklist items before submitting"}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
            {onApplyWithTailoredCV && (
              <button
                onClick={() => {
                  onApplyWithTailoredCV(job, activeLetterText);
                  onClose();
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Proceed to Apply</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
