import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Trash2, ExternalLink, Mail, CheckCircle2, FileSpreadsheet, FileText, FileCode, ArrowLeft } from "lucide-react";
import { useAdminCompanies, useDeleteAdminCompany } from "../../hooks/useAdmin";
import { adminService } from "../../services/admin.service";
import type { AdminCompany } from "../../types/admin.types";

const TIER_LABELS: Record<number, { label: string; cls: string }> = {
  1: { label: "Tier 1", cls: "bg-violet-100 dark:bg-violet-950/50 text-violet-900 dark:text-violet-200 border-violet-300 dark:border-violet-800" },
  2: { label: "Tier 2", cls: "bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800" },
  3: { label: "Tier 3", cls: "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-300 border-slate-300 dark:border-slate-700" },
};

export default function AdminCompaniesPage() {
  const navigate = useNavigate();
  const [tierFilter, setTierFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AdminCompany | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data: companies, isLoading } = useAdminCompanies(tierFilter, sectorFilter);
  const deleteCompany = useDeleteAdminCompany();

  const toast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      await adminService.downloadExport("companies", format);
      toast(`Exported companies to ${format.toUpperCase()} successfully.`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    deleteCompany.mutate(confirmDelete.id, {
      onSuccess: () => {
        toast(`Company "${confirmDelete.name}" deleted.`);
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
            Companies Management
          </h1>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-300 mt-1">
            {companies?.length ?? 0} companies in the platform. Filter by tier or export report data.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            disabled={exporting}
            onClick={() => handleExport("excel")}
            className="px-3.5 py-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5 hover:bg-emerald-200 transition-colors disabled:opacity-50 shadow-xs"
          >
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button
            disabled={exporting}
            onClick={() => handleExport("pdf")}
            className="px-3.5 py-2 bg-rose-100 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5 hover:bg-rose-200 transition-colors disabled:opacity-50 shadow-xs"
          >
            <FileText size={15} /> PDF
          </button>
          <button
            disabled={exporting}
            onClick={() => handleExport("word")}
            className="px-3.5 py-2 bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5 hover:bg-blue-200 transition-colors disabled:opacity-50 shadow-xs"
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
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950 dark:text-white outline-none shadow-xs"
        >
          <option value="">All Tiers</option>
          <option value="1">Tier 1 (Enterprise / FAANG)</option>
          <option value="2">Tier 2 (Growth / Scale-up)</option>
          <option value="3">Tier 3 (Early Stage / Agency)</option>
        </select>
        <input
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          placeholder="Filter by sector (e.g. Fintech, Cloud)..."
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950 dark:text-white outline-none flex-1 shadow-xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-800 dark:text-slate-400 text-sm font-bold">Loading companies…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/40 text-xs text-slate-950 dark:text-slate-200 text-left font-black uppercase tracking-wider">
                  <th className="px-5 py-3.5 font-black">Company</th>
                  <th className="px-5 py-3.5 font-black">Sector</th>
                  <th className="px-5 py-3.5 font-black">Location</th>
                  <th className="px-5 py-3.5 font-black">Tier</th>
                  <th className="px-5 py-3.5 font-black">Open Roles</th>
                  <th className="px-5 py-3.5 font-black">ATS</th>
                  <th className="px-5 py-3.5 font-black">Added</th>
                  <th className="px-5 py-3.5 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(companies ?? []).map((c) => {
                  const tier = TIER_LABELS[c.tier] ?? TIER_LABELS[3];
                  return (
                    <tr key={c.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-950 dark:text-white text-sm">{c.name}</div>
                        {c.contact_email && (
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                            <Mail size={12} /> {c.contact_email}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-300">{c.sector || "—"}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-300">{c.location || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${tier.cls}`}>
                          {tier.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-300">{c.open_roles_count}</td>
                      <td className="px-5 py-3.5 text-slate-800 dark:text-slate-300 text-xs font-bold">{c.ats_platform || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-800 dark:text-slate-300 text-xs font-bold">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.career_url && (
                            <a
                              href={c.career_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open career page"
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 hover:text-blue-600 transition-colors"
                            >
                              <ExternalLink size={15} />
                            </a>
                          )}
                          <button
                            onClick={() => setConfirmDelete(c)}
                            title="Delete company"
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!companies || companies.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-800 dark:text-slate-400 font-bold text-sm">
                      No companies found.
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
            <h3 className="text-base font-black text-slate-950 dark:text-white">Delete Company?</h3>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-300 mt-2">
              Permanently delete <strong>{confirmDelete.name}</strong>? This cannot be undone.
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
                disabled={deleteCompany.isPending}
                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-extrabold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
