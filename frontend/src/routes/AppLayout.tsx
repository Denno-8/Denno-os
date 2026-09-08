import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Briefcase,
  Building2,
  Radio,
  ClipboardList,
  Mail,
  Mic,
  Users,
  Calendar as CalendarIcon,
  FileText,
  Sparkles,
  GraduationCap,
  BookOpen,
  Target,
  RefreshCw,
  Search,
  Bell,
  User,
  Sun,
  Moon,
  LogOut,
  Settings as SettingsIcon,
  BarChart3,
  PenLine,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";

import { authService } from "../services/auth.service";
import Denno1Widget from "../components/Denno1Widget";
import NotificationDrawer from "../components/NotificationDrawer";
import { useUnreadNotificationsCount } from "../hooks/useNotifications";
import { useTheme } from "../context/ThemeContext";
import { useIsAdmin } from "../hooks/useCurrentUser";
import KeyboardShortcutsModal from "../components/KeyboardShortcutsModal";

/* ─── Navigation structure ─── */
const SECTIONS = [
  {
    label: "JOBS",
    links: [
      { to: "/jobs",        label: "Job Feed",       icon: Briefcase },
      { to: "/companies",   label: "Companies",      icon: Building2 },
      { to: "/job-sources", label: "Source Monitor", icon: Radio },
    ],
  },
  {
    label: "APPLICATIONS",
    links: [
      { to: "/applications", label: "Applications", icon: ClipboardList },
      { to: "/emails",       label: "Emails",       icon: Mail },
      { to: "/interviews",   label: "Interviews",   icon: Mic },
      { to: "/recruiters",   label: "Networking",   icon: Users },
      { to: "/calendar",     label: "Calendar",     icon: CalendarIcon },
    ],
  },
  {
    label: "CAREER",
    links: [
      { to: "/cv",           label: "CV Manager",     icon: FileText },
      { to: "/cv-generator", label: "CV Generator",   icon: PenLine },
      { to: "/cover-letter", label: "Cover Letter AI", icon: Sparkles },
      { to: "/learning",     label: "Learning",        icon: GraduationCap },
      { to: "/notes",        label: "Knowledge Base",  icon: BookOpen },
      { to: "/goals",        label: "Goals",           icon: Target },
    ],
  },
  {
    label: "SYSTEM",
    links: [
      { to: "/data",     label: "Export / Import", icon: RefreshCw },
      { to: "/settings", label: "Settings",        icon: SettingsIcon },
    ],
  },
];

const ADMIN_SECTION = {
  label: "ADMIN",
  links: [
    { to: "/admin",           label: "Overview",       icon: BarChart3 },
    { to: "/admin/users",     label: "All Users",      icon: Users },
    { to: "/admin/jobs",      label: "Manage Jobs",    icon: Briefcase },
    { to: "/admin/companies", label: "Manage Cos",     icon: Building2 },
    { to: "/admin/courses",   label: "Manage Courses", icon: GraduationCap },
    { to: "/admin/settings",  label: "Admin Settings", icon: SettingsIcon },
  ],
};

const PAGE_TITLES: Record<string, string> = {
  "/applications":    "Applications",
  "/jobs":            "Job Feed",
  "/companies":       "Companies",
  "/job-sources":     "Source Monitor",
  "/emails":          "Emails",
  "/interviews":      "Interviews",
  "/recruiters":      "Networking",
  "/calendar":        "Calendar",
  "/cv":              "CV Manager",
  "/cv-generator":    "CV Generator",
  "/cover-letter":    "Cover Letter AI",
  "/learning":        "Learning",
  "/notes":           "Knowledge Base",
  "/goals":           "Goals",
  "/data":            "Export / Import",
  "/settings":        "Account Settings",
  "/admin":           "Platform Overview",
  "/admin/users":     "All Users",
  "/admin/jobs":      "Manage Jobs",
  "/admin/companies": "Manage Companies",
  "/admin/settings":  "Admin Settings & Email Setup",
};


export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const { data: unreadData } = useUnreadNotificationsCount();
  const unreadCount = unreadData?.count ?? 0;
  const isAdmin = useIsAdmin();

  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth < 900;
    setIsMobile(mobile);
    if (!mobile) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [checkMobile]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "?") { e.preventDefault(); setShortcutsOpen((p) => !p); }
      if (e.key === "Escape") { setSidebarOpen(false); setSearchExpanded(false); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const allSections = isAdmin ? [...SECTIONS, ADMIN_SECTION] : SECTIONS;
  const pageTitle = PAGE_TITLES[location.pathname] ?? "Denno";

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={styles.logoWrap}>
        <div style={styles.logoGem}>D</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...styles.logoName, color: "var(--text-primary)" }}>Denno</div>
          <div style={styles.logoVersion}>Career OS · v1</div>
        </div>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 4, borderRadius: 8, display: "flex", alignItems: "center" }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        {allSections.map((section) => (
          <div key={section.label} style={{
            ...styles.section,
            ...(section.label === "ADMIN" ? { borderTop: "1px solid var(--border-color)", paddingTop: 8, marginTop: 6 } : {}),
          }}>
            <div style={{
              ...styles.sectionLabel,
              ...(section.label === "ADMIN" ? { color: "#e11d48" } : {}),
            }}>{section.label}</div>
            {section.links.map((link) => {
              const IconComponent = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  style={{
                    ...styles.navLink,
                    color: isActive ? "#2563eb" : "var(--text-primary)",
                    fontWeight: isActive ? 800 : 600,
                    backgroundColor: isActive
                      ? (theme === "light" ? "rgba(37,99,235,0.12)" : "rgba(59,130,246,0.18)")
                      : "transparent",
                  }}
                >
                  <IconComponent size={18} style={styles.navIcon} />
                  <span style={styles.navLinkLabel}>{link.label}</span>
                  {isActive && <span style={styles.activeBar} />}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <button
        onClick={async () => { await authService.logout(); navigate("/login"); }}
        style={{
          ...styles.signOutBtn,
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
        }}
      >
        <LogOut size={16} />
        <span>Sign out</span>
      </button>
    </>
  );

  return (
    <div style={{ ...styles.shell, backgroundColor: "var(--bg-app)" }}>

      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={styles.backdrop}
          aria-hidden="true"
        />
      )}

      {/* ════════ SIDEBAR ════════ */}
      <aside style={{
        ...styles.sidebar,
        backgroundColor: "var(--bg-sidebar)",
        borderColor: "var(--border-color)",
        ...(isMobile ? {
          position: "fixed",
          left: sidebarOpen ? 0 : -260,
          top: 0,
          bottom: 0,
          zIndex: 200,
          transition: "left 0.28s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: sidebarOpen ? "4px 0 32px rgba(0,0,0,0.45)" : "none",
        } : {
          position: "sticky",
          top: 0,
        }),
      }}>
        {sidebarContent}
      </aside>

      {/* ════════ MAIN AREA ════════ */}
      <div style={styles.mainArea}>

        {/* Header */}
        <header style={{ ...styles.header, backgroundColor: "var(--bg-header)", borderColor: "var(--border-color)" }}>
          <div style={styles.headerLeft}>
            {/* Hamburger – mobile only */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen((p) => !p)}
                style={{ ...styles.iconBtn, backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
            )}

            {/* Back button – desktop only */}
            {!isMobile && (
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 10,
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--input-bg)", color: "var(--text-primary)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s ease", whiteSpace: "nowrap" as const,
                }}
                title="Go Back"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            )}

            <h1 style={{
              ...styles.pageTitle,
              color: "var(--text-primary)",
              fontSize: isMobile ? 16 : 20,
            }}>
              {pageTitle}
            </h1>
          </div>

          <div style={styles.headerRight}>
            {/* Search bar (desktop) / icon toggle (mobile) */}
            {!isMobile ? (
              <div style={{ ...styles.searchWrap, backgroundColor: "var(--input-bg)", borderColor: "var(--input-border)" }}>
                <Search size={16} style={{ color: "var(--text-primary)", flexShrink: 0 }} />
                <input
                  id="denno-global-search"
                  name="denno-global-search"
                  autoComplete="off"
                  style={{ ...styles.searchInput, color: "var(--text-primary)" }}
                  placeholder="Search anything…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            ) : searchExpanded ? (
              <div style={{ ...styles.searchWrap, backgroundColor: "var(--input-bg)", borderColor: "var(--input-border)", width: 170 }}>
                <Search size={14} style={{ color: "var(--text-primary)", flexShrink: 0 }} />
                <input
                  id="denno-global-search-mobile"
                  name="denno-global-search-mobile"
                  autoComplete="off"
                  autoFocus
                  style={{ ...styles.searchInput, color: "var(--text-primary)", fontSize: 13 }}
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => { if (!search) setSearchExpanded(false); }}
                />
                <button onClick={() => { setSearch(""); setSearchExpanded(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 0, display: "flex" }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchExpanded(true)}
                style={{ ...styles.iconBtn, backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                aria-label="Search"
              >
                <Search size={18} />
              </button>
            )}

            {/* Theme toggle */}
            <button
              style={{ ...styles.iconBtn, backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              title={theme === "dark" ? "Light Mode" : "Dark Mode"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>

            {/* Notifications */}
            <button
              style={{ ...styles.iconBtn, backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              title="Notifications"
              onClick={() => setNotifOpen(true)}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span style={styles.notifBadge}>{unreadCount}</span>}
            </button>

            {/* User avatar */}
            <div style={styles.userBadge} title="Your account">
              <User size={18} style={{ color: "#2563eb" }} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{
          ...styles.content,
          backgroundColor: "var(--bg-content)",
          padding: isMobile ? "14px" : "28px",
        }}>
          <Outlet />
        </main>
      </div>

      {/* Floating widgets */}
      <Denno1Widget />
      <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <style>{`
        * { box-sizing: border-box; }
        a { text-decoration: none; }
        .nav-link-hover:hover { background: var(--bg-hover) !important; }

        /* ── Responsive grid helpers for page components ── */
        @media (max-width: 600px) {
          .denno-stat-grid  { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .denno-card-grid  { grid-template-columns: 1fr !important; }
          .denno-hide-sm    { display: none !important; }
          .denno-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
        @media (min-width: 601px) and (max-width: 900px) {
          .denno-stat-grid  { grid-template-columns: repeat(3, 1fr) !important; }
          .denno-card-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .denno-table-wrap { overflow-x: auto; }
        }
        @media (min-width: 901px) and (max-width: 1280px) {
          .denno-stat-grid  { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Styles ─── */
const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    transition: "background-color 0.2s ease",
  },

  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 199,
    backdropFilter: "blur(2px)",
  },

  sidebar: {
    width: 236,
    flexShrink: 0,
    borderRight: "1px solid",
    display: "flex",
    flexDirection: "column",
    padding: "20px 14px 16px",
    overflowY: "auto",
    height: "100vh",
    transition: "background-color 0.2s ease, border-color 0.2s ease",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 26,
    paddingLeft: 4,
  },
  logoGem: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 18,
    color: "#fff",
    boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
    flexShrink: 0,
  },
  logoName: { fontSize: 16, fontWeight: 900, lineHeight: 1.2 },
  logoVersion: {
    fontSize: 11,
    color: "var(--text-secondary)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  nav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    overflowY: "auto",
  },
  section: { marginBottom: 6 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "var(--text-secondary)",
    letterSpacing: "0.1em",
    padding: "6px 10px 4px",
    textTransform: "uppercase" as const,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 11,
    fontSize: 14,
    fontWeight: 600,
    transition: "background 0.15s, color 0.15s",
    position: "relative" as const,
    cursor: "pointer",
  },
  navIcon: { flexShrink: 0 },
  navLinkLabel: { flex: 1 },
  activeBar: {
    position: "absolute" as const,
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: 3.5,
    height: 20,
    borderRadius: 99,
    background: "#2563eb",
    boxShadow: "0 0 8px rgba(37,99,235,0.8)",
  },
  signOutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "10px 12px",
    borderRadius: 11,
    border: "1px solid",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    marginTop: 12,
    fontFamily: "inherit",
    transition: "color 0.2s, background 0.2s",
  },

  mainArea: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },

  header: {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    borderBottom: "1px solid",
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(8px)",
    transition: "background-color 0.2s ease, border-color 0.2s ease",
    gap: 8,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    flex: 1,
  },
  pageTitle: {
    fontWeight: 900,
    margin: 0,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid",
    borderRadius: 11,
    padding: "7px 14px",
    width: 240,
  },
  searchInput: {
    background: "none",
    border: "none",
    outline: "none",
    fontSize: 14,
    fontWeight: 600,
    width: "100%",
    fontFamily: "inherit",
  },
  iconBtn: {
    position: "relative" as const,
    border: "1px solid",
    borderRadius: 11,
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.2s",
  },
  notifBadge: {
    position: "absolute" as const,
    top: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#ef4444",
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  userBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    background: "rgba(37,99,235,0.15)",
    border: "1px solid rgba(37,99,235,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },

  content: {
    flex: 1,
    overflowY: "auto",
    transition: "background-color 0.2s ease",
  },
};
