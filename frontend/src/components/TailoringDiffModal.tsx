import { useState } from "react";
import { Sparkles, Check, X, ArrowRight, Zap, RefreshCw, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";

interface TailoringDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvId: string;
  cvName: string;
  onApplyTailored: (skills: string[], atsScore: number, content: string) => void;
}

export default function TailoringDiffModal({
  isOpen,
  onClose,
  cvId,
  cvName,
  onApplyTailored,
}: TailoringDiffModalProps) {
  const [jobTitle, setJobTitle] = useState("Senior Full Stack Engineer");
  const [targetSkills, setTargetSkills] = useState("Python, FastAPI, React, PostgreSQL, Docker, AWS");
  const [jobDescription, setJobDescription] = useState(
    "We are seeking a Senior Engineer with expertise in building scalable backend microservices, optimizing database performance, and deploying cloud infrastructure. Key skills include Python, FastAPI, Docker, and PostgreSQL."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleRunTailoring = async () => {
    setLoading(true);
    try {
      const skillsList = targetSkills.split(",").map((s) => s.trim()).filter(Boolean);
      const data = await api.post<any>(`/cv/${cvId}/tailor`, {
        job_title: jobTitle,
        required_skills: skillsList,
        description: jobDescription,
      });
      setResult(data);
    } catch (e) {
      console.error("Tailoring error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">AI Resume Optimizer &amp; Tailoring Engine</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Analyze job requirements, calculate keyword match %, and generate tailored content for "{cvName}"
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Job Title</label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
                placeholder="e.g. Senior Backend Engineer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Required Skills (Comma Separated)</label>
              <input
                value={targetSkills}
                onChange={(e) => setTargetSkills(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
                placeholder="e.g. Python, Docker, Redis"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Job Description Text</label>
            <textarea
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 resize-y"
              placeholder="Paste the target job description here to analyze missing keywords & experience metrics..."
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleRunTailoring}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>{loading ? "Analyzing & Tailoring…" : "Run Optimization & Tailor CV"}</span>
            </button>
          </div>
        </div>

        {/* Optimizer & Diff Output */}
        {result && (
          <div className="space-y-4">
            {/* Optimizer Score Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs">
                <div className="text-blue-600 dark:text-blue-400 font-bold mb-1">Keyword Match Rate</div>
                <div className="text-xl font-extrabold text-blue-900 dark:text-blue-100">
                  {result.optimizer?.match_rate ?? 75}%
                </div>
                <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  {result.optimizer?.matched_skills_count ?? 4} of {result.optimizer?.target_skills_count ?? 6} skills present
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold mb-1">Tailored ATS Score</div>
                <div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100">
                  {result.tailored_cv.ats_score}%
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                  +{result.diff.score_gain}% gain over base score ({result.base_cv.ats_score}%)
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs">
                <div className="text-indigo-600 dark:text-indigo-400 font-bold mb-1">Quantified Metrics</div>
                <div className="text-xl font-extrabold text-indigo-900 dark:text-indigo-100">
                  {result.optimizer?.metrics_ratio ?? 80}%
                </div>
                <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                  High-impact achievement bullets
                </div>
              </div>
            </div>

            {/* Missing Keywords Warning & Chips */}
            {result.diff.skills_added && result.diff.skills_added.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 mb-1.5">
                  <AlertTriangle size={14} className="text-amber-600" />
                  Missing High-Value Keywords (Automatically Integrated into Tailored Version):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.diff.skills_added.map((s: string) => (
                    <span key={s} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold rounded-md text-[11px] border border-amber-300 dark:border-amber-700">
                      + {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Side-by-side Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Base CV (Left) */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900">
                <div className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Original Base Version
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mb-2">{result.base_cv.name}</div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">Skills: {result.base_cv.skills.join(", ") || "None"}</div>
                <pre className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                  {result.base_cv.content}
                </pre>
              </div>

              {/* Tailored CV (Right) */}
              <div className="border-2 border-blue-500/50 rounded-xl p-4 bg-blue-50/20 dark:bg-blue-950/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={12} /> AI Tailored &amp; Optimized Version
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    Optimized
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mb-2">{result.tailored_cv.job_title}</div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Integrated Keywords:{" "}
                  {result.tailored_cv.skills.map((s: string) => (
                    <span
                      key={s}
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] mr-1 mb-1 font-bold ${
                        result.diff.skills_added.includes(s)
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <pre className="text-[11px] text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-lg whitespace-pre-wrap font-mono border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto">
                  {result.tailored_cv.content}
                </pre>
              </div>
            </div>

            {/* Accept Action */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  onApplyTailored(result.tailored_cv.skills, result.tailored_cv.ats_score, result.tailored_cv.content);
                  onClose();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-md"
              >
                <Check size={14} />
                <span>Apply Tailored &amp; Optimized Content to CV</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
