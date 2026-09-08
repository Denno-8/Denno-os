import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target, Bot, BarChart3, Bell, User, Mail, Lock,
  KeyRound, AlertTriangle, CheckCircle2, ArrowRight,
  Sun, Moon, X, Shield, FileText, Sparkles,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { authService } from "../../services/auth.service";
import { ApiError } from "../../services/api";

type Mode = "login" | "register" | "forgot" | "reset";

/* ── Password strength ── */
function PasswordStrength({ password }: { password: string }) {
  const score = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const labels = ["", "Weak", "Fair", "Strong", "Very Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
  if (!password) return null;
  return (
    <div style={{ marginTop: "6px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= score ? colors[score] : "rgba(148,163,184,0.2)", transition: "background 0.3s" }} />
        ))}
      </div>
      <span style={{ fontSize: "11px", fontWeight: 700, color: colors[score] }}>{labels[score]}</span>
    </div>
  );
}

/* ── Eye icon ── */
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

/* ── Google Icon ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

/* ── LinkedIn Icon ── */
function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

const FEATURES = [
  { icon: Target,   title: "13-Stage Pipeline",         desc: "Track every application from Saved to Accepted.",        iconColor: "#60a5fa", bg: "rgba(37,99,235,0.09)",    border: "rgba(59,130,246,0.25)"  },
  { icon: Bot,      title: "AI Career Assistant",        desc: "Drafts cover letters and preps your interviews.",        iconColor: "#a78bfa", bg: "rgba(139,92,246,0.09)",   border: "rgba(139,92,246,0.25)" },
  { icon: BarChart3,title: "Real-time Analytics",        desc: "CV match scores, skill gaps, pipeline conversion.",      iconColor: "#34d399", bg: "rgba(16,185,129,0.07)",   border: "rgba(16,185,129,0.25)" },
  { icon: Bell,     title: "Live Notifications",         desc: "LinkedIn job imports and email response tracking.",      iconColor: "#fbbf24", bg: "rgba(245,158,11,0.07)",   border: "rgba(245,158,11,0.25)" },
];

const FONT = "'Plus Jakarta Sans', Inter, ui-sans-serif, system-serif";

export default function LoginPage() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const [mode, setMode] = useState<Mode>("login");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | null>(null);

  const checkMobile = useCallback(() => setIsMobile(window.innerWidth < 768), []);
  useEffect(() => { window.addEventListener("resize", checkMobile); return () => window.removeEventListener("resize", checkMobile); }, [checkMobile]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const switchMode = (m: Mode) => { setMode(m); setError(null); setInfo(null); };

  const handleApiError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) {
      const d = (err.body as any)?.detail;
      if (err.status === 401) setError("Invalid email or password. Please try again.");
      else if (err.status === 409) setError("An account with this email already exists. Try signing in.");
      else if (err.status === 422) setError("Please check your inputs — some fields are invalid.");
      else setError(typeof d === "string" ? d : fallback);
    } else {
      setError("Cannot connect to the server. Please ensure the backend is running on port 8000.");
    }
  };

  const submit = async () => {
    setError(null); setInfo(null); setLoading(true);
    try {
      if (mode === "login")    { await authService.login(email, password); navigate("/applications"); }
      else if (mode === "register") { await authService.register(email, password, firstName, lastName); navigate("/applications"); }
      else if (mode === "forgot")   { const r = await authService.requestPasswordReset(email); setInfo(r.message); }
      else if (mode === "reset")    { const r = await authService.resetPassword(resetToken, newPassword); setInfo(r.message); switchMode("login"); }
    } catch (e) { handleApiError(e, "Something went wrong. Check your details."); }
    finally { setLoading(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") submit(); };

  const disabled =
    loading ||
    (mode === "login"     && (!email || !password)) ||
    (mode === "register"  && (!email || !password || !firstName || !lastName)) ||
    (mode === "forgot"    && !email) ||
    (mode === "reset"     && (!resetToken || !newPassword));

  /* ── Shared input style ── */
  const inputStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: "100%", boxSizing: "border-box",
    padding: "11px 14px 11px 40px",
    borderRadius: "12px",
    border: `1.5px solid ${dark ? "rgba(255,255,255,0.15)" : "#cbd5e1"}`,
    background: dark ? "rgba(255,255,255,0.05)" : "#ffffff",
    color: dark ? "#f8fafc" : "#0f172a",
    fontFamily: FONT, fontSize: "14.5px", fontWeight: 600,
    outline: "none", transition: "all 0.2s",
    boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
    ...extra,
  });

  const iconStyle: React.CSSProperties = {
    position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)",
    color: dark ? "#94a3b8" : "#475569", pointerEvents: "none",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", fontFamily: FONT, overflow: "hidden",
      position: "relative",
      background: dark
        ? "#030712"
        : "#0f172a",
    }}>
      {/* ── Realistic Full Page Background Image Cover ── */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url('/auth-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: dark ? "brightness(0.32) contrast(1.15) saturate(1.1)" : "brightness(0.45) contrast(1.1)",
        transform: "scale(1.03)",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: dark
          ? "radial-gradient(circle at center, rgba(15,23,42,0.4) 0%, rgba(3,7,18,0.85) 100%)"
          : "radial-gradient(circle at center, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.88) 100%)",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Ambient orbs */}
      <div style={{ position:"absolute", top:"-100px", left:"-100px", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,0.2) 0%,transparent 70%)", filter:"blur(50px)", pointerEvents:"none", zIndex: 2 }} />
      <div style={{ position:"absolute", bottom:"-100px", right:"-100px", width:"400px", height:"400px", borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.18) 0%,transparent 70%)", filter:"blur(50px)", pointerEvents:"none", zIndex: 2 }} />

      {/* Theme toggle */}
      <button id="theme-toggle-btn" onClick={toggleTheme} style={{
        position:"fixed", top:"14px", right:"18px", zIndex:50,
        display:"flex", alignItems:"center", gap:"7px",
        padding:"7px 14px", borderRadius:"10px", cursor:"pointer",
        fontFamily:FONT, fontSize:"13px", fontWeight:700,
        background: dark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.95)",
        border:`1px solid ${dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
        color: dark ? "#e2e8f0" : "#334155",
        backdropFilter:"blur(12px)", boxShadow:"0 4px 20px rgba(0,0,0,0.25)",
        transition:"all 0.2s",
      }}>
        {dark ? <Sun size={13} style={{color:"#fbbf24"}} /> : <Moon size={13} style={{color:"#6366f1"}} />}
        {dark ? "Light" : "Dark"}
      </button>

      {/* ── MAIN CARD ── */}
      <div style={{
        width:"100%", maxWidth: isMobile ? "440px" : "1040px",
        maxHeight: "calc(100vh - 32px)",
        borderRadius:"24px", overflow:"hidden",
        border:`1px solid ${dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.2)"}`,
        boxShadow: "0 32px 80px rgba(0,0,0,0.65), 0 0 40px rgba(59,130,246,0.15)",
        backdropFilter: "blur(20px)",
        display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 460px",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition:"all 0.55s cubic-bezier(0.16,1,0.3,1)",
        position:"relative", zIndex:10,
      }}>

        {/* ─── LEFT PANEL ─── */}
        {!isMobile && (
          <div style={{
            padding:"36px 40px",
            display:"flex", flexDirection:"column", justifyContent:"space-between",
            position:"relative", overflow:"hidden",
            borderRight:"1px solid rgba(255,255,255,0.1)",
            overflowY:"auto",
          }}>
            {/* Embedded Cover Image inside Left Panel */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "url('/auth-bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.42) contrast(1.15)",
              transform: "scale(1.02)",
              zIndex: 0,
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, rgba(8,12,24,0.72) 0%, rgba(8,12,24,0.92) 100%)",
              zIndex: 1,
            }} />
            {/* Grid texture */}
            <div style={{ position:"absolute", inset:0, opacity:0.03, backgroundImage:"linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize:"44px 44px", pointerEvents:"none", zIndex: 1 }} />
            {/* Glow */}
            <div style={{ position:"absolute", top:"-60px", right:"-60px", width:"300px", height:"300px", borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,0.25) 0%,transparent 65%)", filter:"blur(36px)", pointerEvents:"none", zIndex: 1 }} />

            <div style={{ position:"relative", zIndex: 2 }}>
              {/* Logo */}
              <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"24px" }}>
                <div style={{ width:"46px", height:"46px", borderRadius:"14px", background:"linear-gradient(135deg,#2563eb,#1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"22px", fontWeight:900, boxShadow:"0 6px 20px rgba(37,99,235,0.35)", border:"1px solid rgba(255,255,255,0.12)", flexShrink:0 }}>D</div>
                <div>
                  <div style={{ fontSize:"19px", fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>Denno</div>
                  <div style={{ fontSize:"10px", fontWeight:700, color:"#60a5fa", textTransform:"uppercase", letterSpacing:"0.18em", marginTop:"1px" }}>Career Intelligence OS</div>
                </div>
              </div>

              {/* AI badge */}
              <div style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"5px 12px", borderRadius:"100px", border:"1px solid rgba(96,165,250,0.3)", background:"rgba(96,165,250,0.08)", marginBottom:"16px" }}>
                <Sparkles size={11} style={{color:"#60a5fa"}} />
                <span style={{ fontSize:"10px", fontWeight:700, color:"#93c5fd", textTransform:"uppercase", letterSpacing:"0.12em" }}>Powered by AI</span>
              </div>

              {/* Headline */}
              <h1 style={{ fontSize:"28px", fontWeight:800, color:"#fff", lineHeight:1.2, letterSpacing:"-0.025em", marginBottom:"10px" }}>
                Your gateway to{" "}
                <span style={{ background:"linear-gradient(90deg,#60a5fa,#a78bfa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>smarter</span>{" "}
                career automation.
              </h1>
              <p style={{ fontSize:"13.5px", color:"#94a3b8", lineHeight:1.65, fontWeight:400, maxWidth:"340px", marginBottom:"20px" }}>
                Streamline applications, generate ATS-optimised CVs, track interviews, and accelerate your career.
              </p>

              {/* Stats */}
              <div style={{ display:"flex", gap:"24px", marginBottom:"20px" }}>
                {[{v:"13",l:"Pipeline Stages"},{v:"AI",l:"Powered"},{v:"∞",l:"Applications"}].map(s => (
                  <div key={s.l} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"26px", fontWeight:900, color:"#fff", letterSpacing:"-0.02em" }}>{s.v}</div>
                    <div style={{ fontSize:"10px", color:"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginTop:"1px" }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Feature cards */}
              <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
                {FEATURES.map(f => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"11px 14px", borderRadius:"13px", border:`1px solid ${f.border}`, background:f.bg }}>
                      <div style={{ width:"30px", height:"30px", borderRadius:"9px", background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Icon size={15} style={{color:f.iconColor}} />
                      </div>
                      <div>
                        <div style={{ fontSize:"13px", fontWeight:700, color:"#fff", marginBottom:"2px", lineHeight:1.2 }}>{f.title}</div>
                        <div style={{ fontSize:"12px", color:"#94a3b8", lineHeight:1.5, fontWeight:400 }}>{f.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ position:"relative", zIndex:2, paddingTop:"16px", borderTop:"1px solid rgba(255,255,255,0.08)", fontSize:"12px", color:"#94a3b8", fontWeight:500, marginTop:"16px" }}>
              © {new Date().getFullYear()} Denno Career Platform · All rights reserved.
            </div>
          </div>
        )}

        {/* ─── RIGHT PANEL ─── */}
        <div style={{
          padding: isMobile ? "28px 24px" : "32px 36px",
          background: dark ? "#0d1117" : "#ffffff",
          display:"flex", flexDirection:"column",
          overflowY:"auto",
        }}>
          {/* Mobile logo */}
          {isMobile && (
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"20px" }}>
              <div style={{ width:"38px", height:"38px", borderRadius:"11px", background:"linear-gradient(135deg,#2563eb,#1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"18px", fontWeight:900 }}>D</div>
              <div>
                <div style={{ fontSize:"16px", fontWeight:800, color: dark ? "#fff" : "#0f172a" }}>Denno</div>
                <div style={{ fontSize:"10px", fontWeight:700, color:"#3b82f6", textTransform:"uppercase", letterSpacing:"0.15em" }}>Career OS</div>
              </div>
            </div>
          )}

          {/* Mode tabs */}
          {(mode === "login" || mode === "register") && (
            <div style={{ display:"flex", gap:"3px", padding:"4px", borderRadius:"14px", background: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9", border:`1px solid ${dark ? "rgba(255,255,255,0.12)" : "#cbd5e1"}`, marginBottom:"20px" }}>
              {(["login","register"] as Mode[]).map(m => (
                <button key={m} id={`tab-${m}`} onClick={() => switchMode(m)} style={{
                  flex:1, padding:"10px 0", borderRadius:"11px",
                  fontFamily:FONT, fontSize:"14px", fontWeight:700, cursor:"pointer", border:"none",
                  background: mode === m ? "#2563eb" : "transparent",
                  color: mode === m ? "#fff" : dark ? "#cbd5e1" : "#475569",
                  boxShadow: mode === m ? "0 4px 14px rgba(37,99,235,0.32)" : "none",
                  transition:"all 0.2s",
                }}>
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {/* Back link */}
          {(mode === "forgot" || mode === "reset") && (
            <button onClick={() => switchMode("login")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:FONT, fontSize:"13.5px", fontWeight:700, color: dark ? "#cbd5e1" : "#334155", marginBottom:"16px", display:"flex", alignItems:"center", gap:"5px" }}>
              ← Back to Sign In
            </button>
          )}

          {/* Title */}
          <div style={{ marginBottom:"18px" }}>
            <h2 style={{ fontSize:"26px", fontWeight:800, color: dark ? "#fff" : "#0f172a", letterSpacing:"-0.022em", marginBottom:"6px", lineHeight:1.2 }}>
              {mode === "login"    && "Welcome back 👋"}
              {mode === "register" && "Join Denno"}
              {mode === "forgot"   && "Reset Password"}
              {mode === "reset"    && "Set New Password"}
            </h2>
            <p style={{ fontSize:"14px", color: dark ? "#cbd5e1" : "#475569", fontWeight:600, lineHeight:1.5, margin:0 }}>
              {mode === "login"    && "Sign in to your career intelligence dashboard."}
              {mode === "register" && "Create your account and start automating your job search."}
              {mode === "forgot"   && "We'll send a reset link to your email address."}
              {mode === "reset"    && "Enter your reset token and choose a secure new password."}
            </p>
          </div>

          {/* OAuth Buttons */}
          {(mode === "login" || mode === "register") && (
            <div style={{ marginBottom:"16px" }}>
              {/* Google */}
              <button id="btn-google-oauth"
                onClick={() => { window.location.href = "http://localhost:8000/api/v1/auth/google/login"; }}
                style={{ width:"100%", padding:"12px 16px", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", fontFamily:FONT, fontSize:"14.5px", fontWeight:700, cursor:"pointer", border:`1.5px solid ${dark ? "rgba(255,255,255,0.15)" : "#cbd5e1"}`, background: dark ? "rgba(255,255,255,0.04)" : "#fff", color: dark ? "#f8fafc" : "#1e293b", marginBottom:"10px", transition:"all 0.2s", boxShadow: dark ? "none" : "0 1px 4px rgba(0,0,0,0.06)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#3b82f6"; e.currentTarget.style.background = dark ? "rgba(59,130,246,0.08)" : "#f8faff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? "rgba(255,255,255,0.15)" : "#cbd5e1"; e.currentTarget.style.background = dark ? "rgba(255,255,255,0.04)" : "#fff"; }}
              >
                <GoogleIcon /><span>Continue with Google</span>
              </button>

              {/* LinkedIn */}
              <button id="btn-linkedin-oauth"
                onClick={() => { window.location.href = "http://localhost:8000/api/v1/auth/linkedin/login"; }}
                style={{ width:"100%", padding:"12px 16px", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", fontFamily:FONT, fontSize:"14.5px", fontWeight:700, cursor:"pointer", border:"none", background:"linear-gradient(135deg,#0077b5,#005885)", color:"#fff", marginBottom:"16px", boxShadow:"0 4px 16px rgba(0,119,181,0.28)", transition:"all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,119,181,0.38)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 16px rgba(0,119,181,0.28)"; }}
              >
                <LinkedInIcon /><span>Continue with LinkedIn</span>
              </button>

              {/* Divider */}
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ flex:1, height:"1px", background: dark ? "rgba(255,255,255,0.12)" : "#cbd5e1" }} />
                <span style={{ fontSize:"11.5px", fontWeight:800, color: dark ? "#94a3b8" : "#475569", textTransform:"uppercase", letterSpacing:"0.12em", whiteSpace:"nowrap" }}>or continue with email</span>
                <div style={{ flex:1, height:"1px", background: dark ? "rgba(255,255,255,0.12)" : "#cbd5e1" }} />
              </div>
            </div>
          )}

          {/* ── Form fields ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"11px", marginTop: (mode === "login" || mode === "register") ? "10px" : "0" }}>

            {/* Name row (register) */}
            {mode === "register" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                {([["input-first-name","First name",firstName,setFirstName,"given-name"],["input-last-name","Last name",lastName,setLastName,"family-name"]] as [string,string,string,(v:string)=>void,string][]).map(([id,ph,val,set,ac]) => (
                  <div key={id} style={{ position:"relative" }}>
                    <User size={16} style={iconStyle} />
                    <input id={id} placeholder={ph} value={val} onChange={e=>set(e.target.value)} onKeyDown={handleKey} autoComplete={ac} style={inputStyle()} />
                  </div>
                ))}
              </div>
            )}

            {/* Email */}
            {(mode === "login" || mode === "register" || mode === "forgot") && (
              <div style={{ position:"relative" }}>
                <Mail size={16} style={iconStyle} />
                <input id="input-email" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={handleKey} autoComplete="email" style={inputStyle()} />
              </div>
            )}

            {/* Password */}
            {(mode === "login" || mode === "register") && (
              <div>
                <div style={{ position:"relative" }}>
                  <Lock size={16} style={iconStyle} />
                  <input id="input-password" type={showPw?"text":"password"} placeholder="Password (min 8 chars)" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={handleKey} autoComplete={mode==="register"?"new-password":"current-password"} style={inputStyle({paddingRight:"40px"})} />
                  <button type="button" tabIndex={-1} onClick={()=>setShowPw(!showPw)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color: dark ? "#94a3b8" : "#475569", display:"flex" }}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
                {mode === "register" && <PasswordStrength password={password} />}
              </div>
            )}

            {/* Reset fields */}
            {mode === "reset" && (
              <>
                <div style={{ position:"relative" }}>
                  <KeyRound size={16} style={iconStyle} />
                  <input id="input-reset-token" placeholder="Reset token (from email)" value={resetToken} onChange={e=>setResetToken(e.target.value)} onKeyDown={handleKey} style={inputStyle()} />
                </div>
                <div style={{ position:"relative" }}>
                  <Lock size={16} style={iconStyle} />
                  <input id="input-new-password" type={showNewPw?"text":"password"} placeholder="New password (min 8 chars)" value={newPassword} onChange={e=>setNewPassword(e.target.value)} onKeyDown={handleKey} autoComplete="new-password" style={inputStyle({paddingRight:"40px"})} />
                  <button type="button" tabIndex={-1} onClick={()=>setShowNewPw(!showNewPw)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color: dark ? "#94a3b8" : "#475569", display:"flex" }}>
                    <EyeIcon open={showNewPw} />
                  </button>
                </div>
              </>
            )}

            {/* Alerts */}
            {error && (
              <div style={{ padding:"10px 14px", borderRadius:"12px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", display:"flex", gap:"8px", alignItems:"flex-start" }}>
                <AlertTriangle size={15} style={{color:"#dc2626",flexShrink:0,marginTop:"1px"}} />
                <span style={{ fontSize:"13.5px", fontWeight:700, color:"#dc2626", lineHeight:1.5 }}>{error}</span>
              </div>
            )}
            {info && (
              <div style={{ padding:"10px 14px", borderRadius:"12px", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", display:"flex", gap:"8px", alignItems:"flex-start" }}>
                <CheckCircle2 size={15} style={{color:"#059669",flexShrink:0,marginTop:"1px"}} />
                <span style={{ fontSize:"13.5px", fontWeight:700, color:"#059669", lineHeight:1.5 }}>{info}</span>
              </div>
            )}

            {/* Submit */}
            <button id="btn-submit" onClick={submit} disabled={disabled} style={{
              width:"100%", padding:"14px 20px", borderRadius:"14px",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
              fontFamily:FONT, fontSize:"15.5px", fontWeight:800, cursor: disabled ? "not-allowed" : "pointer",
              border:"none",
              background: disabled ? (dark ? "rgba(255,255,255,0.08)" : "#e2e8f0") : "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color: disabled ? (dark ? "#64748b" : "#64748b") : "#fff",
              boxShadow: disabled ? "none" : "0 6px 22px rgba(37,99,235,0.35)",
              marginTop:"4px", transition:"all 0.2s", letterSpacing:"-0.01em",
            }}
              onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 10px 28px rgba(37,99,235,0.45)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow = disabled ? "none" : "0 6px 22px rgba(37,99,235,0.35)"; }}
            >
              {loading
                ? <div style={{width:"18px",height:"18px",border:"2.5px solid rgba(255,255,255,0.25)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
                : <><span>{mode==="login"?"Sign In":mode==="register"?"Create Account":mode==="forgot"?"Send Reset Link":"Set New Password"}</span><ArrowRight size={17}/></>
              }
            </button>

            {mode === "login" && (
              <button id="btn-forgot-password" type="button" onClick={()=>switchMode("forgot")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:FONT, fontSize:"13.5px", fontWeight:700, color: dark ? "#cbd5e1" : "#2563eb", textAlign:"center", padding:"4px 0", transition:"color 0.2s" }}
                onMouseEnter={e=>{e.currentTarget.style.color="#1d4ed8"}} onMouseLeave={e=>{e.currentTarget.style.color= dark ? "#cbd5e1" : "#2563eb"}}>
                Forgot your password?
              </button>
            )}
            {mode === "forgot" && (
              <button id="btn-have-reset-token" type="button" onClick={()=>switchMode("reset")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:FONT, fontSize:"13.5px", fontWeight:700, color: dark ? "#cbd5e1" : "#2563eb", textAlign:"center", padding:"4px 0", transition:"color 0.2s" }}
                onMouseEnter={e=>{e.currentTarget.style.color="#1d4ed8"}} onMouseLeave={e=>{e.currentTarget.style.color= dark ? "#cbd5e1" : "#2563eb"}}>
                Already have a reset token? Enter it here
              </button>
            )}
          </div>

          {/* Footer */}
          <div style={{ paddingTop:"16px", borderTop:`1px solid ${dark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`, marginTop:"20px", textAlign:"center", fontSize:"12.5px", fontWeight:600, color: dark ? "#94a3b8" : "#475569" }}>
            By continuing, you agree to Denno's{" "}
            <button id="btn-terms" onClick={()=>setActiveModal("terms")} style={{background:"none",border:"none",cursor:"pointer",fontFamily:FONT,fontSize:"12.5px",fontWeight:800,color:"#2563eb"}}>Terms of Service</button>{" "}
            and{" "}
            <button id="btn-privacy" onClick={()=>setActiveModal("privacy")} style={{background:"none",border:"none",cursor:"pointer",fontFamily:FONT,fontSize:"12.5px",fontWeight:800,color:"#2563eb"}}>Privacy Policy</button>.
          </div>
        </div>
      </div>

      {/* ─── MODAL ─── */}
      {activeModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, padding:"20px" }} onClick={()=>setActiveModal(null)}>
          <div style={{ background: dark ? "#0d1117" : "#fff", border:`1px solid ${dark ? "rgba(255,255,255,0.07)" : "#e2e8f0"}`, borderRadius:"20px", maxWidth:"600px", width:"100%", maxHeight:"82vh", display:"flex", flexDirection:"column", boxShadow:"0 28px 70px rgba(0,0,0,0.45)", overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"20px 24px", borderBottom:`1px solid ${dark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`, display:"flex", alignItems:"center", justifyContent:"space-between", background: dark ? "rgba(255,255,255,0.02)" : "#fafafa" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ width:"38px", height:"38px", borderRadius:"11px", background:"rgba(37,99,235,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {activeModal==="terms" ? <FileText size={17} style={{color:"#3b82f6"}} /> : <Shield size={17} style={{color:"#3b82f6"}} />}
                </div>
                <div>
                  <h3 style={{ fontSize:"16px", fontWeight:800, color: dark ? "#fff" : "#0f172a", letterSpacing:"-0.02em", margin:0 }}>{activeModal==="terms" ? "Terms of Service" : "Privacy Policy"}</h3>
                  <p style={{ fontSize:"12px", color: dark ? "#64748b" : "#94a3b8", fontWeight:500, margin:"2px 0 0" }}>Last updated: January 2026 · Denno Career Intelligence OS</p>
                </div>
              </div>
              <button onClick={()=>setActiveModal(null)} style={{ background:"none", border:"none", cursor:"pointer", width:"32px", height:"32px", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", color: dark ? "#64748b" : "#94a3b8" }}><X size={16}/></button>
            </div>
            <div style={{ padding:"22px 24px", overflowY:"auto", display:"flex", flexDirection:"column", gap:"16px" }}>
              {(activeModal==="terms" ? [
                {title:"1. Acceptance of Terms",text:"By creating an account or using Denno Career Intelligence OS, you agree to comply with and be bound by these Terms of Service."},
                {title:"2. Account Security & Responsibilities",text:"You are responsible for maintaining the confidentiality of your credentials. You agree to notify us immediately of any unauthorized use of your account."},
                {title:"3. Job Application Automation & User Content",text:"Denno provides intelligent application tracking, CV optimization, and cover letter generation. You retain full ownership of your personal data and uploaded CVs."},
                {title:"4. AI Career Assistant & Recommendations",text:"AI responses and match scores are provided for decision-support purposes. Denno does not guarantee employment outcomes or third-party hiring decisions."},
                {title:"5. Service Availability & Modifications",text:"We continuously enhance our features and algorithms. Denno reserves the right to modify or suspend services with reasonable notice."},
              ] : [
                {title:"1. Information We Collect",text:"We collect information you provide directly (name, email, career goals, salary targets, CV files) as well as usage telemetry to deliver personalized job matching."},
                {title:"2. How We Use Your Information",text:"Your data is strictly used to power your application pipeline, compute ATS match scores, and generate tailored cover letters. We never sell your data."},
                {title:"3. Data Protection & Security",text:"We employ industry-standard encryption, Row-Level Security (RLS) policies, and secure HTTP-only cookie authentication to safeguard your career records."},
                {title:"4. Data Ownership & Export Rights",text:"You retain 100% ownership of your data. You may export your pipeline, notes, and CV versions at any time via the Data Transfer settings."},
                {title:"5. Cookies & Local Session Storage",text:"Denno uses browser session storage and essential cookies strictly to manage authentication sessions and retain your UI theme preferences."},
              ]).map(s => (
                <section key={s.title}>
                  <h4 style={{ fontSize:"14px", fontWeight:700, color: dark ? "#f1f5f9" : "#0f172a", marginBottom:"6px" }}>{s.title}</h4>
                  <p style={{ fontSize:"13.5px", color: dark ? "#94a3b8" : "#475569", lineHeight:1.65, fontWeight:400, margin:0 }}>{s.text}</p>
                </section>
              ))}
            </div>
            <div style={{ padding:"14px 24px", borderTop:`1px solid ${dark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`, display:"flex", justifyContent:"flex-end", background: dark ? "rgba(255,255,255,0.02)" : "#fafafa" }}>
              <button onClick={()=>setActiveModal(null)} style={{ padding:"10px 20px", borderRadius:"11px", background:"#2563eb", color:"#fff", fontFamily:FONT, fontSize:"13.5px", fontWeight:700, border:"none", cursor:"pointer", boxShadow:"0 3px 12px rgba(37,99,235,0.28)", transition:"background 0.2s" }}>
                I Understand & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
