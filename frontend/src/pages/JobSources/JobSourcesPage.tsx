import { useState } from "react";
import ApiErrorCard from "../../components/ApiErrorCard";
import { Radio, RefreshCw, CheckCircle2, AlertTriangle, Clock, Globe } from "lucide-react";
import { useJobSources, useVerifySource } from "../../hooks/useJobSources";
import { jobSourcesService } from "../../services/jobSources.service";
import { SOURCE_STATUSES } from "../../types/jobSource.types";
import OpenedCareerModal from "../../components/OpenedCareerModal";

const STATUS_COLORS: Record<string, string> = { verified: "#10b981", recent: "#f59e0b", expired: "#ef4444", archived: "#64748b" };

export default function JobSourcesPage() {
  const [filter, setFilter] = useState("All");
  const { data: sources, isLoading, isError, refetch } = useJobSources(filter);
  const verifySource = useVerifySource();
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isOpenedCareerOpen, setIsOpenedCareerOpen] = useState(false);

  if (isLoading) return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading sources…</div>;
  if (isError) return <ApiErrorCard onRetry={refetch} />;

  const list = sources ?? [];
  const counts = {
    verified: list.filter((s) => s.status === "verified").length,
    recent: list.filter((s) => s.status === "recent").length,
    issues: list.filter((s) => ["expired", "archived"].includes(s.status)).length,
  };

  const refreshAll = async () => {
    setRefreshingAll(true);
    for (const s of list) {
      await verifySource.mutateAsync(s.id);
    }
    setRefreshingAll(false);
  };

  const handleSyncNow = async () => {
    setSyncingNow(true);
    setSyncMessage(null);
    try {
      const res = await jobSourcesService.syncNow();
      setSyncMessage(`Successfully fetched real jobs! Added ${res.total_new_jobs_added} new live listings.`);
      refetch();
    } catch (err: any) {
      setSyncMessage("Error fetching live jobs. Please check network connection.");
    } finally {
      setSyncingNow(false);
    }
  };

  return (
    <div className="p-2 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Source Monitor & Daily Ingestion</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Automated daily job fetching & live monitoring across CampusBizz and tech employer sources</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpenedCareerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold px-4 py-2.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Globe size={16} />
            <span>OpenedCareer Feed</span>
          </button>
          <button
            onClick={handleSyncNow}
            disabled={syncingNow}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold px-4 py-2.5 shadow-md shadow-blue-600/30 disabled:opacity-50 transition-all active:scale-95"
          >
            <Radio size={16} className={syncingNow ? "animate-pulse" : ""} />
            <span>{syncingNow ? "Fetching Live Jobs…" : "Fetch Real Jobs Now"}</span>
          </button>
          <button
            onClick={refreshAll}
            disabled={refreshingAll}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold px-4 py-2.5 border border-slate-200 dark:border-slate-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw size={15} className={refreshingAll ? "animate-spin" : ""} />
            <span>{refreshingAll ? "Refreshing All…" : "Refresh All"}</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-900 dark:text-blue-200 text-xs font-bold flex items-center justify-between shadow-sm">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-xs font-bold opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          ["Verified", counts.verified, "#10b981", <CheckCircle2 size={20} className="text-emerald-500" />],
          ["Recent", counts.recent, "#f59e0b", <Clock size={20} className="text-amber-500" />],
          ["Issues", counts.issues, "#ef4444", <AlertTriangle size={20} className="text-rose-500" />]
        ].map(([label, n, color, icon]) => (
          <div key={label as string} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{label as string}</div>
              <div className="text-2xl font-extrabold mt-1" style={{ color: color as string }}>{n as number}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              {icon as React.ReactNode}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["All", ...SOURCE_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-semibold rounded-xl px-3.5 py-2 border capitalize transition-all ${
              filter === s
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_120px_140px_80px_100px] px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div>Company</div>
          <div>Status</div>
          <div>Last Checked</div>
          <div>Jobs</div>
          <div className="text-right">Action</div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {list.map((s) => (
            <div key={s.id} className="grid grid-cols-[1fr_120px_140px_80px_100px] px-5 py-3.5 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.company_name}</div>
              <div className="text-xs font-bold capitalize flex items-center gap-1.5" style={{ color: STATUS_COLORS[s.status] }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS[s.status] }} />
                <span>{s.status}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{new Date(s.last_checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.jobs_found}</div>
              <div className="text-right">
                <button
                  onClick={() => verifySource.mutate(s.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <RefreshCw size={12} />
                  <span>Verify</span>
                </button>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-400 dark:text-slate-500">
              No sources found. Run seed_job_sources.py to populate source registry.
            </div>
          )}
        </div>
      </div>

      <OpenedCareerModal
        isOpen={isOpenedCareerOpen}
        onClose={() => setIsOpenedCareerOpen(false)}
      />
    </div>
  );
}
