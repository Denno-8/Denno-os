import { useState, useMemo } from "react";
import {
  Sparkles, Copy, Download, FileText, Check, Zap, Link2, ChevronDown,
  X, BookOpen, BarChart2, AlignLeft, Send, Mail,
} from "lucide-react";
import { useGenerateCoverLetter } from "../../hooks/useAI";
import { useApplications, useUpdateApplication } from "../../hooks/useApplications";
import ApplicationTemplatesModal from "../../components/ApplicationTemplatesModal";

const CATEGORIES = [
  "Software Engineering",
  "Data & AI",
  "Product & Design",
  "Cloud & DevOps",
  "CyberSecurity",
  "Finance & Operations",
  "Sales & Marketing",
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "confident", label: "Confident" },
  { value: "technical", label: "Technical" },
  { value: "enthusiastic", label: "Warm & Enthusiastic" },
  { value: "executive", label: "Executive" },
];

/** Parse a raw cover letter string into structured paragraphs */
function parseLetter(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

/** Detect a salutation line (starts with "Dear") */
function isSalutation(p: string) {
  return /^dear\s/i.test(p.trim());
}

/** Detect a closing/signature block */
function isClosing(p: string) {
  const lower = p.trim().toLowerCase();
  return (
    lower.startsWith("sincerely") ||
    lower.startsWith("best regards") ||
    lower.startsWith("regards") ||
    lower.startsWith("yours") ||
    lower.startsWith("warm regards") ||
    lower.startsWith("thank you")
  );
}

export default function CoverLetterPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState("Software Engineering");
  const [tone, setTone] = useState("professional");
  const [jobDescription, setJobDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAttachDropdown, setShowAttachDropdown] = useState(false);
  const [attachSuccess, setAttachSuccess] = useState<string | null>(null);

  const generate = useGenerateCoverLetter();
  const { data: applications = [] } = useApplications();
  const updateApplication = useUpdateApplication();

  const wordCount = useMemo(() => {
    if (!generate.data?.letter) return 0;
    return generate.data.letter.trim().split(/\s+/).filter(Boolean).length;
  }, [generate.data?.letter]);

  const paragraphs = useMemo(() => parseLetter(generate.data?.letter || ""), [generate.data?.letter]);

  const qualityLabel = useMemo(() => {
    if (wordCount === 0) return null;
    if (wordCount < 150) return { text: "Short", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
    if (wordCount <= 350) return { text: "Ideal Length", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
    return { text: "Detailed", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
  }, [wordCount]);

  const copyLetter = () => {
    if (!generate.data?.letter) return;
    navigator.clipboard?.writeText(generate.data.letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLetter = () => {
    if (!generate.data?.letter) return;
    const blob = new Blob([generate.data.letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${company || "cover_letter"}_${jobTitle || "role"}.txt`.replace(/\s+/g, "_");
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAttachToApp = (appId: string, appLabel: string) => {
    if (!generate.data?.letter) return;
    updateApplication.mutate(
      { id: appId, patch: { notes: generate.data.letter } },
      {
        onSuccess: () => {
          setAttachSuccess(`Attached to "${appLabel}" ✓`);
          setShowAttachDropdown(false);
          setTimeout(() => setAttachSuccess(null), 3000);
        },
      }
    );
  };

  // Get today's date in a professional format
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Top Banner ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl px-7 py-6 border"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(29,78,216,0.05) 100%)",
          borderColor: "rgba(59,130,246,0.25)",
        }}
      >
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 mb-2 uppercase tracking-wider">
            <Mail size={11} /> AI Document Generator
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white m-0 tracking-tight">
            Category-Tailored Cover Letter Engine
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 m-0">
            Generate high-converting, professionally formatted cover letters tailored to your role and industry.
          </p>
        </div>
        <button
          onClick={() => setShowTemplates(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 shadow-md transition-all shrink-0"
        >
          <Sparkles size={15} className="text-blue-400" />
          <span>Templates Library</span>
        </button>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* ── Form Panel ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen size={15} className="text-blue-500" /> Job & Category Details
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Job Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-semibold outline-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Job Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Target Job Title *</label>
            <input
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-semibold outline-none placeholder:text-slate-400 focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
              placeholder="e.g. Senior Frontend Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Company Name *</label>
            <input
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-semibold outline-none placeholder:text-slate-400 focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
              placeholder="e.g. Safaricom / Google"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          {/* Job Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Job Description <span className="text-slate-400 font-normal">(optional — improves targeting)</span>
            </label>
            <textarea
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-medium outline-none resize-none placeholder:text-slate-400 focus:border-blue-400 dark:focus:border-blue-600 transition-colors leading-relaxed"
              rows={4}
              placeholder="Paste key responsibilities or requirements…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Writing Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    tone === t.value
                      ? "bg-blue-100 dark:bg-blue-900/50 border-blue-400 text-blue-700 dark:text-blue-300"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            disabled={!jobTitle.trim() || !company.trim() || generate.isPending}
            onClick={() =>
              generate.mutate({
                job_title: jobTitle,
                company,
                category,
                tone,
                job_description: jobDescription || undefined,
              })
            }
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-600 border-none rounded-xl text-white font-bold text-sm cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 mt-2"
            style={{ boxShadow: (!jobTitle.trim() || !company.trim() || generate.isPending) ? "none" : "0 4px 14px rgba(37,99,235,0.4)" }}
          >
            <Sparkles size={16} />
            <span>{generate.isPending ? "Generating Tailored Letter…" : "Generate Cover Letter"}</span>
          </button>
        </div>

        {/* ── Preview Panel ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm min-h-[500px] flex flex-col">
          {/* Empty State */}
          {!generate.data && !generate.isPending && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                <FileText size={28} className="text-slate-400" />
              </div>
              <div className="text-base font-bold text-slate-700 dark:text-slate-300">No letter generated yet</div>
              <div className="text-sm text-slate-400 max-w-xs">
                Select a category, enter target job details, and click <strong>Generate Cover Letter</strong>.
              </div>
            </div>
          )}

          {/* Loading State */}
          {generate.isPending && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-2 animate-pulse">
                <Zap size={28} className="text-blue-500" />
              </div>
              <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                Drafting your letter…
              </div>
              <div className="text-sm text-slate-400">
                Tailoring {tone} tone for <strong>{jobTitle}</strong> at <strong>{company}</strong>
              </div>
              <div className="text-xs text-slate-400 mt-1">Optimizing for {category} standards.</div>
            </div>
          )}

          {/* Generated Letter View */}
          {generate.data && (
            <div className="flex flex-col h-full">
              {/* Action Bar */}
              <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{jobTitle} — {company}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      {category} · {tone.charAt(0).toUpperCase() + tone.slice(1)} Tone
                    </div>
                  </div>
                  {/* Quality Indicators */}
                  {qualityLabel && (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${qualityLabel.bg} ${qualityLabel.color} flex items-center gap-1`}>
                      <BarChart2 size={11} /> {qualityLabel.text}
                    </span>
                  )}
                  {wordCount > 0 && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                      <AlignLeft size={11} /> {wordCount} words · {paragraphs.length} paragraphs
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    onClick={copyLetter}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                  <button
                    onClick={downloadLetter}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <Download size={13} />
                    <span>Download .txt</span>
                  </button>
                  {/* Attach to Application */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAttachDropdown((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      <Link2 size={13} />
                      <span>Attach to App</span>
                      <ChevronDown size={12} className={`transition-transform ${showAttachDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showAttachDropdown && (
                      <div
                        className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Select Application
                          </span>
                          <button onClick={() => setShowAttachDropdown(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {applications.length === 0 && (
                            <div className="px-4 py-6 text-center text-xs text-slate-400">
                              No applications tracked yet. Add one in the Applications page.
                            </div>
                          )}
                          {applications.map((app: any) => (
                            <button
                              key={app.id}
                              onClick={() => handleAttachToApp(app.id, `${app.role} @ ${app.company_name}`)}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                            >
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{app.role}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{app.company_name} · {app.stage}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Attach Success Banner */}
              {attachSuccess && (
                <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check size={14} /> {attachSuccess}
                </div>
              )}

              {/* Formatted Letter Document */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-2xl mx-auto">
                  {/* Letter Document Frame */}
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
                    {/* Top Accent */}
                    <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

                    <div className="p-8 md:p-10 space-y-6 font-serif">
                      {/* Date */}
                      <div className="text-sm text-slate-500 dark:text-slate-400 font-sans">{todayFormatted}</div>

                      {/* Recipient Line */}
                      <div className="space-y-0.5 font-sans text-sm">
                        <div className="font-bold text-slate-800 dark:text-slate-200">Hiring Manager</div>
                        <div className="text-slate-600 dark:text-slate-400">{company || "[Company Name]"}</div>
                      </div>

                      {/* Letter Body */}
                      <div className="space-y-5 text-slate-800 dark:text-slate-200 text-[15px] leading-relaxed">
                        {paragraphs.map((para, idx) => {
                          if (isSalutation(para)) {
                            return (
                              <p key={idx} className="font-semibold text-slate-900 dark:text-white m-0">
                                {para}
                              </p>
                            );
                          }
                          if (isClosing(para)) {
                            return (
                              <div key={idx} className="pt-2 space-y-1 font-sans">
                                {para.split(/\n/).map((line, li) => (
                                  <p key={li} className="m-0 font-semibold text-slate-900 dark:text-white">
                                    {line.trim()}
                                  </p>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <p key={idx} className="m-0 text-justify leading-[1.9]">
                              {para}
                            </p>
                          );
                        })}
                      </div>

                      {/* Divider and Meta */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                        <span>{category} · {tone.charAt(0).toUpperCase() + tone.slice(1)} Tone</span>
                        <span>{wordCount} words</span>
                      </div>
                    </div>
                  </div>

                  {/* Hint */}
                  <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                    <Send size={11} className="mt-0.5 shrink-0" />
                    <span>
                      Use <strong>Attach to App</strong> to save this letter directly to an application's notes, or <strong>Copy</strong> to paste it into your email client.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAttachDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowAttachDropdown(false)} />
      )}

      {showTemplates && <ApplicationTemplatesModal onClose={() => setShowTemplates(false)} />}
    </div>
  );
}
