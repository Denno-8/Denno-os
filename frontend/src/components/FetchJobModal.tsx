import { useState } from "react";
import { Zap, X, Globe } from "lucide-react";
import { jobsService } from "../services/jobs.service";
import { useQueryClient } from "@tanstack/react-query";

interface FetchJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FetchJobModal({ isOpen, onClose }: FetchJobModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  if (!isOpen) return null;

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await jobsService.fetchExternal(url.trim());
      qc.invalidateQueries({ queryKey: ["jobs"] });
      setUrl("");
      onClose();
    } catch {
      setError("Could not parse job from this URL. Check the link and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Fetch Job from LinkedIn / Web</h3>
            <p style={styles.sub}>Paste any LinkedIn job posting or career page URL</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={styles.body}>
          <label style={styles.label}>Job Posting URL:</label>
          <input
            style={styles.input}
            placeholder="https://www.linkedin.com/jobs/view/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <div style={styles.presetWrap}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Quick Presets:</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              <button
                style={styles.presetBtn}
                onClick={() => setUrl("https://www.linkedin.com/jobs/view/safaricom-senior-backend-engineer")}
              >
                LinkedIn · Safaricom Backend
              </button>
              <button
                style={styles.presetBtn}
                onClick={() => setUrl("https://careers.google.com/jobs/results/google-cloud-architect")}
              >
                Google · Cloud Architect
              </button>
            </div>
          </div>

          {error && <div style={styles.errorAlert}>{error}</div>}

          <button
            style={{ ...styles.actionBtn, ...(loading || !url.trim() ? styles.disabled : {}) }}
            onClick={handleFetch}
            disabled={loading || !url.trim()}
          >
            <Zap size={16} />
            <span>{loading ? "Extracting Job & Parsing Skills..." : "Parse & Add to Job Feed"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.6)", zIndex: 110,
    display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(4px)", padding: 16,
  },
  modal: {
    width: "100%", maxWidth: 480,
    backgroundColor: "var(--modal-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: 20,
    boxShadow: "0 20px 50px rgba(0,0,0,0.4)", overflow: "hidden",
    color: "var(--text-primary)",
  },
  header: {
    padding: "18px 24px", borderBottom: "1px solid var(--border-color)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  title: { margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" },
  sub: { margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" },
  closeBtn: { background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" },
  body: { padding: 24, display: "flex", flexDirection: "column", gap: 14 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" },
  input: {
    width: "100%", backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)",
    borderRadius: 10, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none",
  },
  presetWrap: { backgroundColor: "var(--input-bg)", padding: 12, borderRadius: 10 },
  presetBtn: {
    background: "rgba(59,130,246,0.12)", border: "none", color: "#3b82f6",
    fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 6, cursor: "pointer",
  },
  errorAlert: {
    background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
    color: "#ef4444", fontSize: 12, padding: "8px 12px", borderRadius: 8,
  },
  actionBtn: {
    width: "100%", padding: "12px 0", background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
    boxShadow: "0 4px 14px rgba(37,99,235,0.4)", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
};
