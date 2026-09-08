import { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserPlus,
  Save,
  SlidersHorizontal
} from "lucide-react";
import {
  usePromoteByEmail
} from "../../hooks/useAdmin";
import { authService } from "../../services/auth.service";

export default function AdminSettingsPage() {
  const promoteUserMutation = usePromoteByEmail();

  // Admin Profile State
  const [adminProfile, setAdminProfile] = useState({
    email: "",
    first_name: "",
    last_name: "",
    title: "",
  });

  // Promote user modal state
  const [promoteEmail, setPromoteEmail] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Load current Admin user profile
  useEffect(() => {
    async function loadAdminUser() {
      try {
        const user = await authService.me();
        if (user) {
          setAdminProfile({
            email: user.email || "",
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            title: user.title || "Platform Administrator",
          });
        }
      } catch (err) {
        console.error("Failed to load admin profile", err);
      }
    }
    loadAdminUser();
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSaveAdminProfile = async () => {
    try {
      setIsSavingProfile(true);
      await authService.updateProfile({
        email: adminProfile.email,
        first_name: adminProfile.first_name,
        last_name: adminProfile.last_name
      } as any);
      showToast("success", "Admin profile email and account details updated successfully!");
    } catch (err: any) {
      showToast("error", err?.message || "Failed to update admin profile details.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePromoteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteEmail.trim()) return;
    try {
      const updated = await promoteUserMutation.mutateAsync(promoteEmail.trim());
      showToast("success", `User ${updated.email} successfully promoted to Admin role!`);
      setPromoteEmail("");
    } catch (err: any) {
      showToast("error", err?.message || "Failed to promote user by email.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal size={24} className="text-rose-600 dark:text-rose-400" />
            <span>Admin Settings & Permissions</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage administrative account profile details and promote registered users to Admin role access.
          </p>
        </div>

        {/* Toast Notification Banner */}
        {toast && (
          <div
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold animate-fade-in shadow-xs ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toast.text}</span>
          </div>
        )}
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-8">
        {/* Admin Profile Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
              <UserCheck size={20} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin Profile & Contact Details</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primary administrative account credentials and display name.
              </p>
            </div>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Account Primary Email
                </label>
                <input
                  type="email"
                  value={adminProfile.email}
                  onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500 font-semibold transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={`${adminProfile.first_name} ${adminProfile.last_name}`.trim()}
                  onChange={(e) => {
                    const parts = e.target.value.split(" ");
                    setAdminProfile({
                      ...adminProfile,
                      first_name: parts[0] || "",
                      last_name: parts.slice(1).join(" ")
                    });
                  }}
                  placeholder="Admin Name"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={isSavingProfile}
                onClick={handleSaveAdminProfile}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-rose-500/20 transition-all disabled:opacity-50"
              >
                <Save size={15} />
                <span>{isSavingProfile ? "Saving..." : "Update Admin Details"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Role Promotion Section */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <UserPlus size={20} className="text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Promote User to Admin Role</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grant full platform administrative privileges to any registered user account by email address.
              </p>
            </div>
          </div>

          <form onSubmit={handlePromoteUser} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500 transition-all"
              />
              <button
                type="submit"
                disabled={promoteUserMutation.isPending || !promoteEmail.trim()}
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all disabled:opacity-50 shrink-0"
              >
                <UserPlus size={15} />
                <span>{promoteUserMutation.isPending ? "Promoting User..." : "Promote to Admin"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
          <ShieldCheck size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-900 dark:text-white font-semibold">Security Note:</strong> System mail server credentials and SMTP authentication configurations are managed server-side via environment variables (`.env`) to prevent credential leakage.
          </div>
        </div>
      </div>
    </div>
  );
}

