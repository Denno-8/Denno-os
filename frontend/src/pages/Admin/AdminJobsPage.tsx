import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Trash2, ExternalLink, Flame, CheckCircle2, FileSpreadsheet, FileText, FileCode, RefreshCw, ArrowLeft } from "lucide-react";
import { useAdminJobs, useDeleteAdminJob } from "../../hooks/useAdmin";
import { adminService } from "../../services/admin.service";
import { api } from "../../services/api";
import type { AdminJob } from "../../types/admin.types";

export default function AdminJobsPage() {
  const navigate = useNavigate();
  const [modeFilter, setModeFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [expiredFilter, setExpiredFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AdminJob | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [exporting, setExporting] = useState(false);
  const [sweeping, setSweeping] = useState(false);

  const { data: jobs, isLoading, refetch } = useAdminJobs(modeFilter, levelFilter, expiredFilter);
  const deleteJob = useDeleteAdminJob();

  const toast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      await adminService.downloadExport("jobs", format);
      toast(`Exported jobs to ${format.toUpperCase()} successfully.`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const handleExpireSweep = async () => {
    setSweeping(true);
    try {
      const res = await api.post<any>("/jobs/expire-sweep", {});
      toast(`Sweep complete: ${res.expired_count} overdue jobs marked expired.`);
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setSweeping(false);
    }
  };

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    deleteJob.mutate(confirmDelete.id, {
      onSuccess: () => {
        toast(`Job "${confirmDelete.title}" deleted.`);
        setConfirmDelete(null);
      },
    });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors mb-2"
          >
            <ArrowLeft size={13} /> Back to Admin Overview
          </button>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
            Jobs Management
          </h1>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-300 mt-1">
            {jobs?.length ?? 0} job listings across the platform. Run expiry sweeps or export report data.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            disabled={sweeping}
            onClick={handleExpireSweep}
            className="px-3.5 py-2 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5 hover:bg-amber-200 transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw size={15} className={sweeping ? "animate-spin" : ""} /> Sweep Expired
          </button>
          <button
            disabled={exporting}
            onClick={() => handleExport("excel")}
            className="px-3.5 py-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5 hover:bg-emerald-200 transition-colors disabled:opacity-50 shadow-xs"
          >
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button
            disabled={exporting}
            onClick={() => handleExport("pdf")}
            className="px-3.5 py-2 bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5 hover:bg-rose-200 transition-colors disabled:opacity-50 shadow-xs"
          >
            <FileText size={15} /> PDF
          </button>
          <button
            disabled={exporting}
            onClick={() => handleExport("word")}
            className="px-3.5 py-2 bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5 hover:bg-blue-200 transition-colors disabled:opacity-50 shadow-xs"
          >
            <FileCode size={15} /> Word
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 text-xs font-extrabold border border-emerald-300 dark:border-emerald-800 shadow-xs">
          <CheckCircle2 size={15} /> {successMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950 dark:text-white outline-none shadow-xs"
        >
          <option value="">All Work Modes</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Onsite">Onsite</option>
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950 dark:text-white outline-none shadow-xs"
        >
          <option value="">All Experience Levels</option>
          <option value="Entry">Entry</option>
          <option value="Junior">Junior</option>
          <option value="Mid">Mid</option>
          <option value="Senior">Senior</option>
          <option value="Lead">Lead</option>
        </select>
        <select
          value={expiredFilter}
          onChange={(e) => setExpiredFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950 dark:text-white outline-none shadow-xs"
        >
          <option value="">All Statuses (Active & Expired)</option>
          <option value="false">Active Only</option>
          <option value="true">Expired Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-700 dark:text-slate-400 text-sm font-bold">Loading jobs…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/40 text-xs text-slate-950 dark:text-slate-200 text-left font-black uppercase tracking-wider">
                  <th className="px-5 py-3.5 font-black">Job</th>
                  <th className="px-5 py-3.5 font-black">Company</th>
                  <th className="px-5 py-3.5 font-black">Type</th>
                  <th className="px-5 py-3.5 font-black">Level</th>
                  <th className="px-5 py-3.5 font-black">Status</th>
                  <th className="px-5 py-3.5 font-black">Match</th>
                  <th className="px-5 py-3.5 font-black">Posted</th>
                  <th className="px-5 py-3.5 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(jobs ?? []).map((j) => (
                  <tr key={j.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {j.is_hot && <Flame size={15} className="text-orange-600 shrink-0" />}
                        <div>
                          <div className="font-extrabold text-slate-950 dark:text-white text-sm">{j.title}</div>
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-400 mt-0.5">{j.mode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-slate-900 dark:text-slate-200">{j.company_name}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-300 capitalize">{j.employment_type}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-300">{j.level}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        j.is_expired
                          ? "bg-rose-100 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border-rose-300"
                          : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-300"
                      }`}>
                        {j.is_expired ? "Expired" : "Live"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {j.match_score != null ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold border ${
                          j.match_score >= 70
                            ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-300"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300"
                        }`}>
                          {j.match_score}%
                        </span>
                      ) : (
                        <span className="text-slate-500 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 dark:text-slate-300 text-xs font-bold">
                      {j.created_at ? new Date(j.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {j.source_url && (
                          <a
                            href={j.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open source"
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 hover:text-blue-600 transition-colors"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button
                          onClick={() => setConfirmDelete(j)}
                          title="Delete job"
                          className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!jobs || jobs.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-800 dark:text-slate-400 font-bold text-sm">
                      No jobs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-black text-slate-950 dark:text-white">Delete Job Listing?</h3>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-300 mt-2">
              Permanently delete <strong>"{confirmDelete.title}"</strong> at{" "}
              <strong>{confirmDelete.company_name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                disabled={deleteJob.isPending}
                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-extrabold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 size={15} />
                <span>Delete Job</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
