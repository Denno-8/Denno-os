import { AlertCircle, RefreshCw, LogIn } from "lucide-react";

interface ApiErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ApiErrorCard({
  title = "Couldn't load data from Denno API",
  message = "Please check your network connection or try signing in again.",
  onRetry,
}: ApiErrorCardProps) {
  return (
    <div style={containerStyle}>
      <div style={iconWrapStyle}>
        <AlertCircle size={22} style={{ color: "#ef4444" }} />
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          {title}
        </h4>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
          {message}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={() => {
            sessionStorage.removeItem("denno_access_token");
            window.location.href = "/login";
          }}
          style={loginBtnStyle}
        >
          <LogIn size={13} />
          Sign In Again
        </button>
        {onRetry && (
          <button onClick={onRetry} style={retryBtnStyle}>
            <RefreshCw size={13} />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "16px 20px",
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.25)",
  borderRadius: 14,
  margin: 12,
};
const iconWrapStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  background: "rgba(239,68,68,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
const retryBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 9,
  padding: "7px 14px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  flexShrink: 0,
};
const loginBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "var(--input-bg)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-color)",
  borderRadius: 9,
  padding: "7px 14px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  flexShrink: 0,
};
