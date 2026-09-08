import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ApiErrorCard from "../../components/ApiErrorCard";
import ApplicationTemplatesModal from "../../components/ApplicationTemplatesModal";
import JobChecklistModal from "../../components/JobChecklistModal";
import {
  Plus, X, Layers, Briefcase, Award, TrendingUp, FileText, Sparkles, ShieldCheck,
  LayoutGrid, List, ExternalLink, Building2, Calendar, Mail, Clock, AlertCircle,
  Trash2, Search, Edit3, CheckCircle2, ChevronRight, UserCheck, DollarSign, Save,
  Wand2, RefreshCw, ExternalLink as ExternalLinkIcon, AlignLeft, Send, Globe,
} from "lucide-react";
import {
  useApplications,
  useApplicationAnalytics,
  useUpdateApplication,
  useCreateApplication,
  useDeleteApplication,
} from "../../hooks/useApplications";
import { useCVVersions, useGenerateCVForJob } from "../../hooks/useCV";
import DirectEmailDispatchModal from "../../components/DirectEmailDispatchModal";
import FollowUpModal from "../../components/FollowUpModal";
import { applicationsService } from "../../services/applications.service";
import { ALL_STAGES, type ApplicationStage, type ApplicationCreateInput } from "../../types/application.types";
import { analyzeJobApplicationChannel, extractResponsibilitiesAndRequirements } from "../../utils/jobScrutiny";

const BOARD_STAGES: ApplicationStage[] = [
  "Applied", "Confirmed", "Unresponded", "Assessment", "Technical",
  "HR Interview", "Final Interview", "Offer", "Job Closed", "Rejected",
];

const STEPPER_ITEMS = [
  { stage: "Saved", label: "Saved" },
  { stage: "Applied", label: "Applied" },
  { stage: "Under Review", label: "Review" },
  { stage: "Technical", label: "Interview" },
  { stage: "Offer", label: "Offer" },
  { stage: "Accepted", label: "Accepted" },
];
const STEPPER_STAGES = STEPPER_ITEMS;

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const { data: applications, isLoading, isError, refetch } = useApplications();
  const { data: analytics } = useApplicationAnalytics();
  const updateApplication = useUpdateApplication();
  const createApplication = useCreateApplication();
  const deleteApplication = useDeleteApplication();

  const [showAdd, setShowAdd] = useState(false);
  const [showEmailDispatch, setShowEmailDispatch] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [inspectorApp, setInspectorApp] = useState<any | null>(null);
  const [followUpAppTarget, setFollowUpAppTarget] = useState<any | null>(null);
  const [checklistTarget, setChecklistTarget] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [isBatchSending, setIsBatchSending] = useState(false);

  const { data: funnelAnalytics } = useQuery({
    queryKey: ["applications", "funnelAnalytics"],
    queryFn: () => applicationsService.getFunnelAnalytics(),
    staleTime: 60_000,
  });

  const handleBatchDispatch = async () => {
    if (selectedAppIds.length === 0) return;
    if (!window.confirm(`Batch dispatch application emails for ${selectedAppIds.length} selected job application(s)?`)) return;
    setIsBatchSending(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/applications/batch-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ application_ids: selectedAppIds })
      });
      if (res.ok) {
        const data = await res.json();
        setSyncNotice(`✓ Batch Dispatch complete! Successfully sent: ${data.sent_count}, Failed: ${data.failed_count}`);
        setSelectedAppIds([]);
        queryClient.invalidateQueries({ queryKey: ["applications"] });
      } else {
        const err = await res.json();
        setSyncNotice(`⚠ Batch Dispatch failed: ${err.detail || "Error processing queue"}`);
      }
    } catch (e: any) {
      setSyncNotice(`⚠ Error: ${e.message}`);
    } finally {
      setIsBatchSending(false);
    }
  };

  const [isSyncingResponses, setIsSyncingResponses] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const { data: dueFollowups = [] } = useQuery({
    queryKey: ["applications", "dueFollowups"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch("/api/applications/followups/due?days=7", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        }
      } catch {}
      return [];
    },
    staleTime: 60_000,
  });

  const handleSyncResponses = async () => {
    setIsSyncingResponses(true);
    setSyncNotice(null);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/emails/sync-inbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = "Server responded with error.";
        try {
          const json = JSON.parse(text);
          msg = json.detail || json.message || msg;
        } catch {
          msg = text || msg;
        }
        setIsSyncingResponses(false);
        setSyncNotice(`⚠ ${msg}`);
        return;
      }

      const data = await res.json();
      setIsSyncingResponses(false);

      if (data) {
        if (data.synced === false) {
          setSyncNotice(`⚠ ${data.message || "IMAP sync issue."}`);
        } else {
          setSyncNotice(`✓ ${data.message || "Recruiter responses checked."}`);
          queryClient.invalidateQueries({ queryKey: ["applications"] });
          queryClient.invalidateQueries({ queryKey: ["emails"] });
        }
      }
    } catch (e: any) {
      setIsSyncingResponses(false);
      setSyncNotice(`⚠ Sync error: ${e.message || "Network error."}`);
    }
  };

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    if (!searchQuery.trim()) return applications;
    const q = searchQuery.toLowerCase().trim();
    return applications.filter(
      (a) => a.role.toLowerCase().includes(q) || a.company_name.toLowerCase().includes(q)
    );
  }, [applications, searchQuery]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-900/60 animate-pulse border border-slate-300/30 dark:border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="space-y-3 p-4 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="h-6 bg-slate-300 dark:bg-slate-800 rounded w-1/2 animate-pulse" />
              {[1, 2, 3].map((card) => (
                <div key={card} className="h-32 bg-slate-200 dark:bg-slate-800/60 rounded-xl animate-pulse p-3 space-y-2">
                  <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-full mt-4" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (isError) return <ApiErrorCard onRetry={refetch} />;

  const changeStage = (id: string, stage: ApplicationStage) => {
    updateApplication.mutate({ id, patch: { stage } });
  };

  const handleDeleteApp = (id: string, role: string, company: string) => {
    if (window.confirm(`Withdraw / Delete application for ${role} at ${company}?`)) {
      deleteApplication.mutate(id);
      if (inspectorApp && inspectorApp.id === id) {
        setInspectorApp(null);
      }
    }
  };

  return (
    <div className="p-2 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Application Pipeline &amp; Workflow</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Comprehensive application lifecycle tracking with applied CVs, cover letters, recruiter contacts &amp; status telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search Filter */}
          <div className="flex-1 max-w-xs relative">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2 text-xs font-black text-slate-400 hover:text-slate-600">×</button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <LayoutGrid size={14} /> Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <List size={14} /> List View
            </button>
          </div>

          <button
            onClick={handleSyncResponses}
            disabled={isSyncingResponses}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold px-3.5 py-2.5 shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
            title="Connects to deno14619@gmail.com via IMAP to sync recruiter responses, confirmation emails & interview invites"
          >
            <RefreshCw size={15} className={isSyncingResponses ? "animate-spin text-white" : "text-emerald-200"} />
            <span>{isSyncingResponses ? "Syncing Inbox…" : "Sync Recruiter Responses"}</span>
          </button>
          <button
            onClick={() => setShowEmailDispatch(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-sm font-extrabold px-4 py-2.5 shadow-md transition-all hover:scale-[1.02]"
            title="Dispatch a manual application email with attached PDF Resume & Cover Letter to a recruiter"
          >
            <Mail size={16} />
            <span>Send Email Application</span>
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2.5 shadow-md transition-all hover:scale-[1.02]"
          >
            <Sparkles size={16} className="text-blue-400" />
            <span className="hidden sm:inline">Templates</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 shadow-md transition-all hover:scale-[1.02]"
          >
            <Plus size={16} />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between animate-fade-in ${
          syncNotice.startsWith("⚠")
            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800"
            : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{syncNotice}</span>
          </div>
          <button onClick={() => setSyncNotice(null)} className="font-extrabold text-sm hover:opacity-80">✕</button>
        </div>
      )}

      {dueFollowups.length > 0 && (
        <div className="p-3.5 rounded-2xl border bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-sm text-amber-950 dark:text-amber-100 flex items-center gap-2">
                <span>⏰ {dueFollowups.length} Application{dueFollowups.length > 1 ? "s" : ""} Due for Follow-up</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[10px] font-black uppercase">7+ Days Inactive</span>
              </div>
              <p className="text-amber-700 dark:text-amber-300 text-[11px] mt-0.5">
                {dueFollowups.map(f => `${f.role} at ${f.company_name}`).slice(0, 2).join(", ")}
                {dueFollowups.length > 2 ? ` and ${dueFollowups.length - 2} others` : ""} are awaiting recruiter check-in.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (dueFollowups.length > 0) setFollowUpAppTarget(dueFollowups[0]);
              else setShowEmailDispatch(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shrink-0"
          >
            <Send size={13} />
            <span>Generate AI Follow-Up Draft</span>
          </button>
        </div>
      )}

      {/* Analytics Telemetry Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <StatCard label="Total Tracked" value={analytics.total} icon={<Layers size={18} className="text-blue-500" />} />
          <StatCard label="Responded" value={analytics.responded} icon={<Briefcase size={18} className="text-emerald-500" />} />
          <StatCard label="Pending / Unresponded" value={(analytics as any).not_responded ?? 0} icon={<Layers size={18} className="text-amber-500" />} />
          <StatCard label="Feedback Received" value={(analytics as any).feedback_received ?? 0} icon={<Award size={18} className="text-purple-500" />} />
          <StatCard label="Interview Rate" value={`${analytics.interview_rate}%`} icon={<TrendingUp size={18} className="text-indigo-500" />} />
          <StatCard label="Response Rate" value={`${analytics.response_rate}%`} icon={<TrendingUp size={18} className="text-amber-500" />} />
        </div>
      )}

      {/* Pipeline Conversion Funnel Diagnostic Widget */}
      {funnelAnalytics && funnelAnalytics.funnel_steps && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Pipeline Conversion Funnel &amp; Bottleneck Diagnostics</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase">
                  {funnelAnalytics.total_applications} Applications Tracked
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Stage transition conversion percentages and drop-off diagnosis</p>
            </div>
            
            {funnelAnalytics.diagnostics?.primary_bottleneck !== "None" && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Bottleneck: {funnelAnalytics.diagnostics.primary_bottleneck}</span>
              </div>
            )}
          </div>

          {/* Funnel Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            {funnelAnalytics.funnel_steps.map((step: any, idx: number) => {
              const colors = [
                "from-blue-500 to-indigo-600",
                "from-cyan-500 to-blue-600",
                "from-indigo-500 to-purple-600",
                "from-emerald-500 to-teal-600"
              ];
              return (
                <div key={step.step} className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{idx + 1}. {step.step}</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{step.count} ({step.pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${colors[idx % colors.length]} h-full transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(5, Math.min(100, step.pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendation alert */}
          {funnelAnalytics.diagnostics?.recommendation && (
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500 shrink-0" />
              <span><strong>AI Recommendation:</strong> {funnelAnalytics.diagnostics.recommendation}</span>
            </div>
          )}
        </div>
      )}

      {/* Main View Mode */}
      {viewMode === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
          {BOARD_STAGES.map((stage) => {
            const items = filteredApplications.filter((a) => a.stage === stage);
            return (
              <div key={stage} className="w-64 shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-3 px-3.5 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>{stage}</span>
                    {stage === "Unresponded" && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                    {stage === "Job Closed" && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1">
                  {items.map((a: any) => (
                    <div
                      key={a.id}
                      onClick={() => setInspectorApp(a)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all space-y-2 relative group cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedAppIds.includes(a.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) setSelectedAppIds(prev => [...prev, a.id]);
                              else setSelectedAppIds(prev => prev.filter(id => id !== a.id));
                            }}
                            className="mt-1 w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600 shrink-0"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition-colors flex items-center gap-1">
                              {a.role}
                            </div>
                            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">{a.company_name}</div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteApp(a.id, a.role, a.company_name); }}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors opacity-0 group-hover:opacity-100"
                          title="Withdraw / Delete Application"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Stage badges */}
                      {a.stage === "Unresponded" && (
                        <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                          <Clock size={11} /> Auto-moved: 14d+ No Response
                        </div>
                      )}
                      {a.stage === "Job Closed" && (
                        <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800 inline-flex items-center gap-1">
                          <AlertCircle size={11} /> Auto-moved: Job Listing Closed
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 flex items-center justify-between gap-1 flex-wrap border-t border-slate-100 dark:border-slate-800">
                        <span>Applied {new Date(a.date_applied).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <div className="flex items-center gap-1 flex-wrap mt-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            a.apply_method === "email" || a.recruiter_email
                              ? "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800"
                              : "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800"
                          }`}>
                            {a.apply_method === "email" || a.recruiter_email ? <Mail size={10} /> : <ExternalLink size={10} />}
                            {a.apply_method === "email" || a.recruiter_email ? "Email Sent" : "Website"}
                          </span>
                          {(a.cv_snapshot || a.cv_version_id) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                              <FileText size={10} /> CV ({a.cv_snapshot?.ats_score ?? a.ats_score}% ATS)
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Inspect &rarr;
                          </span>
                        </div>
                      </div>

                      <select
                        onClick={(e) => e.stopPropagation()}
                        value={a.stage}
                        onChange={(e) => changeStage(a.id, e.target.value as ApplicationStage)}
                        className="w-full mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium outline-none"
                      >
                        {ALL_STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                      No applications
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Mobile-Friendly List View */
        <div className="space-y-3">
          {filteredApplications.map((a: any) => (
            <div
              key={a.id}
              onClick={() => setInspectorApp(a)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-800 transition-all"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedAppIds.includes(a.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.checked) setSelectedAppIds(prev => [...prev, a.id]);
                    else setSelectedAppIds(prev => prev.filter(id => id !== a.id));
                  }}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600 shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                      a.stage === "Unresponded"
                        ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                        : a.stage === "Job Closed"
                        ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                        : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    }`}>
                      {a.stage}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white m-0">{a.role}</h4>
                  </div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1"><Building2 size={13} /> {a.company_name}</span>
                    <span className="inline-flex items-center gap-1"><Calendar size={13} /> Applied {new Date(a.date_applied).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    {a.salary_range && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold"><DollarSign size={13} /> {a.salary_range}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                {(a.cv_snapshot || a.cv_version_id) && (
                  <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                    <FileText size={12} /> Applied CV ({a.cv_snapshot?.ats_score ?? a.ats_score}% ATS)
                  </span>
                )}
                <button
                  onClick={() => setInspectorApp(a)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-xs flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                >
                  <Edit3 size={12} className="text-blue-500" /> Pipeline Inspector &rarr;
                </button>
                <select
                  value={a.stage}
                  onChange={(e) => changeStage(a.id, e.target.value as ApplicationStage)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                >
                  {ALL_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <button
                  onClick={() => handleDeleteApp(a.id, a.role, a.company_name)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-colors"
                  title="Withdraw / Delete Application"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Application Modal */}
      {showAdd && (
        <FullAddApplicationModal
          onClose={() => setShowAdd(false)}
          onSubmit={(input) => {
            createApplication.mutate(input, { onSuccess: () => setShowAdd(false) });
          }}
        />
      )}

      {/* Comprehensive Application Pipeline Inspector Modal */}
      {inspectorApp && (
        <PipelineInspectorModal
          app={inspectorApp}
          onClose={() => setInspectorApp(null)}
          onUpdate={(patch) => {
            updateApplication.mutate({ id: inspectorApp.id, patch }, {
              onSuccess: (updated) => setInspectorApp((prev: any) => ({ ...prev, ...updated }))
            });
          }}
          onDelete={() => handleDeleteApp(inspectorApp.id, inspectorApp.role, inspectorApp.company_name)}
          onOpenChecklist={() => {
            setChecklistTarget({
              title: inspectorApp.role,
              company_name: inspectorApp.company_name,
              required_skills: inspectorApp.required_skills || ["Python", "FastAPI", "React", "PostgreSQL"],
              mode: "Hybrid",
              level: "Senior",
              currency: "KES",
              salary_min: 350000,
              salary_max: 550000,
              contact_email: inspectorApp.recruiter_email || `careers@${inspectorApp.company_name.toLowerCase().replace(/[^a-z]/g, "")}.com`
            });
          }}
          onOpenFollowUp={() => setFollowUpAppTarget(inspectorApp)}
        />
      )}

      {followUpAppTarget && (
        <FollowUpModal
          isOpen={!!followUpAppTarget}
          onClose={() => setFollowUpAppTarget(null)}
          applicationId={String(followUpAppTarget.id)}
          companyName={followUpAppTarget.company_name}
          roleTitle={followUpAppTarget.role}
          stage={followUpAppTarget.stage}
          dateApplied={followUpAppTarget.date_applied}
          recruiterEmail={followUpAppTarget.recruiter_email}
        />
      )}

      <DirectEmailDispatchModal
        isOpen={showEmailDispatch}
        onClose={() => setShowEmailDispatch(false)}
      />
      {showTemplates && <ApplicationTemplatesModal onClose={() => setShowTemplates(false)} />}
      {checklistTarget && (
        <JobChecklistModal
          isOpen={!!checklistTarget}
          onClose={() => setChecklistTarget(null)}
          job={checklistTarget}
        />
      )}

      {/* Floating Batch Dispatch Toolbar */}
      {selectedAppIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white border border-slate-700 shadow-2xl rounded-2xl px-6 py-3.5 flex items-center gap-4 z-50 animate-bounce-short">
          <div className="text-xs font-extrabold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">{selectedAppIds.length}</span>
            <span>Application{selectedAppIds.length > 1 ? "s" : ""} Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDispatch}
              disabled={isBatchSending}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all hover:scale-[1.03]"
            >
              {isBatchSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{isBatchSending ? "Dispatching Batch Queue..." : `Batch Dispatch Selected (${selectedAppIds.length})`}</span>
            </button>
            <button
              onClick={() => setSelectedAppIds([])}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{label}</div>
        <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{value}</div>
      </div>
      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
        {icon}
      </div>
    </div>
  );
}

/* ── Interactive Pipeline Inspector Modal ── */
function PipelineInspectorModal({
  app,
  onClose,
  onUpdate,
  onDelete,
  onOpenChecklist,
  onOpenFollowUp,
}: {
  app: any;
  onClose: () => void;
  onUpdate: (patch: any) => void;
  onDelete: () => void;
  onOpenChecklist: () => void;
  onOpenFollowUp?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"workflow" | "assets" | "notes" | "edit">("workflow");
  const [notesText, setNotesText] = useState(app.notes || "");
  const [recruiterEmail, setRecruiterEmail] = useState(app.recruiter_email || "");
  const [salaryRange, setSalaryRange] = useState(app.salary_range || "");

  // Edit tab state
  const [editCompany, setEditCompany] = useState(app.company_name || "");
  const [editRole, setEditRole] = useState(app.role || "");
  const [editDate, setEditDate] = useState(
    app.date_applied ? app.date_applied.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [editSalary, setEditSalary] = useState(app.salary_range || "");
  const [editRecruiter, setEditRecruiter] = useState(app.recruiter_email || "");
  const [editStage, setEditStage] = useState(app.stage || "Applied");
  const [editNotes, setEditNotes] = useState(app.notes || "");
  const [editSaveMsg, setEditSaveMsg] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const downloadTxt = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {app.stage}
              </span>
              <h3 className="text-lg font-extrabold text-white tracking-tight m-0">{app.role}</h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 m-0">
              <Building2 size={13} className="text-blue-400" /> {app.company_name} · Applied {new Date(app.date_applied).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenFollowUp && (
              <button
                onClick={onOpenFollowUp}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                title="Generate AI Follow-up Draft & Calendar Reminder"
              >
                <Mail size={13} />
                <span>AI Follow-Up</span>
              </button>
            )}
            <button onClick={onDelete} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl" title="Withdraw Application">
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-300 hover:text-white rounded-xl">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Workflow Stepper Progress Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px]">
            {STEPPER_STAGES.map((s, idx) => {
              const isCurrent = app.stage === s.stage;
              const isPast = ALL_STAGES.indexOf(app.stage) > ALL_STAGES.indexOf(s.stage as ApplicationStage);
              return (
                <div key={s.stage} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-md ring-4 ring-blue-500/20"
                        : isPast
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}>
                      {isPast ? <CheckCircle2 size={14} /> : idx + 1}
                    </div>
                    <span className={`text-[10px] font-bold mt-1 ${isCurrent ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPPER_STAGES.length - 1 && (
                    <ChevronRight size={14} className="text-slate-400 shrink-0 mb-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab("workflow")}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "workflow"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase size={14} /> Workflow &amp; Details
          </button>
          <button
            onClick={() => setActiveTab("assets")}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "assets"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText size={14} /> Applied Assets (CV &amp; Letter)
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "notes"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Edit3 size={14} /> Notes &amp; Activity Log
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "edit"
                ? "border-amber-600 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserCheck size={14} /> Edit &amp; Review
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {activeTab === "workflow" && (
            <div className="space-y-5">
              {/* Quick Status Stage Switcher */}
              <div className="bg-blue-50/70 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">Application Workflow Status</div>
                  <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Move this application to next stage in hiring pipeline</div>
                </div>
                <select
                  value={app.stage}
                  onChange={(e) => onUpdate({ stage: e.target.value })}
                  className="bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-bold outline-none shadow-sm"
                >
                  {ALL_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Salary Benchmark Range</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      placeholder="e.g. KES 350,000 - KES 500,000"
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={() => onUpdate({ salary_range: salaryRange })}
                      className="px-3 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors"
                    >
                      <Save size={13} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recruiter / Hiring Contact Email</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={recruiterEmail}
                      onChange={(e) => setRecruiterEmail(e.target.value)}
                      placeholder="e.g. recruiter@company.com"
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={() => onUpdate({ recruiter_email: recruiterEmail })}
                      className="px-3 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors"
                    >
                      <Save size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Channel Detection & Application Method Indicator */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-blue-600 text-white rounded-md text-xs flex items-center justify-center">
                      {analyzeJobApplicationChannel(app).channel === "email" ? <Mail size={12} /> : <Globe size={12} />}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Application Channel: {analyzeJobApplicationChannel(app).channel === "email" ? "Direct Recruiter Email" : "Official Web Portal"}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    analyzeJobApplicationChannel(app).channel === "email" ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  }`}>
                    {analyzeJobApplicationChannel(app).channel}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {analyzeJobApplicationChannel(app).reason}
                </div>
              </div>

              {/* Required Skills & Match Telemetry */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">Skill Telemetry &amp; Scores</span>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs border border-emerald-300">
                      {app.match_score || 85}% Skill Match
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold text-xs border border-blue-300">
                      {app.cv_snapshot?.ats_score ?? app.ats_score ?? 80}% ATS Compatibility
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(app.required_skills && app.required_skills.length > 0
                    ? app.required_skills
                    : ["Python", "FastAPI", "React", "PostgreSQL", "Git"]
                  ).map((skill: string) => (
                    <span key={skill} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-3 pt-2">
                {app.source_url && (
                  <a
                    href={app.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <ExternalLink size={14} /> Open Live Job Listing
                  </a>
                )}
                <button
                  onClick={onOpenChecklist}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
                >
                  <ShieldCheck size={14} /> Application Readiness Checklist
                </button>
              </div>
            </div>
          )}

          {activeTab === "assets" && (
            <div className="space-y-5">

              {/* ── CV Snapshot Card ── */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {app.cv_snapshot?.name || "Applied CV Snapshot"}
                    </div>
                    <div className="text-blue-700 dark:text-blue-300 font-semibold text-xs mt-0.5">
                      Target Focus: {app.cv_snapshot?.focus || app.role}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-xs border border-emerald-300">
                      {app.cv_snapshot?.ats_score ?? app.ats_score ?? 80}% ATS
                    </span>
                    {app.cv_snapshot?.content && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(app.cv_snapshot.content)}
                        className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 font-bold rounded-lg text-[11px] border border-slate-200 dark:border-slate-700"
                      >
                        Copy
                      </button>
                    )}
                    {app.cv_snapshot?.content && (
                      <button
                        type="button"
                        onClick={() => downloadTxt(`${app.role}_CV.txt`, app.cv_snapshot.content)}
                        className="px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-bold rounded-lg text-[11px] border border-blue-200 dark:border-blue-800"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>

                {app.cv_snapshot?.content ? (
                  <div className="p-4 bg-white dark:bg-slate-900/50">
                    <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto text-slate-700 dark:text-slate-300 tracking-wide">
                      {app.cv_snapshot.content}
                    </pre>
                  </div>
                ) : (
                  <div className="px-4 py-5 text-center text-xs text-slate-400">
                    CV content snapshot not available. Applied with CV version (ATS Score: {app.ats_score}%).
                  </div>
                )}
              </div>

              {/* ── Cover Letter Document Preview ── */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-violet-50 dark:bg-violet-950/30 border-b border-violet-100 dark:border-violet-900">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail size={14} className="text-violet-500" />
                    Submitted Cover Letter
                  </div>
                  <div className="flex items-center gap-2">
                    {app.notes && (
                      <>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(app.notes)}
                          className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 font-bold rounded-lg text-[11px] border border-slate-200 dark:border-slate-700"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadTxt(`${app.role}_Cover_Letter.txt`, app.notes)}
                          className="px-2 py-1 bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 hover:bg-violet-100 font-bold rounded-lg text-[11px] border border-violet-200 dark:border-violet-800"
                        >
                          Download
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {app.notes ? (
                  <div className="bg-white dark:bg-slate-950">
                    {/* Letter document styling */}
                    <div className="h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500" />
                    <div className="p-5 md:p-6 space-y-4 font-serif max-h-72 overflow-y-auto">
                      {/* Date */}
                      <div className="text-xs text-slate-400 font-sans">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
                      {/* Recipient */}
                      <div className="font-sans text-xs space-y-0.5">
                        <div className="font-bold text-slate-700 dark:text-slate-300">Hiring Manager</div>
                        <div className="text-slate-500">{app.company_name}</div>
                      </div>
                      {/* Body Paragraphs */}
                      <div className="space-y-4 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                        {app.notes.split(/\n{2,}/).map((para: string, idx: number) => {
                          const trimmed = para.replace(/\n/g, " ").trim();
                          if (!trimmed) return null;
                          const isSal = /^dear\s/i.test(trimmed);
                          const isClose = /^(sincerely|best regards|regards|yours|warm regards|thank you)/i.test(trimmed);
                          return (
                            <p key={idx} className={`m-0 leading-[1.9] ${
                              isSal ? "font-semibold text-slate-900 dark:text-white" :
                              isClose ? "font-semibold text-slate-900 dark:text-white pt-2" :
                              "text-justify"
                            }`}>
                              {trimmed}
                            </p>
                          );
                        })}
                      </div>
                      {/* Word count footer */}
                      <div className="text-[11px] text-slate-400 font-sans border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center gap-1.5">
                        <AlignLeft size={11} />
                        {app.notes.trim().split(/\s+/).filter(Boolean).length} words
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-xs text-slate-400 space-y-2">
                    <div>No cover letter attached to this application.</div>
                    <div className="text-[11px] text-slate-400">
                      Generate one in the{" "}
                      <button
                        type="button"
                        onClick={onClose}
                        className="text-blue-500 hover:underline font-semibold"
                      >
                        Cover Letter Engine
                      </button>{" "}
                      and attach it here.
                    </div>
                  </div>
                )}
              </div>

              {/* ── Application Letter PDF Snapshot Card ── */}
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText size={14} className="text-emerald-500" />
                      Job Application Letter PDF
                    </div>
                    <div className="text-emerald-700 dark:text-emerald-300 font-semibold text-xs mt-0.5">
                      {app.app_letter_snapshot?.version_name || `Formal Application Letter (${app.company_name})`}
                    </div>
                    {app.app_letter_snapshot?.created_at && (
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Generated: {new Date(app.app_letter_snapshot.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-[11px] border border-emerald-300 whitespace-nowrap flex items-center gap-1">
                      <FileText size={11} /> PDF Attached
                    </span>
                    {app.app_letter_snapshot?.content && (
                      <>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(app.app_letter_snapshot.content)}
                          className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 font-bold rounded-lg text-[11px] border border-slate-200 dark:border-slate-700"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadTxt(`${app.role}_Application_Letter.txt`, app.app_letter_snapshot.content)}
                          className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold rounded-lg text-[11px] border border-emerald-200 dark:border-emerald-800"
                        >
                          Download
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {app.app_letter_snapshot?.content ? (
                  <div className="bg-white dark:bg-slate-950">
                    <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                    <div className="p-5 md:p-6 space-y-4 font-serif max-h-72 overflow-y-auto">
                      {/* Date */}
                      <div className="text-xs text-slate-400 font-sans">
                        {app.app_letter_snapshot.created_at
                          ? new Date(app.app_letter_snapshot.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                          : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                        }
                      </div>
                      {/* Recipient block */}
                      <div className="font-sans text-xs space-y-0.5">
                        <div className="font-bold text-slate-700 dark:text-slate-300">Hiring Manager / Recruitment Committee</div>
                        <div className="text-slate-500">{app.company_name}</div>
                      </div>
                      {/* Letter Paragraphs */}
                      <div className="space-y-3 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                        {app.app_letter_snapshot.content.split(/\n{2,}/).map((para: string, idx: number) => {
                          const trimmed = para.replace(/\n/g, " ").trim();
                          if (!trimmed) return null;
                          const isSalutation = /^dear\s/i.test(trimmed) || /^(RECRUITMENT|HIRING)/i.test(trimmed);
                          const isClose = /^(sincerely|best regards|regards|yours|warm regards|thank you|yours faithfully)/i.test(trimmed);
                          return (
                            <p key={idx} className={`m-0 leading-[1.9] ${
                              isSalutation ? "font-extrabold text-emerald-800 dark:text-emerald-300 uppercase text-xs tracking-wider" :
                              isClose ? "font-semibold text-slate-900 dark:text-white pt-2" :
                              "text-justify"
                            }`}>
                              {trimmed}
                            </p>
                          );
                        })}
                      </div>
                      {/* Word count + version info */}
                      <div className="text-[11px] text-slate-400 font-sans border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <AlignLeft size={11} />
                          {app.app_letter_snapshot.content.trim().split(/\s+/).filter(Boolean).length} words
                        </span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          Application_Letter_{(app.company_name || "Company").replace(/\s+/g, "_")}.pdf
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-xs text-slate-400 space-y-2">
                    <div>No application letter snapshot found.</div>
                    <div className="text-[11px] text-slate-400">
                      Use the <strong>Send Email Application</strong> modal and click <strong><Sparkles size={11} className="inline" /> Auto-Generate Application Letter</strong> to create one.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Application Activity Notes &amp; Recruiter Feedback
                </label>
                <textarea
                  rows={8}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Record interview feedback, email replies, referral contacts, or next action steps..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs font-medium text-slate-900 dark:text-white outline-none leading-relaxed"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => onUpdate({ notes: notesText })}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Save size={14} /> Save Activity Notes
                </button>
              </div>
            </div>
          )}

          {/* ── Edit & Review Tab ─────────────────────────────────────────── */}
          {activeTab === "edit" && (
            <div className="space-y-5">
              {editSaveMsg && (
                <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  editSaveMsg.startsWith("✓")
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800"
                }`}>
                  <CheckCircle2 size={14} />
                  <span>{editSaveMsg}</span>
                </div>
              )}

              {/* Editable Application Form */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Edit3 size={14} className="text-amber-500" /> Edit Application Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Company Name</label>
                    <input
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Role / Job Title</label>
                    <input
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Application Date</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Pipeline Stage</label>
                    <select
                      value={editStage}
                      onChange={(e) => setEditStage(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    >
                      {ALL_STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Recruiter Email</label>
                    <input
                      type="email"
                      value={editRecruiter}
                      onChange={(e) => setEditRecruiter(e.target.value)}
                      placeholder="recruiter@company.com"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Salary Range</label>
                    <input
                      value={editSalary}
                      onChange={(e) => setEditSalary(e.target.value)}
                      placeholder="e.g. KES 350,000 - 500,000"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Cover Letter / Notes</label>
                  <textarea
                    rows={5}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Edit your cover letter or add activity notes…"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono leading-relaxed text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      onUpdate({
                        company_name: editCompany,
                        role: editRole,
                        date_applied: editDate,
                        stage: editStage as any,
                        recruiter_email: editRecruiter,
                        salary_range: editSalary,
                        notes: editNotes,
                      });
                      setEditSaveMsg("✓ Application updated successfully!");
                      setTimeout(() => setEditSaveMsg(null), 3000);
                    }}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
                  >
                    <Save size={14} /> Save All Changes
                  </button>
                </div>
              </div>

              {/* Application Review Summary */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-400" /> Application Review Summary
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "Company", value: app.company_name },
                    { label: "Role", value: app.role },
                    { label: "Stage", value: app.stage },
                    { label: "Applied Date", value: new Date(app.date_applied).toLocaleDateString() },
                    { label: "ATS Score", value: `${app.cv_snapshot?.ats_score ?? app.ats_score ?? "-"}%` },
                    { label: "Match Score", value: `${app.match_score ?? 85}%` },
                    { label: "Apply Method", value: app.apply_method || "website" },
                    { label: "Recruiter", value: app.recruiter_email || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-800 rounded-xl px-3 py-2 flex flex-col gap-0.5">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">{label}</span>
                      <span className="text-white font-bold text-xs truncate">{value}</span>
                    </div>
                  ))}
                </div>

                {/* CV Snapshot Review */}
                {app.cv_snapshot?.content && (
                  <div className="bg-slate-800 rounded-xl p-3 space-y-1">
                    <div className="text-slate-300 text-[11px] font-bold uppercase tracking-wider">Attached CV Preview</div>
                    <pre className="text-slate-400 text-[11px] font-mono leading-relaxed max-h-28 overflow-y-auto whitespace-pre-wrap">
                      {app.cv_snapshot.content.slice(0, 600)}{app.cv_snapshot.content.length > 600 ? "…" : ""}
                    </pre>
                  </div>
                )}

                {/* Source URL */}
                {app.source_url && (
                  <a
                    href={app.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 underline"
                  >
                    <ExternalLinkIcon size={13} />
                    Re-visit original job listing portal →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500 font-semibold">
            Application ID: #{app.id}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Full Add Application Modal ── */
function FullAddApplicationModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: ApplicationCreateInput) => void;
}) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [stage, setStage] = useState<ApplicationStage>("Applied");
  const [dateApplied, setDateApplied] = useState(new Date().toISOString().slice(0, 10));
  const [salaryRange, setSalaryRange] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [applyMethod, setApplyMethod] = useState<"website" | "email">("website");
  const [skills, setSkills] = useState("");
  const [notes, setNotes] = useState("");
  const [cvVersionId, setCvVersionId] = useState("");
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [cvNotice, setCvNotice] = useState<string | null>(null);

  const { data: cvVersions = [] } = useCVVersions();
  const generateCVForJob = useGenerateCVForJob();

  const handleGenerateCV = () => {
    if (!role.trim() || !company.trim()) {
      setCvNotice("⚠ Fill in Role Title and Company Name first.");
      return;
    }
    setIsGeneratingCV(true);
    setCvNotice(null);
    const skillsList = skills
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : ["Python", "FastAPI", "React", "PostgreSQL"];
    generateCVForJob.mutate(
      { job_title: role.trim(), company_name: company.trim(), required_skills: skillsList },
      {
        onSuccess: (newCV) => {
          setIsGeneratingCV(false);
          setCvVersionId(newCV.id);
          setCvNotice(`✓ CV "${newCV.name}" generated & attached! (${newCV.ats_score}% ATS Score)`);
        },
        onError: () => {
          setIsGeneratingCV(false);
          setCvNotice("⚠ CV generation failed. Please try again.");
        },
      }
    );
  };

  const handleSubmit = () => {
    if (!company.trim() || !role.trim()) return;
    const reqSkills = skills
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : ["Python", "FastAPI", "React", "PostgreSQL"];
    onSubmit({
      company_name: company.trim(),
      role: role.trim(),
      stage,
      date_applied: dateApplied,
      salary_range: salaryRange.trim() || undefined,
      recruiter_email: recruiterEmail.trim() || undefined,
      source_url: sourceUrl.trim() || undefined,
      apply_method: applyMethod,
      required_skills: reqSkills,
      notes: notes.trim() || undefined,
      cv_version_id: cvVersionId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Plus className="text-blue-500" size={20} /> Add Application to Pipeline
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Application Channel Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setApplyMethod("website")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                applyMethod === "website"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <ExternalLink size={13} /> Applied via Website
            </button>
            <button
              type="button"
              onClick={() => setApplyMethod("email")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                applyMethod === "email"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Mail size={13} /> Dispatch via Email
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company Name *</label>
              <input
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 outline-none font-semibold"
                placeholder="e.g. Safaricom"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role Title *</label>
              <input
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 outline-none font-semibold"
                placeholder="e.g. Senior Software Developer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ApplicationStage)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 outline-none font-bold"
              >
                {ALL_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date Applied</label>
              <input
                type="date"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 outline-none font-semibold"
                value={dateApplied}
                onChange={(e) => setDateApplied(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Salary Range</label>
              <input
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 outline-none font-semibold"
                placeholder="e.g. KES 300,000 - KES 450,000"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Recruiter Email</label>
              <input
                type="email"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 outline-none font-semibold"
                placeholder="e.g. careers@company.com"
                value={recruiterEmail}
                onChange={(e) => setRecruiterEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Source Job Listing URL</label>
            <input
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 outline-none font-semibold"
              placeholder="https://..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Required Skills (Comma separated)</label>
            <input
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 outline-none font-semibold"
              placeholder="Python, FastAPI, React, PostgreSQL, Docker"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>

          {/* ── CV Version Selector + Auto-Generate ── */}
          <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText size={13} className="text-blue-500" /> Attach CV Version
              </label>
              <button
                type="button"
                onClick={handleGenerateCV}
                disabled={isGeneratingCV || !role.trim() || !company.trim()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 transition-all disabled:opacity-50"
                title="Auto-generate a tailored ATS-optimized CV for this role"
              >
                {isGeneratingCV ? (
                  <RefreshCw size={11} className="animate-spin text-emerald-600" />
                ) : (
                  <Wand2 size={11} className="text-amber-500" />
                )}
                {isGeneratingCV ? "Generating CV…" : "Auto-Generate CV"}
              </button>
            </div>

            {cvNotice && (
              <div className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2 ${
                cvNotice.startsWith("✓")
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300"
                  : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300"
              }`}>
                <span>{cvNotice}</span>
                <button type="button" onClick={() => setCvNotice(null)} className="font-black text-xs">✕</button>
              </div>
            )}

            <select
              value={cvVersionId}
              onChange={(e) => setCvVersionId(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 outline-none font-semibold text-[11px]"
            >
              <option value="">— No CV attached (optional) —</option>
              {cvVersions.map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.name} {cv.focus ? `· ${cv.focus}` : ""} · {cv.ats_score}% ATS
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Cover Letter / Application Letter
              </label>
              <span className={`text-[11px] font-semibold ${
                notes.length === 0 ? "text-slate-400" :
                notes.length < 200 ? "text-amber-600" :
                notes.length <= 800 ? "text-emerald-600" :
                "text-blue-600"
              }`}>
                {notes.length === 0 ? "0 chars" : `${notes.trim().split(/\s+/).filter(Boolean).length} words`}
              </span>
            </div>
            <textarea
              rows={5}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-3 outline-none font-medium leading-relaxed resize-none focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
              placeholder="Paste or type your cover letter here. This letter will be stored with your application and sent to the recruiter."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <p className="text-[11px] text-slate-400 mt-1">Tip: Generate a tailored letter in the Cover Letter Engine, then paste it here.</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            disabled={!company.trim() || !role.trim()}
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-bold disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} /> Create Application
          </button>
          <button onClick={onClose} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
