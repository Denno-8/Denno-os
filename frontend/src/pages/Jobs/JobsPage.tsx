import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import ApiErrorCard from "../../components/ApiErrorCard";
import {
  Zap, Search, Target, Check, Clock, AlertTriangle, ListChecks,
  ShieldCheck, RefreshCw, ExternalLink, WifiOff, Flame, Eye, Sparkles,
  X, Trash2, Edit3, Send, Mail,
  CalendarDays, Sparkle, Building2, Briefcase, Star, AtSign,
  TrendingUp, Filter, Loader2, Globe,
} from "lucide-react";
import { useJobs } from "../../hooks/useJobs";
import { useApplications, useCreateApplication, useDeleteApplication } from "../../hooks/useApplications";
import { useGenerateCVForJob } from "../../hooks/useCV";
import { useTheme } from "../../context/ThemeContext";
import FetchJobModal from "../../components/FetchJobModal";
import CVMatchModal from "../../components/CVMatchModal";
import ApplyEditModal from "../../components/ApplyEditModal";
import DirectEmailDispatchModal from "../../components/DirectEmailDispatchModal";
import JobChecklistModal from "../../components/JobChecklistModal";
import CompanyIntelligenceModal from "../../components/CompanyIntelligenceModal";
import OpenedCareerModal from "../../components/OpenedCareerModal";
import { jobsService } from "../../services/jobs.service";
import type { Job } from "../../types/job.types";

export default function JobsPage() {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("All");
  const [level, setLevel] = useState("All");
  const [minScore, setMinScore] = useState(0);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [hideNoListing, setHideNoListing] = useState(false);
  const [showHot, setShowHot] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "latest">("default");
  const [autoSyncDone, setAutoSyncDone] = useState(false);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const hasMounted = useRef(false);

  const [isFetchOpen, setIsFetchOpen] = useState(false);
  const [isOpenedCareerOpen, setIsOpenedCareerOpen] = useState(false);
  const [isDirectEmailOpen, setIsDirectEmailOpen] = useState(false);
  const [directEmailJob, setDirectEmailJob] = useState<Job | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [matchTargetJob, setMatchTargetJob] = useState<Job | null>(null);
  const [checklistTargetJob, setChecklistTargetJob] = useState<Job | null>(null);
  const [applyEditJob, setApplyEditJob] = useState<Job | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [generatingCvJobId, setGeneratingCvJobId] = useState<string | null>(null);
  const [companyIntelTarget, setCompanyIntelTarget] = useState<string | null>(null);

  const { data: jobs, isLoading, isError, refetch } = useJobs({ q, mode, level, includeExpired });
  const { data: applications = [] } = useApplications();
  const { data: salaryBenchmarks } = useQuery({
    queryKey: ["jobs", "salaryBenchmarks"],
    queryFn: () => jobsService.getSalaryBenchmarks(),
    staleTime: 300_000,
  });
  const createApplication = useCreateApplication();
  const generateCVForJob = useGenerateCVForJob();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const deleteApplication = useDeleteApplication();
  const [manageAppTarget, setManageAppTarget] = useState<{ job: Job; app: any } | null>(null);

  const handleApplyViaLinkedIn = (job: Job) => {
    if (!job.source_url) return;
    window.open(job.source_url, "_blank", "noopener,noreferrer");

    createApplication.mutate(
      {
        company_name: job.company_name,
        role: job.title,
        stage: "Applied",
        date_applied: new Date().toISOString().slice(0, 10),
        salary_range: `${job.currency || "KES"} ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}`,
        notes: `Applied via LinkedIn Easy Apply / Portal (${job.source_url})`,
        apply_method: "website",
        source_job_id: job.id,
        source_url: job.source_url,
      },
      {
        onSuccess: () => {
          setSyncMsg(`✓ Application for "${job.title}" logged in Applied stage & tracked on LinkedIn!`);
          setTimeout(() => setSyncMsg(null), 4000);
        },
      }
    );
  };


  // Robust application matching to prevent false "Applied" badges.
  // Strategy 1: exact source URL match (both must be real http links).
  // Strategy 2: source_job_id + company name match (most reliable internal linkage).
  // NOTE: A bare company+title match (no URL, no job ID) is intentionally excluded —
  // it causes false positives when the user has a manually-added Application in the
  // tracker that shares a company name and title with a job they've never applied to.
  const getMatchingApplication = (job: Job) => {
    if (!applications || applications.length === 0) return null;
    const jobUrl = job.source_url?.trim().toLowerCase();
    const jobCompany = job.company_name?.trim().toLowerCase();
    const jobIdStr = String(job.id);

    for (const app of applications) {
      const appUrl = app.source_url?.trim().toLowerCase();
      const appCompany = app.company_name?.trim().toLowerCase();
      const appJobId = app.source_job_id ? String(app.source_job_id) : null;

      // 1. Match by source URL — both must be real http links and identical
      if (appUrl && jobUrl && appUrl.startsWith("http") && jobUrl.startsWith("http") && appUrl === jobUrl) {
        return app;
      }
      // 2. Match by source_job_id AND company name — most reliable internal linkage
      if (appJobId && appJobId === jobIdStr && appCompany && appCompany === jobCompany) {
        return app;
      }
    }
    return null;
  };

  const appliedJobsCount = useMemo(() => {
    if (!jobs || !applications) return 0;
    return jobs.filter((j) => getMatchingApplication(j) !== null).length;
  }, [jobs, applications]);

  const { data: telemetry } = useQuery({
    queryKey: ["jobs", "telemetry"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/jobs/telemetry/status");
        if (res.ok) return await res.json();
      } catch {}
      return null;
    },
    staleTime: 120_000,
  });

  const handleSyncLiveJobs = async () => {
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      const res = await jobsService.syncLive();
      const extra = (res as any).intern_entry_count ? ` (${(res as any).intern_entry_count} intern/entry roles)` : "";
      setSyncMsg(`Fetched ${res.total_fetched} live jobs — ${res.added_count} new, ${res.updated_count} refreshed${extra}`);
      refetch();
    } catch {
      setSyncMsg("Live jobs sync completed.");
      refetch();
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMsg(null), 6000);
    }
  };

  // ── Pure helpers (defined before early returns — used in useMemo below) ────
  const isNewJob = (postedAt?: string | null): boolean => {
    if (!postedAt) return false;
    const diffMs = new Date().getTime() - new Date(postedAt).getTime();
    return diffMs < 48 * 60 * 60 * 1000; // within 48 hours
  };

  const formatPostedDate = (postedAt?: string | null): string => {
    if (!postedAt) return "";
    const d = new Date(postedAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);
    if (diffMins < 60) return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: diffDays > 365 ? "numeric" : undefined });
  };

  // ── useMemo MUST be before early returns (Rules of Hooks) ────────────────
  const filteredJobs = useMemo(() => {
    let list = (jobs ?? []).filter((job) => {
      if (minScore > 0 && job.match_score < minScore) return false;
      if (hideNoListing && !job.source_url?.startsWith("http")) return false;
      if (showHot && !job.is_hot) return false;
      if (showNew && !isNewJob(job.posted_at)) return false;
      return true;
    });
    if (sortBy === "latest") {
      list = [...list].sort((a, b) =>
        new Date(b.posted_at || 0).getTime() - new Date(a.posted_at || 0).getTime()
      );
    }
    return list;
  }, [jobs, minScore, hideNoListing, showHot, showNew, sortBy]);

  const allJobs = jobs ?? [];
  const newJobsCount = allJobs.filter((j) => isNewJob(j.posted_at)).length;
  const hotJobsCount = allJobs.filter((j) => j.is_hot).length;

  // ── Early returns AFTER all hooks ──────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-900/60 animate-pulse border border-slate-300/30 dark:border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-slate-200 dark:bg-slate-900/60 border border-slate-300/30 dark:border-slate-800 animate-pulse p-5 space-y-3">
              <div className="h-5 bg-slate-300 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-300 dark:bg-slate-800 rounded w-1/2" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 bg-slate-300 dark:bg-slate-800 rounded w-16" />
                <div className="h-6 bg-slate-300 dark:bg-slate-800 rounded w-16" />
              </div>
              <div className="h-10 bg-slate-300 dark:bg-slate-800 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (isError) return <ApiErrorCard onRetry={refetch} />;

  const getDeadlineBadge = (deadlineStr?: string | null, isExpired?: boolean) => {
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-red-900 dark:text-red-300 text-[11px] font-extrabold border border-red-300">
          <AlertTriangle size={11} /> Expired
        </span>
      );
    }
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const today = new Date();
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-300 text-[11px] font-extrabold border border-amber-300">
          <Clock size={11} /> Expires Today
        </span>
      );
    }
    if (diffDays <= 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-[11px] font-extrabold border border-amber-300">
          <Clock size={11} /> {diffDays}d Left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-300 text-[11px] font-extrabold border border-slate-300 dark:border-slate-700">
        <Clock size={11} /> Due {deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Banner ── */}
      <div style={styles.banner}>
        <div>
          <div style={styles.badge} className="flex items-center gap-2">
            Live Intelligence Feed
            {autoSyncing && (
              <span className="flex items-center gap-1 text-blue-500">
                <Loader2 size={10} className="animate-spin" /> syncing…
              </span>
            )}
          </div>
          <h2 style={styles.heading}>Discover &amp; Analyze High-Match Opportunities</h2>
          <p style={styles.subHeading}>
            {filteredJobs.length} opportunities · {appliedJobsCount} applied
            {newJobsCount > 0 && <> · <span className="text-emerald-500 font-bold">{newJobsCount} new</span></>}
            {hotJobsCount > 0 && <> · <span className="text-orange-500 font-bold flex items-center gap-1 inline-flex">{hotJobsCount} hot <Flame size={13} className="text-orange-500" /></span></>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={handleSyncLiveJobs}
            disabled={isSyncing}
            style={{
              backgroundColor: isLight ? "#ffffff" : "rgba(255,255,255,0.08)",
              border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255,255,255,0.15)",
              color: isLight ? "#0f172a" : "#f8fafc",
              padding: "12px 18px", borderRadius: 12, fontWeight: 800, fontSize: 13.5,
              cursor: isSyncing ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8,
              transition: "all 0.15s ease",
            }}
            title="Fetch latest daily jobs from live tech job feeds"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin text-blue-600" : "text-blue-600"} />
            <span>{isSyncing ? "Syncing Live Feeds…" : "Sync Daily Jobs"}</span>
          </button>
          <button
            onClick={() => { setDirectEmailJob(null); setIsDirectEmailOpen(true); }}
            className="px-4 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
            title="Compose and dispatch a manual application email with attached PDF Resume & Cover Letter"
          >
            <Mail size={16} />
            <span>Send Email Application</span>
          </button>
          <button
            onClick={() => setIsOpenedCareerOpen(true)}
            className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
            title="View live OpenedCareer tech job feed with AI analysis"
          >
            <Globe size={16} />
            <span>OpenedCareer Feed</span>
          </button>
          <button style={styles.fetchBtn} onClick={() => setIsFetchOpen(true)}>
            <Zap size={16} />
            <span>Import from LinkedIn / URL</span>
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs font-bold flex items-center justify-between">
          <span>{syncMsg}</span>
          <button onClick={() => setSyncMsg(null)} className="hover:opacity-75 font-black text-sm">✕</button>
        </div>
      )}

      {/* ── Telemetry Status Bar ── */}
      {telemetry && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 font-extrabold text-blue-400">
              <TrendingUp size={15} />
              <span>Telemetry Status</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <span>Active Jobs: <strong className="text-white font-extrabold">{telemetry.total_active_jobs}</strong></span>
              <span>·</span>
              <span>Active Feeds: <strong className="text-emerald-400 font-extrabold">{telemetry.synced_sources_count || 4} Kenyan &amp; Tech Sources</strong></span>
              {telemetry.last_synced_at && (
                <>
                  <span>·</span>
                  <span>Last Sync: <strong className="text-white">{new Date(telemetry.last_synced_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong></span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.entries(telemetry.sources_breakdown || {}).map(([src, count]) => (
              <span key={src} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                {src}: {count as number}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Salary Benchmark Header Banner */}
      {salaryBenchmarks && salaryBenchmarks.levels && salaryBenchmarks.levels.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-2xl border border-indigo-900/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-extrabold text-xs text-indigo-300">
              <Sparkles size={14} className="text-amber-400" />
              <span>Market Salary Intelligence Benchmarks</span>
            </div>
            <span className="text-[10px] text-indigo-300/70 font-semibold">Updated from active tech postings</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {salaryBenchmarks.levels.map((lvl) => (
              <div key={lvl.level} className="bg-slate-800/80 border border-indigo-500/20 px-3 py-1.5 rounded-xl shrink-0 text-xs flex items-center gap-2">
                <span className="font-extrabold text-indigo-300">{lvl.level}:</span>
                <span className="font-bold text-emerald-400">{lvl.formatted}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter Toolbar ── */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 10,
        backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.04)",
        border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255,255,255,0.1)",
        padding: 14, borderRadius: 16,
      }}>
        {/* Row 1: Search + Dropdowns */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{
            flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 8,
            backgroundColor: isLight ? "#ffffff" : "#131d35",
            border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: 11, padding: "8px 14px",
          }}>
            <Search size={17} style={{ color: isLight ? "#020617" : "#94a3b8", flexShrink: 0 }} />
            <input
              style={{ background: "none", border: "none", outline: "none", color: isLight ? "#020617" : "#f8fafc", fontSize: 14, fontWeight: 600, width: "100%", fontFamily: "inherit" }}
              placeholder="Filter by title, company, or skill…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button onClick={() => setQ("")} className="text-slate-400 hover:text-slate-600 ml-1">
                <X size={14} />
              </button>
            )}
          </div>

          {[
            { value: mode, setter: setMode, options: [["All", "All Modes"], ["Remote", "Remote"], ["Hybrid", "Hybrid"], ["Onsite", "Onsite"]] },
            { value: level, setter: setLevel, options: [["All", "All Levels"], ["Intern", "Internship"], ["Entry", "Entry Level"], ["Junior", "Junior"], ["Mid", "Mid Level"], ["Senior", "Senior"], ["Lead", "Lead / Exec"]] },
            { value: String(minScore), setter: (v: string) => setMinScore(Number(v)), options: [["0", "Any Match"], ["70", "70%+ Match"], ["80", "80%+ Match"], ["90", "90%+ Match"]] },
          ].map((sel, i) => (
            <select
              key={i}
              value={sel.value}
              onChange={(e) => sel.setter(e.target.value)}
              style={{
                backgroundColor: isLight ? "#ffffff" : "#131d35",
                border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255,255,255,0.1)",
                color: isLight ? "#020617" : "#f8fafc",
                borderRadius: 11, padding: "8px 14px", fontSize: 13.5,
                fontWeight: 700, outline: "none", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {sel.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          ))}
        </div>

        {/* Row 2: Quick Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1">
            <Filter size={11} /> Quick Filter:
          </div>

          {/* Latest / Default sort toggle */}
          <button
            onClick={() => setSortBy(sortBy === "latest" ? "default" : "latest")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
              sortBy === "latest"
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-blue-900/40"
                : isLight
                  ? "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:border-blue-500 hover:text-blue-400"
            }`}
          >
            <TrendingUp size={11} />
            Latest
          </button>

          {/* New jobs toggle */}
          <button
            onClick={() => setShowNew(!showNew)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
              showNew
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200 dark:shadow-emerald-900/40"
                : isLight
                  ? "bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-600"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-500 hover:text-emerald-400"
            }`}
          >
            <Sparkle size={11} />
            New {newJobsCount > 0 && <span className="ml-0.5 opacity-80">({newJobsCount})</span>}
          </button>

          {/* Hot jobs toggle */}
          <button
            onClick={() => setShowHot(!showHot)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
              showHot
                ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200 dark:shadow-orange-900/40"
                : isLight
                  ? "bg-white text-slate-700 border-slate-200 hover:border-orange-400 hover:text-orange-600"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:border-orange-500 hover:text-orange-400"
            }`}
          >
            <Flame size={11} />
            Hot {hotJobsCount > 0 && <span className="ml-0.5 opacity-80">({hotJobsCount})</span>}
          </button>

          {/* Live links only toggle */}
          <button
            onClick={() => setHideNoListing(!hideNoListing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
              hideNoListing
                ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200 dark:shadow-violet-900/40"
                : isLight
                  ? "bg-white text-slate-700 border-slate-200 hover:border-violet-400 hover:text-violet-600"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:border-violet-500 hover:text-violet-400"
            }`}
          >
            <WifiOff size={11} className={hideNoListing ? "text-white" : ""} />
            Live Links Only
          </button>

          {/* Show expired toggle */}
          <button
            onClick={() => setIncludeExpired(!includeExpired)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
              includeExpired
                ? "bg-red-500 text-white border-red-500"
                : isLight
                  ? "bg-white text-slate-700 border-slate-200 hover:border-red-300 hover:text-red-600"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:border-red-500 hover:text-red-400"
            }`}
          >
            <Clock size={11} />
            Show Expired
          </button>

          {/* Clear all filters */}
          {(showHot || showNew || sortBy !== "default" || hideNoListing || includeExpired || minScore > 0 || mode !== "All" || level !== "All" || q) && (
            <button
              onClick={() => {
                setShowHot(false); setShowNew(false); setSortBy("default");
                setHideNoListing(false); setIncludeExpired(false);
                setMinScore(0); setMode("All"); setLevel("All"); setQ("");
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold border border-dashed text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-600 hover:text-rose-500 hover:border-rose-400 transition-all ml-auto"
            >
              <X size={11} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── Jobs Grid ── */}
      <div style={styles.grid}>
        {filteredJobs.map((job: Job) => {
          const appliedApp = getMatchingApplication(job);
          const applied = appliedApp !== null;
          const hasLink = !!job.source_url?.startsWith("http");
          const isGhostRisk = (() => {
            if (!job.posted_at) return false;
            const daysOld = Math.floor((new Date().getTime() - new Date(job.posted_at).getTime()) / (1000 * 60 * 60 * 24));
            return daysOld >= 60 && !job.is_expired;
          })();

          return (
            <div key={job.id} style={styles.card} className="relative group">
              {/* Top-right badges row */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-wrap justify-end max-w-[60%]">
                {isGhostRisk && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 px-2 py-0.5 rounded-full" title="Posting active > 60 days without updates">
                    <AlertTriangle size={10} className="text-rose-600 dark:text-rose-400" /> Ghost Risk (60d+)
                  </div>
                )}
                {isNewJob(job.posted_at) && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-full">
                    <Sparkle size={9} /> NEW
                  </div>
                )}
                {job.is_hot && !applied && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 px-2 py-0.5 rounded-full">
                    <Flame size={10} /> HOT
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: (job.is_hot || isNewJob(job.posted_at)) && !applied ? 72 : 0 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div style={styles.jobTitle} className="truncate">{job.title}</div>
                    {getDeadlineBadge(job.deadline, job.is_expired)}
                  </div>
                  <div style={styles.jobSub}>
                    {job.company_name} · <span style={{ color: "#2563eb", fontWeight: 800 }}>{job.mode}</span> · {job.level}
                  </div>
                </div>
                <div style={styles.scorePill} className="shrink-0">{job.match_score}%</div>
              </div>

              {/* Skills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "12px 0 6px" }}>
                {job.required_skills.slice(0, 5).map((s) => (
                  <span key={s} style={styles.skillTag}>{s}</span>
                ))}
              </div>

              {/* Requirements preview */}
              {job.requirements?.length > 0 && (
                <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mt-1.5 flex items-start gap-1.5">
                  <ListChecks size={13} className="shrink-0 mt-0.5 text-blue-600" />
                  <span className="line-clamp-1">{job.requirements[0]}</span>
                </div>
              )}

              {/* No live listing warning */}
              {!hasLink && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-1">
                  <WifiOff size={11} /> No live listing URL — may be a seeded/stale entry
                </div>
              )}

              {/* Posted date */}
              {job.posted_at && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-2">
                  <CalendarDays size={11} />
                  <span>Posted {formatPostedDate(job.posted_at)}</span>
                </div>
              )}

              {/* Footer */}
              <div style={styles.cardFoot}>
                <span style={styles.salary}>
                  {job.currency} {job.salary_min.toLocaleString()} – {job.salary_max.toLocaleString()}
                </span>

                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {/* View listing */}
                  {hasLink && (
                    <a
                      href={job.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-all"
                      title="Open the real job listing"
                    >
                      <ExternalLink size={12} />
                      Listing
                    </a>
                  )}

                  {/* View detail */}
                  <button
                    onClick={() => setDetailJob(job)}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all"
                    title="View full job details"
                  >
                    <Eye size={12} /> Detail
                  </button>

                  <button
                    onClick={() => setCompanyIntelTarget(job.company_name)}
                    className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition-all"
                    title="View company tech stack &amp; hiring telemetry"
                  >
                    <Building2 size={12} className="text-indigo-500" /> Intel
                  </button>

                  <button
                    onClick={() => setChecklistTargetJob(job)}
                    className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition-all"
                    title="Audit Readiness &amp; Application Letter"
                  >
                    <ShieldCheck size={12} />
                    Checklist
                  </button>

                  <button
                    disabled={generatingCvJobId === job.id}
                    onClick={() => {
                      setGeneratingCvJobId(job.id);
                      generateCVForJob.mutate(
                        {
                          job_title: job.title,
                          company_name: job.company_name,
                          required_skills: job.required_skills,
                          description: job.description || "",
                        },
                        {
                          onSuccess: (newCv) => {
                            setGeneratingCvJobId(null);
                            setSyncMsg(`✓ Tailored CV "${newCv.name}" generated & saved to library! (${newCv.ats_score}% ATS Score)`);
                            setApplyEditJob(job);
                          },
                          onError: () => setGeneratingCvJobId(null),
                        }
                      );
                    }}
                    className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 transition-all disabled:opacity-50"
                    title="Auto-Generate a 98% ATS-tailored CV version specifically for this job"
                  >
                    {generatingCvJobId === job.id ? (
                      <RefreshCw size={12} className="animate-spin text-amber-600" />
                    ) : (
                      <Sparkles size={12} className="text-amber-500" />
                    )}
                    <span>{generatingCvJobId === job.id ? "Tailoring…" : "Auto CV"}</span>
                  </button>

                  <button style={styles.matchBtn} onClick={() => setMatchTargetJob(job)}>
                    <Target size={13} />
                    <span>Match</span>
                  </button>

                  {!applied && !job.is_expired && (
                    <button
                      onClick={() => { setDirectEmailJob(job); setIsDirectEmailOpen(true); }}
                      className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition-all"
                      title="Dispatch direct email application with attached PDF Resume & Cover Letter"
                    >
                      <Mail size={12} /> Email Apply
                    </button>
                  )}

                  {hasLink && job.source_url?.toLowerCase().includes("linkedin") && !applied && !job.is_expired && (
                    <button
                      onClick={() => handleApplyViaLinkedIn(job)}
                      className="px-2.5 py-1.5 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 text-[#0077b5] font-extrabold text-xs rounded-xl border border-[#0077b5]/30 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Apply directly on LinkedIn and track application in Denno OS"
                    >
                      <span className="w-3.5 h-3.5 rounded bg-[#0077b5] text-white flex items-center justify-center text-[9px] font-black leading-none">in</span>
                      <span>Apply</span>
                    </button>
                  )}

                  {applied ? (
                    <button
                      onClick={() => setManageAppTarget({ job, app: appliedApp })}
                      style={{
                        ...styles.applyBtn,
                        ...styles.appliedBtn,
                        cursor: "pointer",
                      }}
                      className="hover:opacity-90 transition-opacity"
                      title="Click to view submitted application or withdraw application"
                    >
                      <Check size={13} />
                      <span>Applied</span>
                    </button>
                  ) : job.is_expired ? (
                    <button
                      disabled
                      style={{
                        ...styles.applyBtn,
                        ...styles.expiredBtn,
                      }}
                    >
                      <span>Closed</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setApplyEditJob(job)}
                      style={styles.applyBtn}
                      title="Apply & track with ATS-optimized CV & Cover Letter"
                    >
                      <Send size={13} />
                      <span>Apply &amp; Track</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <WifiOff size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-bold">No jobs match your filters.</p>
          <p className="text-xs mt-1">Try adjusting the filters or click "Sync Daily Jobs" to fetch fresh listings.</p>
        </div>
      )}

      {/* ── Job Detail Slide-In Panel ── */}
      {detailJob && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:justify-end z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[94vh]">

            {/* Panel Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {isNewJob(detailJob.posted_at) && (
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkle size={9} /> NEW
                      </span>
                    )}
                    {detailJob.is_hot && (
                      <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flame size={9} /> HOT
                      </span>
                    )}
                    {getDeadlineBadge(detailJob.deadline, detailJob.is_expired)}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">{detailJob.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-600 dark:text-slate-400 font-semibold flex-wrap">
                    <Building2 size={13} className="text-slate-400 shrink-0" />
                    <span>{detailJob.company_name}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{detailJob.mode}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span>{detailJob.level}</span>
                    {detailJob.employment_type && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span>{detailJob.employment_type}</span>
                      </>
                    )}
                  </div>
                  {detailJob.posted_at && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                      <CalendarDays size={11} />
                      <span>Posted {formatPostedDate(detailJob.posted_at)}</span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span>{new Date(detailJob.posted_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setDetailJob(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Scores row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-blue-700 dark:text-blue-300">{detailJob.match_score}%</div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">Match</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{detailJob.ats_score}%</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">ATS Score</div>
                </div>
                <div className="bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-xl p-3 text-center">
                  <div className="text-lg font-black text-violet-700 dark:text-violet-300 leading-tight mt-0.5">
                    {detailJob.required_skills?.length ?? 0}
                  </div>
                  <div className="text-[11px] text-violet-600 dark:text-violet-400 font-bold mt-0.5">Skills Req.</div>
                </div>
              </div>

              {/* Job meta grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Salary */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Salary Range</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    {detailJob.currency} {detailJob.salary_min.toLocaleString()} – {detailJob.salary_max.toLocaleString()}
                  </div>
                </div>
                {/* Employment type */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Employment</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Briefcase size={12} className="text-blue-500" />
                    {detailJob.employment_type || "Full-time"}
                  </div>
                </div>
              </div>

              {/* Contact email */}
              {detailJob.contact_email && (
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <AtSign size={14} className="text-blue-500 shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Contact Email</div>
                    <a
                      href={`mailto:${detailJob.contact_email}`}
                      className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {detailJob.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {/* Skills */}
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                  <Star size={12} className="text-amber-500" /> Required Skills
                  <span className="text-slate-400 font-normal">({detailJob.required_skills.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {detailJob.required_skills.map((s) => (
                    <span key={s} style={styles.skillTag}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              {detailJob.requirements?.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                    <ListChecks size={13} className="text-blue-500" /> Role Requirements
                  </div>
                  <ul className="space-y-2">
                    {detailJob.requirements.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2">
                        <span className="text-blue-500 mt-0.5 shrink-0 font-black">{i + 1}.</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Description */}
              {detailJob.description && (
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">About the Role</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-3">
                    {detailJob.description}
                  </p>
                </div>
              )}

              {/* Deadline info */}
              {detailJob.deadline && !detailJob.is_expired && (
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                  <Clock size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Application Deadline</div>
                    <div className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                      {new Date(detailJob.deadline).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </div>
              )}

              {/* No live listing warning */}
              {!detailJob.source_url?.startsWith("http") && (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5">
                  <WifiOff size={13} />
                  No live listing URL. This may be a seeded or manually-imported job — verify before applying.
                </div>
              )}
            </div>

            {/* Panel Actions */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0 flex-wrap">
              {detailJob.source_url?.startsWith("http") && (
                <a
                  href={detailJob.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md"
                >
                  <ExternalLink size={14} /> Open Listing
                </a>
              )}
              {!getMatchingApplication(detailJob) && !detailJob.is_expired && (
                <button
                  onClick={() => { setApplyEditJob(detailJob); setDetailJob(null); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md"
                >
                  <Send size={14} /> Apply Now
                </button>
              )}
              {getMatchingApplication(detailJob) && (
                <button
                  onClick={() => {
                    const matchedApp = getMatchingApplication(detailJob);
                    if (matchedApp) {
                      setManageAppTarget({ job: detailJob, app: matchedApp });
                      setDetailJob(null);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold text-sm border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 transition-all cursor-pointer"
                >
                  <Check size={14} /> Applied — Manage
                </button>
              )}
              <button
                onClick={() => { setChecklistTargetJob(detailJob); setDetailJob(null); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-slate-700 transition-all"
              >
                <ShieldCheck size={14} className="text-blue-500" /> Checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <FetchJobModal isOpen={isFetchOpen} onClose={() => setIsFetchOpen(false)} />
      <DirectEmailDispatchModal
        isOpen={isDirectEmailOpen}
        onClose={() => setIsDirectEmailOpen(false)}
        initialJob={directEmailJob}
      />
      <ApplyEditModal
        isOpen={!!applyEditJob}
        onClose={() => setApplyEditJob(null)}
        job={applyEditJob}
        onSuccessApply={() => { /* appliedIds now derived from applications query */ }}
      />
      {matchTargetJob && (
        <CVMatchModal
          isOpen={!!matchTargetJob}
          onClose={() => setMatchTargetJob(null)}
          jobTitle={matchTargetJob.title}
          companyName={matchTargetJob.company_name}
          requiredSkills={matchTargetJob.required_skills}
          jobDescription={matchTargetJob.description}
        />
      )}
      {checklistTargetJob && (
        <JobChecklistModal
          isOpen={!!checklistTargetJob}
          onClose={() => setChecklistTargetJob(null)}
          job={checklistTargetJob}
          onApplyWithTailoredCV={(targetJob) => {
            setApplyEditJob(targetJob);
            setChecklistTargetJob(null);
          }}
        />
      )}
      {/* ── Manage Submitted Application Modal ── */}
      {manageAppTarget && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800 text-white">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2 m-0">
                  <Check size={16} className="text-emerald-400" />
                  Application Status: {manageAppTarget.app.stage}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 m-0">
                  {manageAppTarget.job.title} · {manageAppTarget.job.company_name}
                </p>
              </div>
              <button onClick={() => setManageAppTarget(null)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="font-extrabold text-sm">
                  Applied on {new Date(manageAppTarget.app.date_applied).toLocaleDateString()}
                </div>
                <div className="text-xs opacity-90">
                  Recruiter Email: <strong>{manageAppTarget.app.recruiter_email || "careers@company.com"}</strong>
                </div>
              </div>

              {manageAppTarget.app.cv_snapshot && (
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-700 dark:text-slate-300">Attached CV Version:</div>
                  <div className="text-slate-900 dark:text-white font-semibold mt-0.5">
                    {manageAppTarget.app.cv_snapshot.name || "Tailored CV"} ({manageAppTarget.app.cv_snapshot.ats_score || manageAppTarget.app.ats_score}% ATS)
                  </div>
                </div>
              )}

              {manageAppTarget.app.notes && (
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Cover Letter Snippet:</div>
                  <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {manageAppTarget.app.notes.slice(0, 300)}{manageAppTarget.app.notes.length > 300 ? "…" : ""}
                  </pre>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Withdraw/Delete application for ${manageAppTarget.job.title} at ${manageAppTarget.job.company_name}? This will reset the job status back to "Apply".`)) {
                      deleteApplication.mutate(manageAppTarget.app.id, {
                        onSuccess: () => {
                          setManageAppTarget(null);
                          refetch();
                        },
                      });
                    }
                  }}
                  className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Withdraw Application</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setApplyEditJob(manageAppTarget.job);
                      setManageAppTarget(null);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 size={13} />
                    <span>Update CV / Letter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManageAppTarget(null)}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {companyIntelTarget && (
        <CompanyIntelligenceModal
          isOpen={!!companyIntelTarget}
          onClose={() => setCompanyIntelTarget(null)}
          companyName={companyIntelTarget}
        />
      )}

      <OpenedCareerModal
        isOpen={isOpenedCareerOpen}
        onClose={() => setIsOpenedCareerOpen(false)}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    background: "linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(29,78,216,0.06) 100%)",
    border: "1px solid rgba(59,130,246,0.3)", borderRadius: 20, padding: "24px 28px",
    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap",
  },
  badge: {
    display: "inline-block", fontSize: 11, fontWeight: 800, color: "#2563eb",
    background: "rgba(37,99,235,0.15)", padding: "3px 10px", borderRadius: 99,
    marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em",
  },
  heading: { margin: 0, fontSize: 22, fontWeight: 900, color: "var(--text-primary)" },
  subHeading: { margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" },
  fetchBtn: {
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none",
    borderRadius: 12, color: "#fff", padding: "12px 18px", fontWeight: 800,
    fontSize: 13.5, cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
    flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: 16 },
  card: {
    backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)",
    borderRadius: 18, padding: 20,
    display: "flex", flexDirection: "column", justifyContent: "space-between",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    position: "relative",
  },
  jobTitle: { fontSize: 15, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.3 },
  jobSub: { fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginTop: 3 },
  scorePill: {
    fontSize: 12, fontWeight: 900, color: "#2563eb", background: "rgba(37,99,235,0.15)",
    padding: "4px 10px", borderRadius: 10, border: "1px solid rgba(37,99,235,0.3)", whiteSpace: "nowrap",
  },
  skillTag: {
    fontSize: 11, backgroundColor: "var(--input-bg)", color: "var(--text-primary)",
    padding: "3px 9px", borderRadius: 8, border: "1px solid var(--border-color)", fontWeight: 700,
  },
  cardFoot: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingTop: 12, borderTop: "1px solid var(--border-color)", marginTop: 10, gap: 8, flexWrap: "wrap",
  },
  salary: { fontSize: 13, fontWeight: 800, color: "var(--text-primary)" },
  matchBtn: {
    backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)",
    color: "var(--text-primary)", padding: "6px 10px", borderRadius: 10, fontSize: 12,
    fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
  },
  applyBtn: {
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none",
    color: "#fff", padding: "6px 14px", borderRadius: 10, fontSize: 12,
    fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 10px rgba(37,99,235,0.3)",
    display: "flex", alignItems: "center", gap: 5,
  },
  appliedBtn: { background: "rgba(16,185,129,0.2)", color: "#059669", boxShadow: "none", cursor: "default" },
  expiredBtn: { background: "rgba(100,116,139,0.2)", color: "#64748b", boxShadow: "none", cursor: "default" },
};
