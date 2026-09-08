import { Link } from "react-router-dom";
import {
  Users, Briefcase, Building2, Mail, BarChart3,
  TrendingUp, Award, Activity, Target
} from "lucide-react";
import { useAdminAnalytics, useAdminUsers } from "../../hooks/useAdmin";

function MetricCard({
  label, value, icon, color = "blue", sub
}: {
  label: string; value: string | number; icon: React.ReactNode; color?: string; sub?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
    purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
    amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
    rose: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
    indigo: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400",
  };
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color] || colorMap.blue}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useAdminAnalytics();
  const { data: users } = useAdminUsers();

  const admins = (users ?? []).filter(u => u.role === "admin").length;
  const regularUsers = (users ?? []).filter(u => u.role === "user").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Platform Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time metrics across all users, applications, jobs, and career activity.
        </p>
      </div>

      {/* Primary Metrics */}
      {isLoading ? (
        <div className="text-sm text-slate-400">Loading platform analytics…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard
              label="Total Users"
              value={analytics?.total_users ?? 0}
              icon={<Users size={22} />}
              color="blue"
              sub={`${admins} admin · ${regularUsers} user`}
            />
            <MetricCard
              label="Total Applications"
              value={analytics?.total_applications ?? 0}
              icon={<BarChart3 size={22} />}
              color="purple"
            />
            <MetricCard
              label="Jobs Posted"
              value={analytics?.total_jobs ?? 0}
              icon={<Briefcase size={22} />}
              color="indigo"
            />
            <MetricCard
              label="Companies Tracked"
              value={analytics?.total_companies ?? 0}
              icon={<Building2 size={22} />}
              color="emerald"
            />
            <MetricCard
              label="Learning Courses"
              value={analytics?.total_courses ?? 0}
              icon={<Target size={22} />}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard
              label="Total Emails"
              value={analytics?.total_emails ?? 0}
              icon={<Mail size={22} />}
              color="rose"
            />
            <MetricCard
              label="Interviews"
              value={analytics?.total_interviews ?? 0}
              icon={<Activity size={22} />}
              color="indigo"
            />
            <MetricCard
              label="Offer Outcomes"
              value={analytics?.total_offers ?? 0}
              icon={<Award size={22} />}
              color="emerald"
            />
            <MetricCard
              label="Avg Match Score"
              value={`${analytics?.avg_match_score ?? 0}%`}
              icon={<TrendingUp size={22} />}
              color="blue"
            />
            <MetricCard
              label="Platform Offer Rate"
              value={`${analytics?.platform_offer_rate ?? 0}%`}
              icon={<TrendingUp size={22} />}
              color="amber"
              sub="Accepted / Total Applications"
            />
          </div>

          {/* Recent Users Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                Recent User Registrations
              </h2>
              <Link to="/admin/users" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Applications</th>
                    <th className="px-5 py-3 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(users ?? []).slice(0, 8).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">
                        {u.first_name} {u.last_name}
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          u.role === "admin"
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.application_count}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                  {(!users || users.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">
                        No users registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
