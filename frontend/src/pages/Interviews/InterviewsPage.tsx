import { useState } from "react";
import ApiErrorCard from "../../components/ApiErrorCard";
import { Mic, Calendar as CalendarIcon, CheckSquare, Square, Plus, X, Trash2, MapPin, BookOpen, AlertTriangle, CheckCircle2, Award, Sparkles, Filter, Search, ChevronDown, ChevronUp, UserCheck, TrendingUp, BarChart2 } from "lucide-react";
import { useInterviews, useCreateInterview, useUpdateInterview, useDeleteInterview } from "../../hooks/useInterviews";
import { useApplications } from "../../hooks/useApplications";
import { useRecruiters } from "../../hooks/useRecruiters";
import PostMortemModal from "../../components/PostMortemModal";
import MockInterviewModal from "../../components/MockInterviewModal";
import { DEFAULT_CHECKLIST, INTERVIEW_TYPES, type Interview } from "../../types/interview.types";
import { TOP_200_QUESTIONS, QUESTION_CATEGORY_GROUPS } from "../../data/interviewQuestions200";

const JOB_ROLES = ["All Roles", "General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity", "System Architecture"];

export default function InterviewsPage() {
  const { data: interviews, isLoading, isError, refetch } = useInterviews();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [postMortemTarget, setPostMortemTarget] = useState<any | null>(null);
  const [mockPracticeTarget, setMockPracticeTarget] = useState<{ roleTitle: string; companyName: string; interviewType: string } | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Top 200 Questions Bank state in Interview Prep
  const [prepRole, setPrepRole] = useState<string>("Backend");
  const [prepCategory, setPrepCategory] = useState<string>("all");
  const [prepSearch, setPrepSearch] = useState<string>("");
  const [expandedPrepQId, setExpandedPrepQId] = useState<number | null>(null);

  const updateInterview = useUpdateInterview();
  const deleteInterview = useDeleteInterview();

  if (isLoading) return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading interviews…</div>;
  if (isError) return <ApiErrorCard onRetry={refetch} />;

  const list = interviews ?? [];
  const selected = list.find((i) => i.id === selectedId) ?? list[0] ?? null;

  const toggleChecklist = (interview: Interview, item: string) => {
    const checklist = { ...interview.prep_checklist, [item]: !interview.prep_checklist[item] };
    updateInterview.mutate({ id: interview.id, patch: { prep_checklist: checklist } });
  };

  // GAP-11: Post-Mortem Trends Calculation
  const completedReflections = list.filter((i) => i.post_mortem_done);
  const avgConfidence = completedReflections.length
    ? Math.round((completedReflections.reduce((acc, i) => acc + (i.overall_confidence || 5), 0) / completedReflections.length) * 10) / 10
    : 0;

  // GAP-04: Robust category filter for 200 questions
  const filteredQuestions = TOP_200_QUESTIONS.filter((q) => {
    if (prepRole !== "All Roles" && !q.jobTypes.includes(prepRole as any)) return false;
    if (prepCategory !== "all") {
      const gObj = QUESTION_CATEGORY_GROUPS.find((g) => g.id === prepCategory);
      if (gObj) {
        // Match on the numeric prefix of the category title (e.g. "12." handles two-digit categories)
        const numPrefix = gObj.title.split(".")[0] + ".";
        if (!q.category.startsWith(numPrefix) && !q.category.startsWith(gObj.title)) return false;
      }
    }
    if (prepSearch.trim()) {
      const term = prepSearch.toLowerCase();
      return q.question.toLowerCase().includes(term) || q.answer.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="p-2 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5">
            <Sparkles size={13} /> Interview Readiness Engine
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Interview Prep &amp; Reflections</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {list.length} scheduled interviews · Conflict detection, day-of checklists &amp; Top 200 Questions Bank
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMockPracticeTarget({ roleTitle: "Software Engineer", companyName: "Target Company", interviewType: "Technical" })}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-extrabold px-4 py-2.5 shadow-md transition-all hover:scale-[1.02]"
            title="Launch dynamic AI mock interview practice & STAR response coach"
          >
            <Sparkles size={16} />
            <span>Launch AI Mock Practice</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 shadow-md transition-all hover:scale-[1.02]"
          >
            <Plus size={16} />
            <span>Schedule Interview</span>
          </button>
        </div>
      </div>

      {/* GAP-11: Post-Mortem Trends Card */}
      {list.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs font-bold text-slate-400">Total Interviews</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{list.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Mic size={20} />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs font-bold text-slate-400">Post-Mortems Recorded</div>
              <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{completedReflections.length} / {list.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs font-bold text-slate-400">Avg Confidence Score</div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{avgConfidence > 0 ? `${avgConfidence} / 10` : "N/A"}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Performance Analytics Panel */}
      {list.length > 0 && (() => {
        const completed = list.filter((i: any) => i.status === "completed");
        const passed = list.filter((i: any) => i.outcome === "Passed").length;
        const rejected = list.filter((i: any) => i.outcome === "Rejected").length;
        const pending = list.filter((i: any) => i.status === "scheduled").length;
        const passRate = completed.length > 0 ? Math.round((passed / completed.length) * 100) : 0;
        const avgConf = completedReflections.length > 0
          ? Math.round((completedReflections.reduce((acc: number, i: any) => acc + (i.overall_confidence || 5), 0) / completedReflections.length) * 10) / 10
          : 0;
        const byType: Record<string, number> = {};
        list.forEach((i: any) => { byType[i.type] = (byType[i.type] || 0) + 1; });
        const maxType = Math.max(...Object.values(byType), 1);

        return (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl border border-indigo-500/20 p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 size={17} className="text-indigo-400" />
                <span className="text-sm font-extrabold text-white">Interview Performance Analytics</span>
              </div>
              <div className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${
                passRate >= 60
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : passRate >= 30
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
              }`}>
                {passRate}% Pass Rate
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Passed",           val: passed,                                          color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                { label: "Rejected",         val: rejected,                                        color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20" },
                { label: "Upcoming",         val: pending,                                         color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
                { label: "Avg Confidence",   val: avgConf > 0 ? `${avgConf}/10` : "N/A",          color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20" },
              ].map(({ label, val, color, bg }) => (
                <div key={label} className={`rounded-xl p-3 border ${bg}`}>
                  <div className="text-xs text-slate-400 font-semibold mb-0.5">{label}</div>
                  <div className={`text-xl font-black ${color}`}>{val}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Interview Type Breakdown</div>
              {Object.entries(byType).map(([type, count]) => {
                const pct = Math.round((count / maxType) * 100);
                const typePassCount = list.filter((i: any) => i.type === type && i.outcome === "Passed").length;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-300">{type}</span>
                      <span className="text-xs font-bold text-slate-400">{count} session{count !== 1 ? "s" : ""}{typePassCount > 0 ? ` · ${typePassCount} passed` : ""}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: typePassCount > 0 ? "linear-gradient(90deg, #10b981, #3b82f6)" : "linear-gradient(90deg, #6366f1, #8b5cf6)"
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {conflictWarning && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{conflictWarning}</span>
          </div>
          <button onClick={() => setConflictWarning(null)} className="text-amber-600">
            <X size={14} />
          </button>
        </div>
      )}

      {list.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-sm text-slate-400 dark:text-slate-500 shadow-sm">
          <Mic size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          No interviews scheduled yet. Schedule one tied to a specific tracked application.
        </div>
      )}

      {list.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
          <div className="flex flex-col gap-2.5">
            {list.map((iv: any) => (
              <div
                key={iv.id}
                onClick={() => setSelectedId(iv.id)}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border cursor-pointer transition-all ${
                  selected?.id === iv.id ? "border-blue-500 shadow-md" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>{iv.type}</span>
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 capitalize ${
                    iv.status === "completed" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  }`}>{iv.status}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <CalendarIcon size={12} className="text-slate-400" />
                  <span>{new Date(iv.scheduled_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {iv.post_mortem_done && (
                  <div className="mt-2 text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Reflection Recorded
                  </div>
                )}
              </div>
            ))}
          </div>

          {selected && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{selected.type} Interview</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                    <CalendarIcon size={13} className="text-slate-400" />
                    <span>{new Date(selected.scheduled_at).toLocaleString()}</span>
                    {selected.location && (
                      <>
                        <span>•</span>
                        <MapPin size={13} className="text-slate-400" />
                        <span>{selected.location}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPostMortemTarget(selected)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 rounded-xl px-3 py-1.5 transition-colors shadow-xs"
                  >
                    <BookOpen size={13} />
                    <span>{selected.post_mortem_done ? "View Reflection" : "Post-Mortem Form"}</span>
                  </button>
                  <button
                    onClick={() => deleteInterview.mutate(selected.id, { onSuccess: () => setSelectedId(null) })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl px-3 py-1.5 transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>

              {/* Prep Checklist */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Day-of Checklist &amp; Prep Buffer</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_CHECKLIST.map((item) => {
                    const checked = !!selected.prep_checklist[item];
                    return (
                      <div
                        key={item}
                        onClick={() => toggleChecklist(selected, item)}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer border transition-all ${
                          checked
                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {checked ? <CheckSquare size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Square size={16} className="text-slate-400 shrink-0" />}
                        <span>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reflection Summary if completed */}
              {selected.post_mortem_done && (
                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-xl space-y-2 text-xs">
                  <div className="font-extrabold text-purple-900 dark:text-purple-300 flex items-center justify-between">
                    <span>Knowledge Base Post-Mortem Snapshot</span>
                    <span>Confidence: {selected.overall_confidence}/10</span>
                  </div>
                  <div>
                    <span className="font-bold text-purple-800 dark:text-purple-400">What went well: </span>
                    <span className="text-slate-700 dark:text-slate-300">{selected.what_went_well || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-purple-800 dark:text-purple-400">Improvement focus: </span>
                    <span className="text-slate-700 dark:text-slate-300">{selected.what_to_improve || "N/A"}</span>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <select
                  value={selected.status}
                  onChange={(e) => updateInterview.mutate({ id: selected.id, patch: { status: e.target.value } })}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                >
                  {["scheduled", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={selected.outcome ?? ""}
                  onChange={(e) => updateInterview.mutate({ id: selected.id, patch: { outcome: e.target.value } })}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="">Outcome: pending</option>
                  <option value="Passed">Passed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOP 200 CODING QUESTIONS BANK FOR INTERVIEW PREP */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award size={18} className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Top 200 Technical Coding Question Bank
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Filter by targeted job requirement (Backend, Frontend, Full Stack, DevOps, Data) to practice high-frequency questions.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={prepRole}
              onChange={(e) => setPrepRole(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold outline-none"
            >
              {JOB_ROLES.map((r) => (
                <option key={r} value={r}>Role Requirement: {r}</option>
              ))}
            </select>

            <select
              value={prepCategory}
              onChange={(e) => setPrepCategory(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold outline-none"
            >
              <option value="all">Module: All {TOP_200_QUESTIONS.length} Questions ({QUESTION_CATEGORY_GROUPS.length} Categories)</option>
              {QUESTION_CATEGORY_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>{g.title} ({g.count})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-3.5 text-slate-400" />
          <input
            value={prepSearch}
            onChange={(e) => setPrepSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 text-xs outline-none placeholder:text-slate-400 font-medium"
            placeholder="Search specific questions or topics (e.g. Binary Search, SQL Joins, Redux, Microservices)..."
          />
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredQuestions.map((q) => {
            const isExp = expandedPrepQId === q.id;
            return (
              <div
                key={q.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded text-[10px] border border-blue-200 dark:border-blue-900">
                      Q{q.id}
                    </span>
                    <span className="font-semibold text-slate-500 text-[11px]">{q.category.split(". ")[1]}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
                    {q.difficulty}
                  </span>
                </div>

                <div className="font-bold text-slate-900 dark:text-white cursor-pointer" onClick={() => setExpandedPrepQId(isExp ? null : q.id)}>
                  {q.question}
                </div>

                {isExp && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 space-y-3 leading-relaxed text-xs sm:text-sm">
                    <p className="m-0 font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{q.answer}</p>
                    {q.codeSnippet && (
                      <div className="bg-slate-950 text-emerald-400 dark:text-emerald-300 p-4 rounded-xl font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto border border-slate-800 shadow-md">
                        <pre className="m-0 whitespace-pre-wrap font-bold font-mono tracking-wide">{q.codeSnippet}</pre>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-1 text-[10px] text-slate-400">
                  <div className="flex gap-1">
                    {q.jobTypes.map((jt) => (
                      <span key={jt} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">
                        #{jt}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setExpandedPrepQId(isExp ? null : q.id)}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    {isExp ? "Collapse" : "View Answer"}
                  </button>
                </div>
              </div>
            );
          })}
          {filteredQuestions.length === 0 && (
            <div className="col-span-1 md:col-span-2 p-8 text-center text-xs text-slate-400">
              No prep questions match current job role filter.
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddInterviewModal
          onClose={() => setShowAdd(false)}
          onConflict={(msg) => setConflictWarning(msg)}
        />
      )}

      {postMortemTarget && (
        <PostMortemModal
          isOpen={!!postMortemTarget}
          onClose={() => setPostMortemTarget(null)}
          interviewId={postMortemTarget.id}
          interviewType={postMortemTarget.type}
          onSuccess={() => refetch()}
        />
      )}

      {mockPracticeTarget && (
        <MockInterviewModal
          isOpen={!!mockPracticeTarget}
          onClose={() => setMockPracticeTarget(null)}
          roleTitle={mockPracticeTarget.roleTitle}
          companyName={mockPracticeTarget.companyName}
          interviewType={mockPracticeTarget.interviewType}
        />
      )}
    </div>
  );
}

function AddInterviewModal({
  onClose,
  onConflict,
}: {
  onClose: () => void;
  onConflict: (msg: string) => void;
}) {
  const { data: applications } = useApplications();
  const { data: recruiters } = useRecruiters();
  const [applicationId, setApplicationId] = useState("");
  const [recruiterId, setRecruiterId] = useState("");
  const [type, setType] = useState(INTERVIEW_TYPES[0]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const createInterview = useCreateInterview();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Schedule Interview</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 mb-5">
          <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium" value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
            <option value="">Select application…</option>
            {(applications ?? []).map((a) => <option key={a.id} value={a.id}>{a.role} — {a.company_name}</option>)}
          </select>
          <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium" value={recruiterId} onChange={(e) => setRecruiterId(e.target.value)}>
            <option value="">Assign recruiter contact (optional)…</option>
            {(recruiters ?? []).map((r) => <option key={r.id} value={r.id}>{r.name} ({r.company_name || "Independent"})</option>)}
          </select>
          <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium" value={type} onChange={(e) => setType(e.target.value)}>
            {INTERVIEW_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="datetime-local" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400" placeholder="Location (e.g. Teams, Zoom, Office)" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button
            disabled={!applicationId || !scheduledAt}
            onClick={() => createInterview.mutate(
              { application_id: applicationId, type, scheduled_at: new Date(scheduledAt).toISOString(), location },
              {
                onSuccess: (data: any) => {
                  if (data?.conflict_warning) {
                    onConflict(data.conflict_warning);
                  }
                  onClose();
                }
              }
            )}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
          >
            Schedule
          </button>
          <button onClick={onClose} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
