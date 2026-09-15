import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Shield, UserX, Trash2, CheckCircle2, FileSpreadsheet,
  FileText, FileCode, ArrowLeft, Edit3, KeyRound, ChevronLeft,
  ChevronRight, Users, AlertTriangle, X, Eye, EyeOff, UserCheck,
  RefreshCw, Loader2,
} from "lucide-react";
import {
  useAdminUsers,
  useUpdateUserProfile,
  useUpdateUserRole,
  useSuspendUser,
  useDeleteAdminUser,
  usePromoteByEmail,
  useResetUserPassword,
} from "../../hooks/useAdmin";
import { adminService } from "../../services/admin.service";
import type { AdminUser } from "../../types/admin.types";

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const show = useCallback((text: string, type: "success" | "error" = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  }, []);
  return { msg, show };
}

// ─── Pill badge ───────────────────────────────────────────────────────────────
const RolePill = ({ role }: { role: string }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border select-none ${
    role === "admin"
      ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800"
      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
  }`}>
    {role === "admin" && <Shield size={10} />} {role}
  </span>
);

const StatusPill = ({ active }: { active: boolean }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border select-none ${
    active
      ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
      : "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800"
  }`}>
    {active ? <UserCheck size={10} /> : <UserX size={10} />}
    {active ? "Active" : "Suspended"}
  </span>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ user }: { user: AdminUser }) => {
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase();
  const colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
  const color = colors[user.id % colors.length];
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0 shadow-sm" style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
};

// ─── Edit User Modal ──────────────────────────────────────────────────────────
interface EditModalProps {
  user: AdminUser;
  onClose: () => void;
  onSaved: (msg: string) => void;
}

function EditUserModal({ user, onClose, onSaved }: EditModalProps) {
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    title: user.title,
    location: user.location,
    phone: user.phone ?? "",
    years_experience: user.years_experience ?? 0,
    role: user.role,
    is_active: user.is_active,
  });
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const updateProfile = useUpdateUserProfile();
  const resetPassword = useResetUserPassword();

  const set = (field: string, val: unknown) => setForm((f) => ({ ...f, [field]: val }));

  const handleSaveProfile = () => {
    setError("");
    updateProfile.mutate(
      { id: user.id, payload: form },
      {
        onSuccess: () => onSaved(`${user.email} profile updated successfully.`),
        onError: (e: unknown) => setError((e as Error).message || "Failed to update profile."),
      }
    );
  };

  const handleResetPassword = () => {
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    resetPassword.mutate(
      { id: user.id, new_password: newPassword },
      {
        onSuccess: () => { setNewPassword(""); onSaved(`Password reset for ${user.email}.`); },
        onError: (e: unknown) => setError((e as Error).message || "Failed to reset password."),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <Avatar user={user} />
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-slate-900 dark:text-white truncate">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {(["profile", "password"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-colors ${
                tab === t
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t === "profile" ? "Edit Profile" : "Reset Password"}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {tab === "profile" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "First Name", field: "first_name" },
                  { label: "Last Name", field: "last_name" },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</label>
                    <input
                      value={(form as Record<string, unknown>)[field] as string}
                      onChange={(e) => set(field, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Job Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => set("role", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Account Status</label>
                  <select
                    value={form.is_active ? "active" : "suspended"}
                    onChange={(e) => set("is_active", e.target.value === "active")}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={updateProfile.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {updateProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Save Changes
                </button>
              </div>
            </>
          )}

          {tab === "password" && (
            <>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  ⚠️ This will immediately reset the user's password. They will need to use the new password to log in.
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                  />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {newPassword && (
                  <div className={`mt-1 text-[11px] font-bold ${newPassword.length >= 8 ? "text-emerald-600" : "text-rose-500"}`}>
                    {newPassword.length >= 8 ? "✓ Strong enough" : `${8 - newPassword.length} more characters needed`}
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={resetPassword.isPending || newPassword.length < 8}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-extrabold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {resetPassword.isPending ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  Reset Password
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({ user, onClose, onConfirm, loading }: {
  user: AdminUser; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center mb-4 mx-auto">
          <Trash2 size={22} className="text-rose-600" />
        </div>
        <h3 className="text-center text-base font-black text-slate-900 dark:text-white">Delete This User?</h3>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          This will permanently delete <span className="font-extrabold text-slate-800 dark:text-slate-200">{user.email}</span> and all their data — applications, CVs, notes, goals, and emails.
        </p>
        <p className="text-center text-xs font-bold text-rose-600 dark:text-rose-400 mt-1">This action cannot be undone.</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-extrabold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { msg: toast, show: showToast } = useToast();

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [exporting, setExporting] = useState(false);

  const skip = page * PAGE_SIZE;
  const { data, isLoading, isFetching, refetch } = useAdminUsers(q, roleFilter, statusFilter, skip, PAGE_SIZE);

  const users: AdminUser[] = Array.isArray(data)
    ? data
    : (data?.items ?? data?.users ?? []);

  const total = Array.isArray(data)
    ? data.length
    : (data?.total ?? users.length);

  const hasMore = Array.isArray(data)
    ? false
    : (data?.has_more ?? (data?.page !== undefined && data.page < (data?.total_pages ?? 1)));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const updateRole = useUpdateUserRole();
  const suspendUser = useSuspendUser();
  const deleteUser = useDeleteAdminUser();
  const promoteByEmail = usePromoteByEmail();

  const handleSearch = (val: string) => { setQ(val); setPage(0); };
  const handleRoleFilter = (val: string) => { setRoleFilter(val); setPage(0); };
  const handleStatusFilter = (val: string) => { setStatusFilter(val); setPage(0); };

  const handleRoleToggle = (u: AdminUser) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    updateRole.mutate({ id: u.id, role: newRole }, {
      onSuccess: () => showToast(`${u.email} role updated to ${newRole}`),
      onError: (e) => showToast((e as Error).message || "Failed to update role.", "error"),
    });
  };

  const handleSuspend = (u: AdminUser) => {
    const willSuspend = u.is_active;
    suspendUser.mutate({ id: u.id, suspended: willSuspend }, {
      onSuccess: () => showToast(`${u.email} ${willSuspend ? "suspended" : "reactivated"}.`),
      onError: (e) => showToast((e as Error).message || "Failed to update status.", "error"),
    });
  };

  const confirmDeleteAction = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => { showToast(`User ${deleteTarget.email} permanently deleted.`); setDeleteTarget(null); },
      onError: (e) => { showToast((e as Error).message || "Failed to delete user.", "error"); setDeleteTarget(null); },
    });
  };

  const handlePromote = () => {
    if (!promoteEmail.trim()) return;
    promoteByEmail.mutate(promoteEmail.trim(), {
      onSuccess: () => { showToast(`${promoteEmail} promoted to admin!`); setPromoteEmail(""); },
      onError: (e) => showToast((e as Error).message || "Failed to promote user.", "error"),
    });
  };

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      await adminService.downloadExport("users", format);
      showToast(`Exported users to ${format.toUpperCase()} successfully.`);
    } catch {
      showToast("Export failed.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mb-2"
          >
            <ArrowLeft size={13} /> Back to Admin Overview
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users size={22} className="text-blue-500" />
            User Management
          </h1>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
            {isLoading ? "Loading…" : `${total.toLocaleString()} registered accounts`}
            {(isFetching && !isLoading) && <span className="ml-2 inline-flex items-center gap-1 text-blue-500"><Loader2 size={12} className="animate-spin" />Refreshing…</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          {[
            { format: "excel", label: "Excel", Icon: FileSpreadsheet, color: "emerald" },
            { format: "pdf",   label: "PDF",   Icon: FileText,        color: "rose" },
            { format: "word",  label: "Word",  Icon: FileCode,        color: "blue" },
          ].map(({ format, label, Icon, color }) => (
            <button
              key={format}
              disabled={exporting}
              onClick={() => handleExport(format)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50 transition-colors border
                bg-${color}-50 dark:bg-${color}-950/30 text-${color}-700 dark:text-${color}-300 border-${color}-200 dark:border-${color}-800 hover:bg-${color}-100 dark:hover:bg-${color}-950/50`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold border shadow-sm transition-all ${
          toast.type === "error"
            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
        }`}>
          {toast.type === "error" ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          {toast.text}
        </div>
      )}

      {/* ── Promote by email ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
          <Shield size={18} className="text-rose-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-black text-slate-900 dark:text-white">Promote User to Admin</div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Grant admin privileges by entering a user's email address.</div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            value={promoteEmail}
            onChange={(e) => setPromoteEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePromote()}
            placeholder="user@email.com"
            className="flex-1 sm:w-56 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition"
          />
          <button
            onClick={handlePromote}
            disabled={promoteByEmail.isPending || !promoteEmail.trim()}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-extrabold transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {promoteByEmail.isPending ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
            Promote
          </button>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
          />
          {q && (
            <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin Only</option>
          <option value="user">User Only</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
        </select>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 p-16 text-slate-500 dark:text-slate-400">
            <Loader2 size={22} className="animate-spin text-blue-500" />
            <span className="text-sm font-bold">Loading users…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left">
                  {["User", "Role", "Status", "Apps", "Joined", "Actions"].map((h, i) => (
                    <th key={h} className={`px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 ${i === 5 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* User cell */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar user={u} />
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                            {u.first_name} {u.last_name}
                            {!u.first_name && !u.last_name && <span className="text-slate-400 italic">No name</span>}
                          </div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{u.email}</div>
                          {u.title && <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">{u.title}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><RolePill role={u.role} /></td>
                    <td className="px-5 py-3.5"><StatusPill active={u.is_active !== false} /></td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-extrabold border border-blue-100 dark:border-blue-900">
                        {u.application_count}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => setEditUser(u)}
                          title="Edit user profile"
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-950/40 text-slate-500 hover:text-blue-600 transition-all"
                        >
                          <Edit3 size={15} />
                        </button>
                        {/* Role toggle */}
                        <button
                          onClick={() => handleRoleToggle(u)}
                          title={u.role === "admin" ? "Demote to user" : "Promote to admin"}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 transition-all"
                        >
                          <Shield size={15} />
                        </button>
                        {/* Suspend/reactivate */}
                        <button
                          onClick={() => handleSuspend(u)}
                          title={u.is_active !== false ? "Suspend account" : "Reactivate account"}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-500 hover:text-amber-600 transition-all"
                        >
                          <UserX size={15} />
                        </button>
                        {/* Reset password */}
                        <button
                          onClick={() => { setEditUser(u); }}
                          title="Reset password"
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 text-slate-500 hover:text-indigo-600 transition-all"
                        >
                          <KeyRound size={15} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(u)}
                          title="Delete user"
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Users size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                      <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        {q || roleFilter || statusFilter ? "No users match your filters." : "No users registered yet."}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!isLoading && total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total.toLocaleString()} users
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 px-2">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={!hasMore}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={(msg) => { showToast(msg); setEditUser(null); }}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDeleteAction}
          loading={deleteUser.isPending}
        />
      )}
    </div>
  );
}
