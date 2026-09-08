import { useState, useEffect } from "react";
import {
  User,
  Sliders,
  Sparkles,
  Bell,
  Shield,
  Database,
  Save,
  CheckCircle2,
  Lock,
  Sun,
  Moon,
  ExternalLink,
  RefreshCw,
  LogOut
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { authService } from "../../services/auth.service";
import { useNavigate } from "react-router-dom";

type TabKey = "profile" | "appearance" | "ai" | "notifications" | "security" | "data";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [profile, setProfile] = useState({
    email: "",
    first_name: "",
    last_name: "",
    title: "",
    phone: "",
    location: "",
    years_experience: 0,
    currency: "KES",
    salary_min: 0,
    salary_max: 0,
    availability: "Immediately",
    notice_period: "1 month",
    linkedin: "",
    github: "",
    website: "",
    summary: "",
    career_goal: ""
  });
  // Skills & open-to-work state (managed separately for UX then merged on save)
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [openTo, setOpenTo] = useState<string[]>(["Full-time", "Remote"]);

  // AI Preferences State
  const [aiTone, setAiTone] = useState(() => localStorage.getItem("denno_ai_tone") || "professional");
  const [aiModel, setAiModel] = useState(() => localStorage.getItem("denno_ai_model") || "Claude 3.5 Sonnet");
  const [aiAutoAnalyze, setAiAutoAnalyze] = useState(() => localStorage.getItem("denno_ai_auto_analyze") !== "false");
  const [atsThreshold, setAtsThreshold] = useState(() => parseInt(localStorage.getItem("denno_ats_threshold") || "80"));

  // Notification State
  const [notifications, setNotifications] = useState({
    jobs: true,
    deadlines: true,
    interviews: true,
    emails: true,
    learning: true,
    weekly_report: false,
  });

  // Security State
  const [passwords, setPasswords] = useState({ current: "", new_pass: "", confirm: "" });
  const [twoFactor, setTwoFactor] = useState(false);
  const [profilePublic, setProfilePublic] = useState(false);

  // Load real profile from backend on mount
  useEffect(() => {
    async function loadUserProfile() {
      try {
        setIsLoadingProfile(true);
        const user = await authService.me();
        if (user) {
          setProfile({
            email: user.email || "",
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            title: user.title || "",
            phone: user.phone || "",
            location: user.location || "",
            years_experience: user.years_experience || 0,
            currency: user.currency || "KES",
            salary_min: user.salary_min || 0,
            salary_max: user.salary_max || 0,
            availability: user.availability || "Immediately",
            notice_period: user.notice_period || "1 month",
            linkedin: user.linkedin || "",
            github: user.github || "",
            website: user.website || "",
            summary: user.summary || "",
            career_goal: user.career_goal || ""
          });
          if (Array.isArray(user.skills)) setSkills(user.skills);
          if (user.notifications) {
            setNotifications((prev) => ({ ...prev, ...user.notifications }));
          }
          if (typeof user.two_fa_enabled === "boolean") setTwoFactor(user.two_fa_enabled);
          if (typeof user.profile_public === "boolean") setProfilePublic(user.profile_public);
        }
      } catch (err) {
        console.error("Failed to load user profile", err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadUserProfile();
  }, []);

  const showSuccess = (msg: string) => {
    setErrorMessage("");
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(""), 4000);
  };

  const showError = (msg: string) => {
    setSavedMessage("");
    setErrorMessage(msg);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      // Merge skills and openTo into the profile patch
      await authService.updateProfile({ ...profile, skills, open_to: openTo } as any);
      showSuccess("Profile & Target settings saved to your database!");
    } catch (err: any) {
      showError(err?.message || "Failed to update profile settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAIPreferences = async () => {
    localStorage.setItem("denno_ai_tone", aiTone);
    localStorage.setItem("denno_ai_model", aiModel);
    localStorage.setItem("denno_ai_auto_analyze", String(aiAutoAnalyze));
    localStorage.setItem("denno_ats_threshold", String(atsThreshold));
    showSuccess("AI Assistant preferences saved successfully!");
  };

  const handleSaveNotifications = async () => {
    try {
      setIsSaving(true);
      await authService.updateProfile({ notifications } as any);
      showSuccess("Notification alert settings saved!");
    } catch (err: any) {
      showError(err?.message || "Failed to save notification settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    try {
      setIsSaving(true);
      await authService.updateProfile({ two_fa_enabled: twoFactor, profile_public: profilePublic } as any);
      showSuccess("Security & Privacy settings updated!");
    } catch (err: any) {
      showError(err?.message || "Failed to update security settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new_pass) {
      showError("Please provide both current and new password.");
      return;
    }
    if (passwords.new_pass !== passwords.confirm) {
      showError("New password and confirm password do not match.");
      return;
    }
    try {
      setIsSaving(true);
      await authService.changePassword(passwords.current, passwords.new_pass);
      setPasswords({ current: "", new_pass: "", confirm: "" });
      showSuccess("Password changed successfully!");
    } catch (err: any) {
      showError(err?.message || "Failed to change password. Ensure current password is correct.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    await authService.logout();
    navigate("/login");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Account Settings</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your career profile, AI assistant preferences, security, and app features.
          </p>
        </div>

        {savedMessage && (
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-sm font-semibold animate-fade-in shadow-xs">
            <CheckCircle2 size={16} />
            <span>{savedMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="inline-flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-sm font-semibold animate-fade-in shadow-xs">
            <Lock size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {isLoadingProfile ? (
        <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
          Syncing profile settings with database…
        </div>
      ) : (
        /* Main Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {[
            { id: "profile", label: "Profile & Targets", icon: User },
            { id: "appearance", label: "Appearance", icon: Sliders },
            { id: "ai", label: "AI Preferences", icon: Sparkles },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "security", label: "Security & Privacy", icon: Shield },
            { id: "data", label: "Data & Storage", icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
          {/* TAB 1: Profile & Targets */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                  <User size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile & Career Targets</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Used by Denno AI to match jobs, generate cover letters, and optimize your CV.
                  </p>
                </div>
              </div>

              {/* Personal Info Grid */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Personal Information &amp; Account Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Account Email Address</span>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        Primary Account &amp; Recruiter Contact Email
                      </span>
                    </label>
                    <input
                      type="email"
                      required
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                    <input
                      value={profile.first_name}
                      onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                      placeholder="e.g. Dennis"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                    <input
                      value={profile.last_name}
                      onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                      placeholder="e.g. Mwangi"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Professional Title</label>
                    <input
                      value={profile.title}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                      placeholder="e.g. Senior Full Stack Engineer"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Location</label>
                    <input
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      placeholder="e.g. Nairobi, Kenya"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                    <input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+254 712 345 678"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={profile.years_experience}
                      onChange={(e) => setProfile({ ...profile, years_experience: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Salary Targets */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Salary Targets</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                    <select
                      value={profile.currency}
                      onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="KES">KES (KES)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="ZAR">ZAR (R)</option>
                      <option value="NGN">NGN (₦)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Minimum Salary Target</label>
                    <input
                      type="number"
                      value={profile.salary_min}
                      onChange={(e) => setProfile({ ...profile, salary_min: parseInt(e.target.value) || 0 })}
                      placeholder="250000"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Maximum Salary Target</label>
                    <input
                      type="number"
                      value={profile.salary_max}
                      onChange={(e) => setProfile({ ...profile, salary_max: parseInt(e.target.value) || 0 })}
                      placeholder="450000"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Availability & Work Preferences */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Availability & Work Preferences</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Availability</label>
                    <select
                      value={profile.availability}
                      onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="Immediately">Immediately Available</option>
                      <option value="2 weeks">2 Weeks Notice</option>
                      <option value="1 month">1 Month Notice</option>
                      <option value="2 months">2 Months Notice</option>
                      <option value="3 months">3 Months Notice</option>
                      <option value="Negotiable">Negotiable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Notice Period</label>
                    <select
                      value={profile.notice_period}
                      onChange={(e) => setProfile({ ...profile, notice_period: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="No notice">No Notice Period</option>
                      <option value="1 week">1 Week</option>
                      <option value="2 weeks">2 Weeks</option>
                      <option value="1 month">1 Month</option>
                      <option value="2 months">2 Months</option>
                      <option value="3 months">3 Months</option>
                    </select>
                  </div>
                </div>

                {/* Open To Work Types */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Open To (Work Types)</label>
                  <div className="flex flex-wrap gap-2">
                    {["Full-time", "Part-time", "Contract", "Freelance", "Remote", "Hybrid", "On-site", "Internship"].map((wt) => {
                      const selected = openTo.includes(wt);
                      return (
                        <button
                          key={wt}
                          type="button"
                          onClick={() => setOpenTo(selected ? openTo.filter((x) => x !== wt) : [...openTo, wt])}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            selected
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                          }`}
                        >
                          {wt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Professional Links & Direct Integrations */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Connected Profiles &amp; Direct Integrations</p>
                  {profile.linkedin && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      LinkedIn Connected (Direct)
                    </span>
                  )}
                </div>

                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#0077b5] text-white flex items-center justify-center font-bold text-xs">in</span>
                      <span>LinkedIn Profile URL / Handle</span>
                    </label>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Direct Mode (No OAuth Required)</span>
                  </div>
                  <input
                    value={profile.linkedin}
                    onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                    placeholder="https://www.linkedin.com/in/username (e.g. https://linkedin.com/in/dennis-kibet)"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 font-semibold transition-all"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Works directly like your Gmail SMTP setting. Used for automated resume headers, email signatures, recruiter networking, and 1-click connection outreach without needing a LinkedIn Developer App key.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GitHub Profile</label>
                    <input
                      value={profile.github}
                      onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Portfolio Website</label>
                    <input
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yoursite.dev"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Skills Tag Manager */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Key Skills <span className="text-blue-600">({skills.length})</span></p>
                <div className="flex flex-wrap gap-2 min-h-[36px]">
                  {skills.map((sk) => (
                    <span key={sk} className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                      {sk}
                      <button type="button" onClick={() => setSkills(skills.filter((s) => s !== sk))} className="text-blue-400 hover:text-rose-500 transition-colors">×</button>
                    </span>
                  ))}
                  {skills.length === 0 && <span className="text-xs text-slate-400">No skills added yet.</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSkill.trim()) {
                        if (!skills.includes(newSkill.trim())) setSkills([...skills, newSkill.trim()]);
                        setNewSkill("");
                      }
                    }}
                    placeholder="Add skill (e.g. Python, Docker, AWS) and press Enter"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSkill.trim() && !skills.includes(newSkill.trim())) {
                        setSkills([...skills, newSkill.trim()]);
                        setNewSkill("");
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Bio & Career Goal */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Summary & Career Vision</p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Professional Summary <span className="text-slate-400 font-normal">(AI uses this for cover letters)</span></label>
                  <textarea
                    rows={3}
                    value={profile.summary}
                    onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                    placeholder="Senior Software Engineer with 5+ years building high-throughput microservices using Python, FastAPI, React, and PostgreSQL."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Career Goal <span className="text-slate-400 font-normal">(your 2-5 year vision)</span></label>
                  <textarea
                    rows={2}
                    value={profile.career_goal}
                    onChange={(e) => setProfile({ ...profile, career_goal: e.target.value })}
                    placeholder="Transition into a Principal Systems Architect role at a high-growth tech platform."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={isSaving}
                  onClick={handleSaveProfile}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-colors disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{isSaving ? "Saving to Database..." : "Save Profile & Targets"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Appearance */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appearance & Interface</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customize theme modes and visual density for optimal readability.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => theme !== "light" && toggleTheme()}
                  className={`cursor-pointer border p-5 rounded-2xl flex items-center justify-between transition-all ${
                    theme === "light"
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Sun size={22} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Light Mode</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">High contrast bright design</div>
                    </div>
                  </div>
                  {theme === "light" && <CheckCircle2 className="text-blue-600" size={20} />}
                </div>

                <div
                  onClick={() => theme !== "dark" && toggleTheme()}
                  className={`cursor-pointer border p-5 rounded-2xl flex items-center justify-between transition-all ${
                    theme === "dark"
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center">
                      <Moon size={22} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Sleek dark mode interface</div>
                    </div>
                  </div>
                  {theme === "dark" && <CheckCircle2 className="text-blue-600" size={20} />}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Font & Contrast</h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Enhanced Contrast Mode</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Enhance border lines and text sharp contrast</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI Preferences */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Assistant Preferences</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure Denno1 AI tone, model preferences, and automated suggestions.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary AI Model</label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    >
                      <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Recommended for Technical CVs)</option>
                      <option value="GPT-4o">GPT-4o (High Speed & Reasoning)</option>
                      <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Deep Context Window)</option>
                      <option value="Denno AI Engine">Denno AI Local Engine (Fast Offline Parsing)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Cover Letter Tone</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    >
                      <option value="professional">Professional & Direct</option>
                      <option value="executive">Executive & Strategic</option>
                      <option value="technical">Technical & In-depth</option>
                      <option value="creative">Creative & Engaging</option>
                      <option value="enthusiastic">Enthusiastic & High Energy</option>
                    </select>
                  </div>
                </div>

                {/* ATS Sensitivity Slider */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-900 dark:text-white">Target ATS Match Threshold %</span>
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm">{atsThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="65"
                    max="95"
                    step="5"
                    value={atsThreshold}
                    onChange={(e) => setAtsThreshold(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>65% (Basic Match)</span>
                    <span>80% (Recommended)</span>
                    <span>95% (Strict ATS)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Auto ATS Analysis on Application Save</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Automatically calculate ATS scores when saving new job applications</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiAutoAnalyze}
                    onChange={(e) => setAiAutoAnalyze(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200/60 dark:border-blue-800/60 flex items-start gap-3">
                  <Sparkles className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-bold text-blue-900 dark:text-blue-100">Secure Backend API Gateway</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                      All AI requests (Claude 3.5/4.6, Cover Letter, ATS Matching) are securely proxied through the backend server. API keys remain protected server-side.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveAIPreferences}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
                >
                  <Save size={16} />
                  <span>Save AI Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Alerts</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage in-app notifications and email alerts.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { key: "jobs", label: "Job Match Alerts", desc: "Notify when new jobs matching your skills are posted" },
                  { key: "deadlines", label: "Application Deadlines", desc: "Reminders 48h before saved application deadlines" },
                  { key: "interviews", label: "Interview Scheduled Alerts", desc: "Reminders 1h before scheduled technical interviews" },
                  { key: "emails", label: "Recruiter Email Notifications", desc: "Alerts when new recruiters send email responses" },
                  { key: "learning", label: "Learning Milestones", desc: "Progress updates and certificate completion alerts" },
                  { key: "weekly_report", label: "Weekly Career Summary", desc: "Weekly email report analyzing your application pipeline" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={(notifications as any)[item.key]}
                      onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  disabled={isSaving}
                  onClick={handleSaveNotifications}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{isSaving ? "Saving..." : "Save Notifications"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: Security & Privacy */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & Account Privacy</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update password, configure 2FA, and manage active authentication sessions.
                </p>
              </div>

              {/* Password Change */}
              <form onSubmit={handleChangePassword} className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock size={16} className="text-blue-600" /> Change Password
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwords.new_pass}
                      onChange={(e) => setPasswords({ ...passwords, new_pass: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSaving || !passwords.current || !passwords.new_pass}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Lock size={14} />
                    <span>{isSaving ? "Updating..." : "Update Password"}</span>
                  </button>
                </div>
              </form>

              {/* Toggles */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security using TOTP authenticator app</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={(e) => setTwoFactor(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Public Profile Visibility</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Allow verified tech recruiters to view your skills summary</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={profilePublic}
                    onChange={(e) => setProfilePublic(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    disabled={isSaving}
                    onClick={handleSaveSecurity}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{isSaving ? "Saving..." : "Save Security Preferences"}</span>
                  </button>
                </div>
              </div>

              {/* Logout Sessions */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Active Authentication Sessions</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Revoke token blacklists across all devices</div>
                </div>
                <button
                  onClick={handleLogoutAll}
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-xs"
                >
                  <LogOut size={16} />
                  <span>Log Out All Devices</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: Data & Storage */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Management & Portability</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Export career records in JSON/CSV or clear local browser cache.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Database size={18} className="text-blue-600" />
                      <span>Data Export / Import Suite</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Full backup of applications, notes, goals, and learning progress.
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/data")}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors w-fit shadow-xs"
                  >
                    <span>Open Data Transfer Tool</span>
                    <ExternalLink size={15} />
                  </button>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <RefreshCw size={18} className="text-amber-600" />
                      <span>Clear Local Browser Cache</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Resets local storage cached queries and forces fresh API synchronization.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      showSuccess("Local cache cleared!");
                    }}
                    className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors w-fit shadow-xs"
                  >
                    <span>Clear Cache</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
