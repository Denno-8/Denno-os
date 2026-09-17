import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { KeyRound, Lock, ArrowRight, CheckCircle2, AlertTriangle, Shield, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useSEO } from "../../hooks/useSEO";
import { authService } from "../../services/auth.service";
import { ApiError } from "../../services/api";

const FONT = "'Plus Jakarta Sans', Inter, ui-sans-serif, system-serif";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One digit (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

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
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "3px",
              borderRadius: "2px",
              background: i <= score ? colors[score] : "rgba(148,163,184,0.2)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: "11px", fontWeight: 700, color: colors[score] }}>{labels[score]}</span>
      <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
        {PASSWORD_RULES.map((rule) => (
          <div key={rule.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 600, color: rule.test(password) ? "#10b981" : "#94a3b8" }}>
            <span style={{ fontSize: "10px" }}>{rule.test(password) ? "✓" : "○"}</span>
            {rule.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  useSEO({
    title: "Reset Password — Denno Career OS",
    description: "Reset your Denno Career OS account password.",
    canonical: "https://denno-os.vercel.app/reset-password",
  });

  const { theme } = useTheme();
  const dark = theme === "dark";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlToken = searchParams.get("token") || "";
  const [token, setToken] = useState(urlToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (urlToken) setToken(urlToken);
  }, [urlToken]);

  const allRulesMet = PASSWORD_RULES.every((r) => r.test(newPassword));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("Reset token is missing. Please use the link sent to your email, or paste the token manually.");
      return;
    }
    if (!allRulesMet) {
      setError("Password does not meet requirements. Please check all rules above.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter your new password.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const d = (err.body as any)?.detail;
        if (err.status === 422) {
          setError("Password does not meet security requirements: must be 8–128 chars with uppercase, digit, and special character.");
        } else if (err.status === 400) {
          setError("Reset link is invalid or expired. Please request a new password reset link from the login page.");
        } else {
          setError(typeof d === "string" ? d : "Failed to reset password. The link may have expired — please request a new one.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };


  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 14px 11px 40px",
    borderRadius: "12px",
    border: `1.5px solid ${dark ? "rgba(255,255,255,0.15)" : "#cbd5e1"}`,
    background: dark ? "rgba(255,255,255,0.05)" : "#ffffff",
    color: dark ? "#f8fafc" : "#0f172a",
    fontFamily: FONT,
    fontSize: "14.5px",
    fontWeight: 600,
    outline: "none",
    transition: "all 0.2s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: FONT,
        background: dark ? "#030712" : "#0f172a",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          borderRadius: "24px",
          padding: "36px",
          border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.2)"}`,
          background: dark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.95)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              marginBottom: "12px",
              boxShadow: "0 8px 20px rgba(37,99,235,0.3)",
            }}
          >
            <KeyRound size={24} />
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: dark ? "#f8fafc" : "#0f172a",
              margin: "0 0 6px",
            }}
          >
            Set New Password
          </h1>
          <p style={{ fontSize: "13.5px", color: dark ? "#94a3b8" : "#64748b", margin: 0 }}>
            Choose a strong password for your Denno Career OS account
          </p>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "20px",
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            <CheckCircle2 size={48} style={{ color: "#10b981", marginBottom: "12px" }} />
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: dark ? "#f8fafc" : "#0f172a", margin: "0 0 8px" }}>
              Password Reset Successfully!
            </h2>
            <p style={{ fontSize: "13.5px", color: dark ? "#94a3b8" : "#64748b", marginBottom: "20px" }}>
              Redirecting you to the login page...
            </p>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#3b82f6",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              Go to Login <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {!urlToken && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: dark ? "#cbd5e1" : "#334155",
                    marginBottom: "6px",
                  }}
                >
                  Reset Token
                </label>
                <div style={{ position: "relative" }}>
                  <Shield
                    size={16}
                    style={{
                      position: "absolute",
                      left: "13px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: dark ? "#94a3b8" : "#475569",
                    }}
                  />
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste reset token here..."
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: dark ? "#cbd5e1" : "#334155",
                  marginBottom: "6px",
                }}
              >
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: "13px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: dark ? "#94a3b8" : "#475569",
                  }}
                />
                <input
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. MyPass1!"
                  style={{ ...inputStyle, paddingRight: "40px" }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: dark ? "#94a3b8" : "#475569", display: "flex" }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={newPassword} />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: dark ? "#cbd5e1" : "#334155",
                  marginBottom: "6px",
                }}
              >
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: "13px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: dark ? "#94a3b8" : "#475569",
                  }}
                />
                <input
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  style={{ ...inputStyle, paddingRight: "40px" }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: dark ? "#94a3b8" : "#475569", display: "flex" }}
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !allRulesMet || !confirmPassword}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#fff",
                fontSize: "14.5px",
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                opacity: loading || !allRulesMet || !confirmPassword ? 0.6 : 1,
                boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              {loading ? "Resetting Password..." : "Update Password"}
              {!loading && <ArrowRight size={16} />}
            </button>

            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <Link
                to="/login"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: dark ? "#94a3b8" : "#64748b",
                  textDecoration: "none",
                }}
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
