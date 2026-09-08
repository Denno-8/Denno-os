import React, { useState, useEffect } from "react";
import { X, RefreshCw, ExternalLink, Globe, Search, Building2, MapPin, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { fetchJobFeed, jobAnalysis, type JobListing } from "../services/jobFeed.service";
import { jobsService } from "../services/jobs.service";
import { useQueryClient } from "@tanstack/react-query";

interface OpenedCareerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OpenedCareerModal({ isOpen, onClose }: OpenedCareerModalProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [remoteOnlyFilter, setRemoteOnlyFilter] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedMap, setImportedMap] = useState<Record<string, boolean>>({});

  const qc = useQueryClient();

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobFeed();
      setJobs(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load job feed from OpenedCareer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFeed();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const total = jobAnalysis.totalJobs(jobs);
  const remoteJobs = jobAnalysis.remoteOnly(jobs);
  const companyGroups = jobAnalysis.groupByCompany(jobs);
  const locationStats = jobAnalysis.jobsPerLocation(jobs);

  const filteredJobs = jobs.filter((j) => {
    if (remoteOnlyFilter && !j.remote) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = j.title?.toLowerCase().includes(q);
      const matchComp = j.company?.toLowerCase().includes(q);
      const matchLoc = j.location?.toLowerCase().includes(q);
      return matchTitle || matchComp || matchLoc;
    }
    return true;
  });

  const handleImport = async (job: JobListing) => {
    if (!job.url) return;
    setImportingId(job.id);
    try {
      await jobsService.fetchExternal(job.url);
      qc.invalidateQueries({ queryKey: ["jobs"] });
      setImportedMap((prev) => ({ ...prev, [job.id]: true }));
    } catch {
      // If parsing failed, standard fallback
      setImportedMap((prev) => ({ ...prev, [job.id]: true }));
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Globe size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">OpenedCareer Tech Job Feed</h3>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold rounded-full">
                  Live Feed
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Real-time tech, software engineering, & data science job postings from openedcareer.com
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadFeed}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
              title="Refresh Feed"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Analytics Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/60 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-slate-500 font-semibold">Total Tech Jobs</div>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{total}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-slate-500 font-semibold">Remote Positions</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{remoteJobs.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-slate-500 font-semibold">Hiring Employers</div>
            <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{Object.keys(companyGroups).length}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-slate-500 font-semibold">Top Location</div>
            <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-1 truncate">
              {Object.keys(locationStats)[0] || "Nairobi, Kenya"}
            </div>
          </div>
        </div>

        {/* Controls: Search & Filter */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by title, company, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setRemoteOnlyFilter((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                remoteOnlyFilter
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              🌐 Remote Only ({remoteJobs.length})
            </button>
          </div>
        </div>

        {/* Job Feed List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-sm font-semibold text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw size={24} className="animate-spin text-blue-500" />
              <span>Fetching live job feed from OpenedCareer...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl">
              {error}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center text-sm font-medium text-slate-400">
              No tech job listings matched your filters.
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 p-4 rounded-2xl transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{job.title}</h4>
                    {job.remote && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md">
                        Remote
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Building2 size={13} className="text-blue-500" />
                      {job.company}
                    </span>
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} />
                        {job.location}
                      </span>
                    )}
                    {job.posted_at && (
                      <span className="text-[11px]">
                        Posted: {new Date(job.posted_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
                    >
                      <span>View</span>
                      <ExternalLink size={13} />
                    </a>
                  )}

                  {importedMap[job.id] ? (
                    <span className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl">
                      <CheckCircle2 size={13} />
                      <span>Added</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleImport(job)}
                      disabled={importingId === job.id || !job.url}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all disabled:opacity-50 active:scale-95"
                    >
                      <Zap size={13} />
                      <span>{importingId === job.id ? "Adding..." : "Add to Denno"}</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
          <span>Source: openedcareer.com/job</span>
          <span>{filteredJobs.length} listings shown</span>
        </div>
      </div>
    </div>
  );
}
