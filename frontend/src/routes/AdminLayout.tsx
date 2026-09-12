import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  Settings,
  Shield,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  Radio,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { authService } from "../services/auth.service";

const ADMIN_LINKS = [
  { to: "/admin",          label: "Dashboard",  icon: LayoutDashboard, exact: true },
  { to: "/admin/scrapers", label: "Scrapers",   icon: Radio },
  { to: "/admin/users",    label: "Users",      icon: Users },
  { to: "/admin/jobs",     label: "Jobs",       icon: Briefcase },
  { to: "/admin/companies",label: "Companies",  icon: Building2 },
  { to: "/admin/settings", label: "Settings",   icon: Settings },
];

export default function AdminLayout() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const getPageTitle = () => {
    if (location.pathname === "/admin") return "Dashboard";
    if (location.pathname.startsWith("/admin/scrapers")) return "Scraper Engine Monitor";
    if (location.pathname.startsWith("/admin/users")) return "User Management";
    if (location.pathname.startsWith("/admin/jobs")) return "Job Management";
    if (location.pathname.startsWith("/admin/companies")) return "Company Management";
    if (location.pathname.startsWith("/admin/settings")) return "Platform Settings";
    return "Admin Panel";
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col bg-slate-900 dark:bg-slate-950 border-r border-slate-800">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white">
              <Shield size={18} />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white tracking-tight">Admin Panel</div>
              <div className="text-[10px] text-slate-400 font-medium">Denno Platform Control</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? location.pathname === link.to
              : location.pathname.startsWith(link.to) && link.to !== "/admin";
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive: navActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    (link.exact ? location.pathname === link.to : navActive)
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`
                }
              >
                <Icon size={17} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Admin</span>
            <ChevronRight size={12} />
            <span className="text-slate-900 dark:text-white font-semibold">{getPageTitle()}</span>
          </div>
          <div className="flex-1" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-800/60 text-xs font-bold text-rose-700 dark:text-rose-300">
            <Shield size={13} />
            <span>Admin Access</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
