import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Radio, RefreshCw, Play, CheckCircle2, Clock, Server,
  Search, Filter, Zap, Trash2, PlusCircle, XCircle, Database, Activity,
  Link2, Calendar
} from "lucide-react";
import { jobSourcesService, JobSource, CreateJobSourcePayload } from "../../services/jobSources.service";

function relativeTime(ts: string): string {
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    const mo = Math.floor(d / 30);
    return `${mo}mo ago`;
  } catch {
    return "unknown";
  }
}

const STATUS_FILTERS = ["all", "verified", "recent", "expired", "archived"];

const statusStyle: Record<string, string> = {
  verified: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  recent:   "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  expired:  "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  archived: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "verified") return <CheckCircle2 size={12} />;
  if (status === "expired")  return <XCircle size={12} />;
  if (status === "archived") return <Clock size={12} />;
  return <Activity size={12} />;
};

interface AddSourceModalProps {
  onClose: () => void;
  onSubmit: (data: CreateJobSourcePayload) => void;
  isLoading: boolean;
}

function AddSourceModal({ onClose, onSubmit, isLoading }: AddSourceModalProps) {
  const [form, setForm] = useState<CreateJobSourcePayload>({
    company_id: "1",
    company_name: "",
    url: "",
    scrape_method: "scrape",
    status: "recent",
    jobs_found: 0,
  });

  const handleChange = (k: keyof CreateJobSourcePayload, v: string | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Add Job Source</h2>
            <p className="text-xs text-slate-500 mt-0.5">Register a new scraper pipeline</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Company Name *</label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => handleChange("company_name", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Safaricom PLC"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Career Page URL *</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => handleChange("url", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://careers.company.com"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Scrape Method</label>
            <select
              value={form.scrape_method}
              onChange={(e) => handleChange("scrape_method", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="scrape">HTML Scrape</option>
              <option value="greenhouse">Greenhouse ATS</option>
              <option value="lever">Lever ATS</option>
              <option value="workday">Workday</option>
              <option value="remotive">Remotive API</option>
              <option value="arbeitnow">Arbeitnow API</option>
              <option value="ashby">Ashby ATS</option>
              <option value="rss">RSS Feed</option>
              <option value="api">Custom API</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={isLoading || !form.company_name || !form.url}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
          >
            {isLoading ? "Adding..." : "Add Source"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminScraperPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [runningId, setRunningId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncResult, setSyncResult] = useState<{ added: number; expired: number } | null>(null);

  const { data: sources = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin-job-sources"],
    queryFn: () => jobSourcesService.list(),
    refetchInterval: 60_000,
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => jobSourcesService.verify(id),
    onMutate: (id) => setRunningId(id),
    onSettled: () => {
      setRunningId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-job-sources"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => jobSourcesService.syncNow(),
    onSuccess: (data) => {
      setSyncResult({ added: data.total_new_jobs_added || 0, expired: data.expired_jobs_swept || 0 });
      queryClient.invalidateQueries({ queryKey: ["admin-job-sources"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setTimeout(() => setSyncResult(null), 8000);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateJobSourcePayload) => jobSourcesService.create(payload),
    onSuccess: () => {
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ["admin-job-sources"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobSourcesService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-job-sources"] }),
  });

  const filteredSources = sources.filter((s: JobSource) => {
    const matchesSearch =
      (s.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.url || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.scrape_method || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalSources  = sources.length;
  const healthySources = sources.filter((s: JobSource) => s.status === "verified").length;
  const totalJobsFound = sources.reduce((sum: number, s: JobSource) => sum + (s.jobs_found || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Radio size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Scraper Engine Monitor</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated job discovery pipelines, ATS API connectors &amp; live feed scrapers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
            <span>{isRefetching ? "Refreshing..." : "Refresh"}</span>
          </button>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
          >
            <Zap size={14} className={syncMutation.isPending ? "animate-pulse" : ""} />
            <span>{syncMutation.isPending ? "Syncing All..." : "Sync All Sources"}</span>
          </button>
        </div>
      </div>

      {/* Sync Result Toast */}
      {syncResult && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold shadow-sm">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>
            ✅ Sync complete — <strong>{syncResult.added} new jobs added</strong>
            {syncResult.expired > 0 ? `, ${syncResult.expired} expired jobs swept.` : "."}
          </span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Server size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalSources}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Configured Sources</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{healthySources} / {totalSources}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verified Sources</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Database size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalJobsFound.toLocaleString()}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Jobs Found</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by name, URL, or method..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter size={14} className="text-slate-400 shrink-0" />
          {STATUS_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all shrink-0 ${
                filter === t
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}

          <div className="ml-2 h-6 border-l border-slate-200 dark:border-slate-700 shrink-0" />

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0"
          >
            <PlusCircle size={13} />
            Add Source
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading scraper status...
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Server size={32} className="text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No job sources found</p>
            <p className="text-xs text-slate-400">Try changing the filter or add a new source</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4">Source Name</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Target URL</th>
                  <th className="py-3.5 px-4 text-center">Jobs Found</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Checked</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
                {filteredSources.map((source: JobSource) => {
                  const isRunning = runningId === source.id;
                  const isDeleting = deleteMutation.isPending;
                  const style = statusStyle[source.status] ?? statusStyle.archived;

                  return (
                    <tr key={source.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white max-w-[180px]">
                        <div className="truncate" title={source.company_name}>
                          {source.company_name || "Job Source"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {source.scrape_method || "custom"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-indigo-500 hover:underline truncate max-w-full"
                          title={source.url}
                        >
                          <Link2 size={11} className="shrink-0" />
                          <span className="truncate">{source.url?.replace(/^https?:\/\//, "").slice(0, 40)}</span>
                        </a>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-slate-800 dark:text-slate-100">
                          {(source.jobs_found || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${style}`}>
                          <StatusIcon status={source.status} />
                          {source.status || "pending"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="shrink-0" />
                          <span className="whitespace-nowrap">
                            {source.last_checked_at ? relativeTime(source.last_checked_at) : "Never"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => verifyMutation.mutate(source.id)}
                            disabled={isRunning}
                            title="Run scraper for this source"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all disabled:opacity-50 shadow-sm shadow-indigo-600/20"
                          >
                            <Play size={12} className={isRunning ? "animate-spin" : ""} />
                            <span>{isRunning ? "Running..." : "Run"}</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Delete "${source.company_name}"?`)) {
                                deleteMutation.mutate(source.id);
                              }
                            }}
                            disabled={isDeleting}
                            title="Delete source"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination hint */}
      {filteredSources.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          Showing {filteredSources.length} of {totalSources} sources
        </p>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <AddSourceModal
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}
