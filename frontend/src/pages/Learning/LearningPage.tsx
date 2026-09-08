import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Plus, ExternalLink, CheckCircle2, Trash2, X, AlertCircle, RefreshCw, Search, Code, Check, Award, Sparkles, Filter, ChevronDown, ChevronUp, Copy, Shield, ShieldAlert, Terminal, FileSearch, Lock, AlertTriangle, Cpu, Wrench, Target, Zap, ArrowRight, Brain } from "lucide-react";
import { useCourses, useCreateCourse, useUpdateProgress, useDeleteCourse } from "../../hooks/useLearning";
import { learningService } from "../../services/learning.service";
import type { SkillGapHeatmapResponse } from "../../types/learning.types";
import { TOP_200_QUESTIONS, QUESTION_CATEGORY_GROUPS } from "../../data/interviewQuestions200";
import { CYBERSECURITY_COURSES, FORENSICS_SECURITY_TOOLS, CYBERSECURITY_QUESTIONS, REAL_WORLD_SECURITY_SCENARIOS, type SecurityQuestionItem, type SecurityToolRef, type RealWorldScenarioItem } from "../../data/cybersecurityData";

import QuizModeModal from "../../components/QuizModeModal";

const CATEGORIES = ["All", "DevOps", "Cloud", "Data", "Database", "Interview", "Cybersecurity", "Forensics"];
const JOB_ROLES = ["All Roles", "Backend", "Frontend", "Full Stack", "DevOps", "Data"];

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState<"questions" | "security" | "courses" | "gap">("security");
  const [category, setCategory] = useState("All");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedJobRole, setSelectedJobRole] = useState<string>("All Roles");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Record<string | number, boolean>>({});
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [scenarioDifficultyFilter, setScenarioDifficultyFilter] = useState<string>("All");
  
  // Skill Gap Heatmap state
  const [skillGapData, setSkillGapData] = useState<SkillGapHeatmapResponse | null>(null);
  const [isLoadingGap, setIsLoadingGap] = useState(false);

  const [masteredIds, setMasteredIds] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem("denno_mastered_q200");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // GAP-01: Cybersec Mastery State with localStorage persistence
  const [masteredCybersec, setMasteredCybersec] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem("denno_mastered_cybersec");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Security Hub sub-tab state (Default to scenarios for real-world resolution walk-throughs!)
  const [secSubTab, setSecSubTab] = useState<"scenarios" | "tools" | "courses" | "questions">("scenarios");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const { data: courses, isLoading, isError, refetch } = useCourses(category === "All" ? undefined : category);
  const createCourse = useCreateCourse();
  const updateProgress = useUpdateProgress();
  const deleteCourse = useDeleteCourse();
  const [showAdd, setShowAdd] = useState(false);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);

  useEffect(() => {
    if (activeTab === "gap" && !skillGapData) {
      setIsLoadingGap(true);
      learningService.getSkillGapHeatmap()
        .then((res) => setSkillGapData(res))
        .catch((err) => console.error("Failed to load skill gap heatmap", err))
        .finally(() => setIsLoadingGap(false));
    }
  }, [activeTab, skillGapData]);

  useEffect(() => {
    try {
      localStorage.setItem("denno_mastered_q200", JSON.stringify(masteredIds));
    } catch (e) {
      console.error("Failed to save mastered status", e);
    }
  }, [masteredIds]);

  useEffect(() => {
    try {
      localStorage.setItem("denno_mastered_cybersec", JSON.stringify(masteredCybersec));
    } catch (e) {
      console.error("Failed to save cybersec mastered status", e);
    }
  }, [masteredCybersec]);

  const toggleMastered = (id: number) => {
    setMasteredIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCybersecMastered = (id: number) => {
    setMasteredCybersec((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpand = (id: string | number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCode = (id: number | string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Filtered 200 Questions
  const filteredQuestions = TOP_200_QUESTIONS.filter((q) => {
    if (selectedGroup !== "all") {
      const groupObj = QUESTION_CATEGORY_GROUPS.find((g) => g.id === selectedGroup);
      if (groupObj && !q.category.startsWith(groupObj.title.split(" ")[0])) return false;
    }
    if (selectedJobRole !== "All Roles") {
      if (!q.jobTypes.includes(selectedJobRole as any)) return false;
    }
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      const matchQ = q.question.toLowerCase().includes(term);
      const matchA = q.answer.toLowerCase().includes(term);
      const matchCat = q.category.toLowerCase().includes(term);
      if (!matchQ && !matchA && !matchCat) return false;
    }
    return true;
  });

  const totalMastered = Object.values(masteredIds).filter(Boolean).length;
  const masteryPercentage = Math.round((totalMastered / 200) * 100);

  if (isLoading && activeTab === "courses") {
    return <div style={{ padding: 24, color: "var(--text-secondary)", fontSize: 14 }}>Loading learning catalog…</div>;
  }

  return (
    <div style={{ padding: 8 }} className="space-y-6">
      {/* Top Banner */}
      <div style={bannerStyle}>
        <div>
          <div style={badgeStyle}>
            <Shield size={13} style={{ display: "inline", marginRight: 4 }} />
            Cybersecurity &amp; Technical Mastery Hub
          </div>
          <h2 style={{ margin: "6px 0 4px", fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
            Interactive Learning &amp; Security Academy
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
            Penetration Testing, Digital Forensics (DFIR), Incident Scenarios &amp; Remediation Walkthroughs
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => setShowQuizModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-md transition-all hover:scale-[1.02]"
            title="Start active recall flashcard test"
          >
            <Sparkles size={15} />
            <span>Active Recall Quiz</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            style={{
              ...tabBtnStyle,
              background: activeTab === "security" ? "#2563eb" : "var(--bg-card)",
              color: activeTab === "security" ? "#fff" : "var(--text-primary)",
              borderColor: activeTab === "security" ? "#2563eb" : "var(--border-color)",
            }}
          >
            <ShieldAlert size={15} />
            <span>Cybersecurity &amp; Forensics Hub</span>
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            style={{
              ...tabBtnStyle,
              background: activeTab === "questions" ? "#2563eb" : "var(--bg-card)",
              color: activeTab === "questions" ? "#fff" : "var(--text-primary)",
              borderColor: activeTab === "questions" ? "#2563eb" : "var(--border-color)",
            }}
          >
            <Award size={15} />
            <span>Top 200 Questions ({masteryPercentage}%)</span>
          </button>
          <button
            onClick={() => setActiveTab("gap")}
            style={{
              ...tabBtnStyle,
              background: activeTab === "gap" ? "#2563eb" : "var(--bg-card)",
              color: activeTab === "gap" ? "#fff" : "var(--text-primary)",
              borderColor: activeTab === "gap" ? "#2563eb" : "var(--border-color)",
            }}
          >
            <Brain size={15} />
            <span>Skill Gap Heatmap</span>
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            style={{
              ...tabBtnStyle,
              background: activeTab === "courses" ? "#2563eb" : "var(--bg-card)",
              color: activeTab === "courses" ? "#fff" : "var(--text-primary)",
              borderColor: activeTab === "courses" ? "#2563eb" : "var(--border-color)",
            }}
          >
            <GraduationCap size={15} />
            <span>Skill Courses ({(courses ?? []).length})</span>
          </button>
          {activeTab === "courses" && (
            <button onClick={() => setShowAdd(true)} style={addBtnStyle}>
              <Plus size={16} />
              <span>New Course</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB: CYBERSECURITY & FORENSICS HUB */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Sub Navigation Bar */}
          <div className="flex items-center justify-between gap-4 bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white m-0">Cybersecurity &amp; Incident Triage Specialization</h3>
                <p className="text-xs text-slate-400 m-0">Real-World Incident Walkthroughs, Memory Forensics, Exploit Remediation, &amp; DFIR Tools</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSecSubTab("scenarios")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  secSubTab === "scenarios"
                    ? "bg-blue-600 text-white border-blue-500 shadow-md"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <AlertTriangle size={14} className="inline mr-1.5 text-amber-400" />
                Real Incident Walkthroughs ({REAL_WORLD_SECURITY_SCENARIOS.length})
              </button>
              <button
                onClick={() => setSecSubTab("tools")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  secSubTab === "tools"
                    ? "bg-blue-600 text-white border-blue-500 shadow-md"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <Terminal size={14} className="inline mr-1.5" />
                DFIR Tool Cheatsheet ({FORENSICS_SECURITY_TOOLS.length})
              </button>
              <button
                onClick={() => setSecSubTab("courses")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  secSubTab === "courses"
                    ? "bg-blue-600 text-white border-blue-500 shadow-md"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <BookOpen size={14} className="inline mr-1.5" />
                Security Courses ({CYBERSECURITY_COURSES.length})
              </button>
              <button
                onClick={() => setSecSubTab("questions")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  secSubTab === "questions"
                    ? "bg-blue-600 text-white border-blue-500 shadow-md"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <FileSearch size={14} className="inline mr-1.5" />
                Security Q&amp;A ({CYBERSECURITY_QUESTIONS.length})
              </button>
            </div>
          </div>

          {/* SUB-TAB 0: REAL-WORLD INCIDENT SCENARIOS & STEP-BY-STEP REMEDIATION */}
          {secSubTab === "scenarios" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Real-World Incident Attack Vectors, Forensic Commands &amp; Step-By-Step Resolutions
                </span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {REAL_WORLD_SECURITY_SCENARIOS.length} Complete Incident Case Studies
                </span>
              </div>

              {REAL_WORLD_SECURITY_SCENARIOS.map((sc) => {
                const isExp = expandedIds[sc.id] ?? true;

                return (
                  <div
                    key={sc.id}
                    style={cardStyle}
                    className="border-l-4 border-l-blue-600 dark:border-l-blue-500 space-y-4 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => toggleExpand(sc.id)}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                            {sc.category}
                          </span>
                          <span className="text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                            Difficulty: {sc.difficulty}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
                          {sc.title}
                        </h3>
                      </div>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        {isExp ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>

                    {isExp && (
                      <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        {/* Threat Narrative Context */}
                        <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1">
                          <div className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-xs">
                            <AlertTriangle size={15} /> Incident Threat Narrative:
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed m-0">
                            {sc.threatContext}
                          </p>
                        </div>

                        {/* Attack Vector / Exploit Log Snippet */}
                        <div className="space-y-1.5">
                          <div className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Cpu size={14} className="text-rose-500" /> Attack Vector / Log Artifact:
                          </div>
                          <div className="relative bg-slate-900 text-rose-300 p-3.5 rounded-xl font-mono text-[11px] border border-slate-800 overflow-x-auto">
                            <pre className="m-0 whitespace-pre-wrap">{sc.attackVectorSnippet}</pre>
                          </div>
                        </div>

                        {/* Forensic Investigation Commands */}
                        <div className="space-y-1.5">
                          <div className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Terminal size={14} className="text-blue-500" /> Forensic Investigation &amp; Triage Commands:
                          </div>
                          <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] border border-slate-800 space-y-2">
                            {sc.investigationCommands.map((cmd, idx) => (
                              <div key={idx} className="flex items-start justify-between gap-2 border-b border-slate-800 pb-1.5 last:border-b-0 last:pb-0">
                                <span className="m-0 whitespace-pre-wrap flex-1">{cmd}</span>
                                <button
                                  onClick={() => handleCopyCommand(cmd)}
                                  className="text-blue-400 hover:text-white shrink-0 text-[10px] font-bold bg-slate-800 px-2 py-1 rounded"
                                >
                                  {copiedCmd === cmd ? "Copied!" : "Copy"}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Step-By-Step Resolution Protocol */}
                        <div className="space-y-1.5">
                          <div className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Wrench size={14} className="text-emerald-500" /> Step-by-Step Incident Resolution Protocol:
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                            {sc.resolutionSteps.map((step, idx) => (
                              <div key={idx} className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Remediation Patch Code */}
                        <div className="space-y-1.5">
                          <div className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Code size={14} className="text-blue-500" /> Production Remediation Code Patch / Firewall Rule:
                          </div>
                          <div className="relative group bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] border border-slate-800 overflow-x-auto">
                            <button
                              onClick={() => handleCopyCode(sc.id, sc.remediationCodeSnippet)}
                              className="absolute top-2.5 right-2.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <Copy size={12} />
                              {copiedId === sc.id ? "Copied!" : "Copy Code Patch"}
                            </button>
                            <pre className="m-0 whitespace-pre-wrap text-blue-300">{sc.remediationCodeSnippet}</pre>
                          </div>
                        </div>

                        {/* Preventative Best Practices */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Preventative Security Controls:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {sc.preventativeBestPractices.map((bp, idx) => (
                              <span key={idx} className="text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900">
                                Shield: {bp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* SUB-TAB 1: DFIR & PENETRATION TESTING TOOL CHEATSHEET */}
          {secSubTab === "tools" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FORENSICS_SECURITY_TOOLS.map((tool) => (
                <div key={tool.name} style={cardStyle} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <Terminal size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white m-0">{tool.name}</h4>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                          {tool.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 m-0 font-medium">{tool.purpose}</p>

                  <div className="relative bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] border border-slate-800 overflow-x-auto">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 border-b border-slate-800 pb-1">
                      <span>Command Snippet</span>
                      <button
                        onClick={() => handleCopyCommand(tool.commandExample)}
                        className="text-blue-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <Copy size={11} />
                        {copiedCmd === tool.commandExample ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="m-0 whitespace-pre-wrap text-emerald-400">{tool.commandExample}</pre>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <strong className="text-slate-700 dark:text-slate-300">DFIR / Pentest Use Case: </strong>
                    {tool.useCase}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUB-TAB 2: CYBERSECURITY & FORENSICS COURSES */}
          {secSubTab === "courses" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CYBERSECURITY_COURSES.map((course) => (
                <div key={course.id} style={cardStyle} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900">
                          {course.category}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {course.level} • {course.lessonsCount} Lessons ({course.durationMinutes} mins)
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
                        {course.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 m-0 font-medium leading-relaxed">
                    {course.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Key Syllabus Topics:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {course.keyTopics.map((topic) => (
                        <span key={topic} className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          ✓ {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {course.externalUrl && (
                    <div className="pt-2 flex justify-end">
                      <a
                        href={course.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>Explore Lab Resource</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SUB-TAB 3: INCIDENT RESPONSE & SECURITY INTERVIEW Q&A */}
          {secSubTab === "questions" && (
            <div className="space-y-3">
              {CYBERSECURITY_QUESTIONS.map((q) => {
                const isExpanded = !!expandedIds[q.id];
                return (
                  <div key={q.id} style={cardStyle} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => toggleExpand(q.id)}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                            {q.category}
                          </span>
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                            {q.difficulty}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white m-0">
                          {q.question}
                        </h4>
                      </div>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {q.answer}
                        </div>
                        {q.commandSnippet && (
                          <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                            <pre className="m-0 whitespace-pre-wrap">{q.commandSnippet}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: TOP 200 QUESTIONS BANK */}
      {activeTab === "questions" && (
        <div className="space-y-5">
          {/* Mastery Progress Indicator Bar */}
          <div style={cardStyle} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(37,99,235,0.12)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 }}>
                {masteryPercentage}%
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  Interview Preparation Progress
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {totalMastered} of 200 Core Interview Questions Mastered
                </div>
              </div>
            </div>
            <div className="w-full sm:w-64 bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                style={{ width: `${masteryPercentage}%`, transition: "width 0.4s" }}
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full"
              />
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={cardStyle} className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="flex-1 relative flex items-center">
                <Search size={16} className="absolute left-3.5 text-slate-400" />
                <input
                  style={inputStyle}
                  className="pl-10 pr-4"
                  placeholder="Search 200 questions, keywords, algorithms, SQL, OOP, patterns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Job Role Filter */}
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-slate-400 shrink-0" />
                <select
                  style={inputStyle}
                  className="w-auto font-semibold"
                  value={selectedJobRole}
                  onChange={(e) => setSelectedJobRole(e.target.value)}
                >
                  {JOB_ROLES.map((r) => (
                    <option key={r} value={r}>
                      Target Role: {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Groups Pills */}
            <div className="flex gap-2 flex-wrap pt-1">
              <button
                onClick={() => setSelectedGroup("all")}
                style={{
                  ...filterBtn,
                  background: selectedGroup === "all" ? "#2563eb" : "var(--input-bg)",
                  color: selectedGroup === "all" ? "#fff" : "var(--text-primary)",
                  borderColor: selectedGroup === "all" ? "#2563eb" : "var(--border-color)",
                }}
              >
                All 9 Modules (200 Qs)
              </button>
              {QUESTION_CATEGORY_GROUPS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g.id)}
                  style={{
                    ...filterBtn,
                    background: selectedGroup === g.id ? "#2563eb" : "var(--input-bg)",
                    color: selectedGroup === g.id ? "#fff" : "var(--text-primary)",
                    borderColor: selectedGroup === g.id ? "#2563eb" : "var(--border-color)",
                  }}
                >
                  {g.icon} {g.title.split(". ")[1]} ({g.count})
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold">
            <span>Showing {filteredQuestions.length} questions</span>
            <button
              onClick={() => {
                const allExp: Record<number, boolean> = {};
                filteredQuestions.forEach((q) => (allExp[q.id] = true));
                setExpandedIds(allExp);
              }}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Expand All Solutions
            </button>
          </div>

          {/* Question Cards Grid */}
          <div className="space-y-3">
            {filteredQuestions.map((q) => {
              const isMastered = !!masteredIds[q.id];
              const isExpanded = !!expandedIds[q.id];

              return (
                <div
                  key={q.id}
                  style={{
                    ...cardStyle,
                    borderColor: isMastered ? "rgba(16,185,129,0.4)" : "var(--border-color)",
                    background: isMastered ? "rgba(16,185,129,0.03)" : "var(--bg-card)",
                  }}
                  className="transition-all"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => toggleExpand(q.id)}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMastered(q.id);
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition-colors mt-0.5 ${
                          isMastered
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 dark:border-slate-700 text-transparent hover:border-emerald-500"
                        }`}
                        title={isMastered ? "Mark as Review Needed" : "Mark as Mastered"}
                      >
                        <Check size={14} className="stroke-[3]" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                            Q{q.id}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {q.category}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              q.difficulty === "Beginner"
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                : q.difficulty === "Intermediate"
                                ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                                : q.difficulty === "Advanced"
                                ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                                : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                          {q.question}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="hidden sm:flex gap-1">
                        {q.jobTypes.map((jt) => (
                          <span key={jt} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded">
                            {jt}
                          </span>
                        ))}
                      </div>
                      <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Solution & Code Snippet */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                      <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {q.answer}
                      </div>

                      {q.codeSnippet && (
                        <div className="relative group bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                          <button
                            onClick={() => handleCopyCode(q.id, q.codeSnippet!)}
                            className="absolute top-2.5 right-2.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Copy size={12} />
                            {copiedId === q.id ? "Copied!" : "Copy Code"}
                          </button>
                          <pre className="m-0 whitespace-pre-wrap">{q.codeSnippet}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredQuestions.length === 0 && (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-color)" }}>
                <BookOpen size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div style={{ fontSize: 14 }}>No interview questions found matching your filter criteria.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SKILL COURSES */}
      {activeTab === "courses" && (
        <div>
          {/* Category filter pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  ...filterBtn,
                  background: category === c ? "#2563eb" : "var(--bg-card)",
                  color: category === c ? "#ffffff" : "var(--text-primary)",
                  borderColor: category === c ? "#2563eb" : "var(--border-color)",
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Course list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(courses ?? []).map((course) => {
              const pct = Math.round((course.lessons_completed / course.lesson_count) * 100);
              return (
                <div key={course.id} style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                          {course.title}
                        </h4>
                        {course.status === "in_progress" && (
                          <span style={badgeBlue}>In Progress</span>
                        )}
                        {course.status === "complete" && (
                          <span style={badgeGreen}>Complete</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                        {course.category} • {course.level} • {course.lesson_count} lessons
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCourse.mutate(course.id)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: "100%", background: "var(--input-bg)", borderRadius: 99, height: 8, marginBottom: 10, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#2563eb", borderRadius: 99, transition: "width 0.3s" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {course.lessons_completed} of {course.lesson_count} lessons ({pct}%)
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {course.url && (
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}
                        >
                          <span>Open resource</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                      <button
                        disabled={course.lessons_completed >= course.lesson_count}
                        onClick={() => updateProgress.mutate({ courseId: course.id, lessonsCompleted: course.lessons_completed + 1 })}
                        style={{
                          ...lessonBtnStyle,
                          opacity: course.lessons_completed >= course.lesson_count ? 0.4 : 1,
                          cursor: course.lessons_completed >= course.lesson_count ? "not-allowed" : "pointer",
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>+1 Lesson</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {(courses ?? []).length === 0 && (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-color)" }}>
                <BookOpen size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div style={{ fontSize: 14 }}>No learning courses in this category yet.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TARGET JOB SKILL GAP HEATMAP & LEARNING PATH */}
      {activeTab === "gap" && (
        <div className="space-y-6">
          {isLoadingGap && (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
              Analyzing target job skills &amp; candidate profile…
            </div>
          )}

          {!isLoadingGap && skillGapData && (
            <>
              {/* Target Job & Known Skills Overview Banner */}
              <div style={cardStyle} className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-400/30">
                        Market Intelligence
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">AI Job Market Coverage</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-white m-0 tracking-tight">
                      Target Job Market Skill Gap Heatmap
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-800/80 p-3.5 rounded-2xl border border-indigo-500/30">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                      {skillGapData.total_jobs_analyzed}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Market Scope</div>
                      <div className="text-sm font-bold text-white">
                        Target Jobs Analyzed
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Known Skills Pills */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Candidate Proven Skills ({skillGapData.candidate_known_skills.length} Detected in Profile &amp; CVs):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {skillGapData.candidate_known_skills.map((sk) => (
                      <span key={sk} className="text-xs bg-emerald-950/80 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-md border border-emerald-800">
                        ✓ {sk}
                      </span>
                    ))}
                    {skillGapData.candidate_known_skills.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No skills imported yet. Upload a CV or update your profile skills.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Missing Skills Grid & Heatmap */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white m-0 flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-500" />
                    Top Missing Market Skills ({skillGapData.top_missing_skills.length} Gaps Identified)
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">Ranked by frequency in market target jobs</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skillGapData.top_missing_skills.map((item) => {
                    const isHighDemand = item.target_job_pct >= 50;

                    return (
                      <div
                        key={item.skill}
                        style={cardStyle}
                        className={`space-y-3 border-l-4 ${
                          isHighDemand
                            ? "border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900"
                            : "border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
                            {item.skill}
                          </h5>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                              isHighDemand
                                ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                                : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            }`}
                          >
                            Required in {item.target_job_pct}% of Target Jobs
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 m-0 font-medium leading-relaxed">
                          {item.recommendation}
                        </p>

                        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
                          <span className="text-slate-500 font-semibold">Missing in {item.missing_count} target openings</span>
                          <button
                            onClick={() =>
                              createCourse.mutate({
                                title: `Mastering ${item.skill}`,
                                category: "Skill Track",
                                lesson_count: 10,
                                linked_skill: item.skill,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
                          >
                            <Plus size={14} />
                            <span>1-Click Add Course</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {showAdd && <AddCourseModal onClose={() => setShowAdd(false)} />}
      <QuizModeModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onQuestionMastered={(id, isCyber) => (isCyber ? toggleCybersecMastered(id) : toggleMastered(id))}
      />
    </div>
  );
}

function AddCourseModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Cybersecurity");
  const [lessonCount, setLessonCount] = useState(10);
  const createCourse = useCreateCourse();

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>New Course</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>Admin catalog management</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <input style={inputStyle} placeholder="Course title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="number"
            style={inputStyle}
            placeholder="Total lesson count"
            value={lessonCount}
            onChange={(e) => setLessonCount(parseInt(e.target.value) || 1)}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            disabled={!title.trim()}
            onClick={() => createCourse.mutate({ title, category, lesson_count: lessonCount }, { onSuccess: onClose })}
            style={{ ...modalBtnStyle, opacity: !title.trim() ? 0.5 : 1, cursor: !title.trim() ? "not-allowed" : "pointer" }}
          >
            Create Course
          </button>
          <button onClick={onClose} style={modalCancelStyle}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const bannerStyle: React.CSSProperties = {
  background: "linear-gradient(135deg,rgba(37,99,235,0.12) 0%,rgba(29,78,216,0.04) 100%)",
  border: "1px solid rgba(59,130,246,0.2)",
  borderRadius: 18,
  padding: "22px 26px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
};
const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: 11,
  fontWeight: 700,
  color: "#2563eb",
  background: "rgba(37,99,235,0.12)",
  padding: "3px 10px",
  borderRadius: 99,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
const tabBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 16px",
  fontSize: 12,
  fontWeight: 700,
  borderRadius: 12,
  border: "1px solid",
  cursor: "pointer",
  transition: "all 0.15s",
};
const addBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "none",
  borderRadius: 12,
  color: "#fff",
  padding: "9px 16px",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
};
const filterBtn: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 10,
  padding: "6px 12px",
  border: "1px solid",
  cursor: "pointer",
  transition: "all 0.15s",
};
const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: 16,
  border: "1px solid var(--border-color)",
  padding: "18px 20px",
};
const badgeBlue: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  background: "rgba(37,99,235,0.12)",
  color: "#2563eb",
  border: "1px solid rgba(37,99,235,0.25)",
  padding: "2px 10px",
  borderRadius: 99,
};
const badgeGreen: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  background: "rgba(16,185,129,0.12)",
  color: "#10b981",
  border: "1px solid rgba(16,185,129,0.25)",
  padding: "2px 10px",
  borderRadius: 99,
};
const lessonBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "#059669",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "7px 14px",
  fontSize: 12,
  fontWeight: 700,
};
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  padding: 16,
};
const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "var(--modal-bg)",
  border: "1px solid var(--border-color)",
  borderRadius: 20,
  padding: 24,
  boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--input-bg)",
  border: "1px solid var(--input-border)",
  color: "var(--text-primary)",
  borderRadius: 10,
  padding: "9px 13px",
  fontSize: 13,
  outline: "none",
};
const modalBtnStyle: React.CSSProperties = {
  flex: 1,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 0",
  fontSize: 13,
  fontWeight: 700,
};
const modalCancelStyle: React.CSSProperties = {
  flex: 1,
  background: "var(--input-bg)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-color)",
  borderRadius: 10,
  padding: "10px 0",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
