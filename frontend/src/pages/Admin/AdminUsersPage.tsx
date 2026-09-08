import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Shield, UserX, Trash2, CheckCircle2, Download, FileSpreadsheet, FileText, FileCode, ArrowLeft
} from "lucide-react";
import {
  useAdminUsers,
  useUpdateUserRole,
  useSuspendUser,
  useDeleteAdminUser,
  usePromoteByEmail,
} from "../../hooks/useAdmin";
import { adminService } from "../../services/admin.service";
import type { AdminUser } from "../../types/admin.types";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [promoteEmail, setPromoteEmail] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data: users, isLoading } = useAdminUsers(q, roleFilter, statusFilter);
  const updateRole = useUpdateUserRole();
  const suspendUser = useSuspendUser();
  const deleteUser = useDeleteAdminUser();
  const promoteByEmail = usePromoteByEmail();

  const toast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      await adminService.downloadExport("users", format);
      toast(`Exported users to ${format.toUpperCase()} successfully.`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const handleRoleToggle = (u: AdminUser) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    updateRole.mutate({ id: u.id, role: newRole }, {
      onSuccess: () => toast(`${u.email} role updated to ${newRole}`),
    });
  };

  const handleSuspend = (u: AdminUser) => {
    suspendUser.mutate({ id: u.id, suspended: u.is_active }, {
      onSuccess: () => toast(`${u.email} ${u.is_active ? "suspended" : "reactivated"}`),
    });
  };

  const handleDelete = (u: AdminUser) => setConfirmDelete(u);

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    deleteUser.mutate(confirmDelete.id, {
      onSuccess: () => {
        toast(`User ${confirmDelete.email} permanently deleted.`);
        setConfirmDelete(null);
      },
    });
  };

  const handlePromote = () => {
    if (!promoteEmail.trim()) return;
    promoteByEmail.mutate(promoteEmail.trim(), {
      onSuccess: () => {
        toast(`${promoteEmail} promoted to admin!`);
        setPromoteEmail("");
      },
    });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header & Export toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors mb-2"
          >
            <ArrowLeft size={13} /> Back to Admin Overview
          </button>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">User Management</h1>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-300 mt-1">
            {users?.length ?? 0} registered accounts. Filter, promote, suspend, or export report data.
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

      {/* Promote by email */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center shadow-sm">
        <Shield size={20} className="text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1">
          <div className="text-sm font-black text-slate-950 dark:text-white">Promote User to Admin</div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-300 mt-0.5">Enter an existing user's email address to grant admin privileges.</div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            value={promoteEmail}
            onChange={(e) => setPromoteEmail(e.target.value)}
            placeholder="user@email.com"
            className="flex-1 sm:w-56 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-950 dark:text-white outline-none focus:border-rose-500 shadow-xs"
          />
          <button
            onClick={handlePromote}
            disabled={promoteByEmail.isPending || !promoteEmail.trim()}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-extrabold transition-colors disabled:opacity-50 shadow-xs"
          >
            Promote
          </button>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-700" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search users by email or name…"
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-950 dark:text-white outline-none focus:border-blue-500 shadow-xs"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950 dark:text-white outline-none shadow-xs"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin Only</option>
          <option value="user">User Only</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950 dark:text-white outline-none shadow-xs"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-800 dark:text-slate-400 text-sm font-bold">Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/40 text-xs text-slate-950 dark:text-slate-200 text-left font-black uppercase tracking-wider">
                  <th className="px-5 py-3.5 font-black">User</th>
                  <th className="px-5 py-3.5 font-black">Role</th>
                  <th className="px-5 py-3.5 font-black">Status</th>
                  <th className="px-5 py-3.5 font-black">Apps</th>
                  <th className="px-5 py-3.5 font-black">Joined</th>
                  <th className="px-5 py-3.5 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(users ?? []).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-extrabold text-slate-950 dark:text-white text-sm">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mt-0.5">{u.email}</div>
                      {u.title && <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-400 mt-0.5">{u.title}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        u.role === "admin"
                          ? "bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        u.is_active !== false
                          ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                          : "bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                      }`}>
                        {u.is_active !== false ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-300">{u.application_count}</td>
                    <td className="px-5 py-3.5 text-slate-800 dark:text-slate-300 text-xs font-bold">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleRoleToggle(u)}
                          title={u.role === "admin" ? "Demote to user" : "Promote to admin"}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 hover:text-rose-600 transition-colors"
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          onClick={() => handleSuspend(u)}
                          title={u.is_active !== false ? "Suspend" : "Reactivate"}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 hover:text-amber-600 transition-colors"
                        >
                          <UserX size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          title="Delete user"
                          className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!users || users.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-800 dark:text-slate-400 font-bold text-sm">
                      No users found.
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
            <h3 className="text-base font-black text-slate-950 dark:text-white">Permanently Delete User?</h3>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-300 mt-2">
              This will permanently delete <strong>{confirmDelete.email}</strong> and all their data (applications, CVs, notes, goals, emails). This action cannot be undone.
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
                disabled={deleteUser.isPending}
                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-extrabold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 size={15} />
                <span>Delete User</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
