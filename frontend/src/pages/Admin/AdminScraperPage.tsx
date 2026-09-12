import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Radio, RefreshCw, Play, CheckCircle2, AlertTriangle, Clock, Server, Search, Filter } from "lucide-react";
import { jobSourcesService, JobSource } from "../../services/jobSources.service";

export default function AdminScraperPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [runningId, setRunningId] = useState<string | null>(null);

  const { data: sources = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin-job-sources"],
    queryFn: () => jobSourcesService.list(),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => jobSourcesService.verify(id),
    onMutate: (id) => setRunningId(id),
    onSettled: () => {
      setRunningId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-job-sources"] });
    },
  });

  const handleRunScraper = (id: string) => {
    verifyMutation.mutate(id);
  };

  const filteredSources = sources.filter((s: JobSource) => {
    const matchesSearch = (s.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.url || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || s.scrape_method === filter;
    return matchesSearch && matchesFilter;
  });

  const totalSources = sources.length;
  const activeSources = sources.filter((s: JobSource) => s.status !== "archived").length;
  const greenSources = sources.filter((s: JobSource) => s.status === "verified" || s.status === "recent").length;

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
            <p className="text-xs text-slate-400 mt-0.5">Automated job discovery pipelines, ATS API connectors & Playwright status</p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
          <span>{isRefetching ? "Refreshing..." : "Refresh Scrapers"}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
            <Server size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalSources}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Configured Sources</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{activeSources}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Pipelines</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{greenSources} / {totalSources}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Healthy Last Run</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter sources by name or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter size={14} className="text-slate-400 shrink-0" />
          {["all", "greenhouse", "lever", "workday", "custom"].map((t) => (
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
        </div>
      </div>

      {/* Table / List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">Loading scraper status...</div>
        ) : filteredSources.length === 0 ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">No job sources found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4">Source Name</th>
                  <th className="py-3.5 px-4">Platform Type</th>
                  <th className="py-3.5 px-4">Target URL</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
                {filteredSources.map((source: JobSource) => {
                  const isRunning = runningId === source.id;
                  const isHealthy = source.status === "verified" || source.status === "recent";
                  return (
                    <tr key={source.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {source.company_name || "Job Source"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {source.scrape_method || "custom"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400">
                        <a href={source.url} target="_blank" rel="noreferrer" className="hover:underline hover:text-indigo-500">
                          {source.url}
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        {isHealthy ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={12} />
                            Healthy
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle size={12} />
                            {source.status || "Pending"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRunScraper(source.id)}
                          disabled={isRunning}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-all disabled:opacity-50"
                        >
                          <Play size={12} className={isRunning ? "animate-spin" : ""} />
                          <span>{isRunning ? "Scraping..." : "Run Now"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
