import { useState } from "react";
import { Users, Plus, Mail, X, AlertCircle, RefreshCw, MessageSquare, ExternalLink } from "lucide-react";
import { useRecruiters, useCreateRecruiter, useUpdateRecruiter, useDeleteRecruiter } from "../../hooks/useRecruiters";
import { STRENGTHS, type Recruiter } from "../../types/recruiter.types";
import LinkedInOutreachModal from "../../components/LinkedInOutreachModal";

const STRENGTH_COLORS: Record<string, string> = {
  Hot: "#ef4444",
  Warm: "#f59e0b",
  Cold: "#3b82f6",
  New: "#10b981",
};

export default function RecruitersPage() {
  const [filter, setFilter] = useState("All");
  const { data: recruiters, isLoading, isError, refetch } = useRecruiters(filter);
  const updateRecruiter = useUpdateRecruiter();
  const deleteRecruiter = useDeleteRecruiter();
  const [showAdd, setShowAdd] = useState(false);
  const [outreachContact, setOutreachContact] = useState<Recruiter | null>(null);

  if (isLoading) {
    return (
      <div style={{ padding: 24, color: "var(--text-secondary)", fontSize: 14 }}>
        Loading contacts…
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: 24 }}>
        <div style={errorCardStyle}>
          <AlertCircle size={22} style={{ color: "#ef4444", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Couldn't reach the Denno API
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Make sure the backend is running and try again.
            </div>
          </div>
          <button onClick={() => refetch()} style={retryBtnStyle}>
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 8 }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
            Networking &amp; Recruiters
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
            {(recruiters ?? []).length} professional recruiter &amp; referral contacts
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={addBtnStyle}>
          <Plus size={16} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {["All", ...STRENGTHS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              ...filterBtn,
              background: filter === s ? "#2563eb" : "var(--bg-card)",
              color: filter === s ? "#ffffff" : "var(--text-primary)",
              borderColor: filter === s ? "#2563eb" : "var(--border-color)",
              boxShadow: filter === s ? "0 2px 8px rgba(37,99,235,0.3)" : "none",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Contact list */}
      <div style={listContainerStyle}>
        {(recruiters ?? []).map((r) => {
          const color = STRENGTH_COLORS[r.relationship_strength] ?? "#64748b";
          return (
            <div key={r.id} style={cardStyle}>
              {/* Avatar */}
              <div
                style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800,
                  background: `${color}18`, color, border: `2px solid ${color}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                {r.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                    {r.name}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99,
                    border: `1px solid ${color}40`, color, background: `${color}15`,
                  }}>
                    {r.relationship_strength}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                  {r.company_name}
                </div>
                {r.notes && (
                  <div style={{
                    fontSize: 12, color: "var(--text-secondary)", marginTop: 8,
                    background: "var(--input-bg)", padding: "8px 12px",
                    borderRadius: 10, border: "1px solid var(--border-color)",
                  }}>
                    {r.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                <select
                  value={r.relationship_strength}
                  onChange={(e) => updateRecruiter.mutate({ id: r.id, patch: { relationship_strength: e.target.value } })}
                  style={{
                    fontSize: 12, background: "var(--input-bg)", border: "1px solid var(--border-color)",
                    color: "var(--text-primary)", borderRadius: 10, padding: "6px 10px",
                    fontWeight: 600, outline: "none", cursor: "pointer",
                  }}
                >
                  {STRENGTHS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setOutreachContact(r)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0077b5",
                      background: "rgba(0,119,181,0.12)",
                      border: "1px solid rgba(0,119,181,0.3)",
                      borderRadius: 8,
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
                  >
                    <MessageSquare size={13} />
                    <span>LinkedIn Text</span>
                  </button>
                  {r.email && (
                    <a
                      href={`mailto:${r.email}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}
                    >
                      <Mail size={13} />
                      <span>Email</span>
                    </a>
                  )}
                  <button
                    onClick={() => deleteRecruiter.mutate(r.id)}
                    style={{ background: "none", border: "none", fontSize: 12, fontWeight: 600, color: "#ef4444", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {(recruiters ?? []).length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            <Users size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div style={{ fontSize: 14 }}>No recruiter contacts yet. Add your first networking connection.</div>
          </div>
        )}
      </div>

      {showAdd && <AddRecruiterModal onClose={() => setShowAdd(false)} />}
      {outreachContact && (
        <LinkedInOutreachModal recruiter={outreachContact} onClose={() => setOutreachContact(null)} />
      )}
    </div>
  );
}

function AddRecruiterModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [strength, setStrength] = useState("Warm");
  const createRecruiter = useCreateRecruiter();

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            Add Recruiter / Connection Contact
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <input style={inputStyle} placeholder="Contact Name *" value={name} onChange={(e) => setName(e.target.value)} />
          <input style={inputStyle} placeholder="Company / Agency" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <input style={inputStyle} placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={inputStyle} placeholder="LinkedIn Profile URL / Handle" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          <select style={inputStyle} value={strength} onChange={(e) => setStrength(e.target.value)}>
            {STRENGTHS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            disabled={!name.trim()}
            onClick={() => createRecruiter.mutate({ name, company_name: companyName, email, linkedin, relationship_strength: strength }, { onSuccess: onClose })}
            style={{ ...modalBtnStyle, opacity: !name.trim() ? 0.5 : 1, cursor: !name.trim() ? "not-allowed" : "pointer" }}
          >
            Save Contact
          </button>
          <button onClick={onClose} style={modalCancelStyle}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const errorCardStyle: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px",
  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
  borderRadius: 14,
};
const retryBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "#ef4444", color: "#fff", border: "none",
  borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 700,
  cursor: "pointer", flexShrink: 0,
};
const addBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none",
  borderRadius: 12, color: "#fff", padding: "10px 16px",
  fontWeight: 700, fontSize: 13, cursor: "pointer",
  boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
};
const filterBtn: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, borderRadius: 12, padding: "7px 14px",
  border: "1px solid", cursor: "pointer", transition: "all 0.15s",
};
const listContainerStyle: React.CSSProperties = {
  background: "var(--bg-card)", borderRadius: 16,
  border: "1px solid var(--border-color)", overflow: "hidden",
};
const cardStyle: React.CSSProperties = {
  display: "flex", gap: 16, alignItems: "flex-start", padding: "16px 20px",
  borderBottom: "1px solid var(--border-color)",
};
const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
  justifyContent: "center", zIndex: 100, padding: 16,
};
const modalStyle: React.CSSProperties = {
  width: "100%", maxWidth: 420, background: "var(--modal-bg)",
  border: "1px solid var(--border-color)", borderRadius: 20,
  padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
};
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)",
  color: "var(--text-primary)", borderRadius: 10, padding: "10px 14px",
  fontSize: 13, outline: "none",
};
const modalBtnStyle: React.CSSProperties = {
  flex: 1, background: "#2563eb", color: "#fff", border: "none",
  borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700,
};
const modalCancelStyle: React.CSSProperties = {
  flex: 1, background: "var(--input-bg)", color: "var(--text-secondary)",
  border: "1px solid var(--border-color)", borderRadius: 10, padding: "10px 0",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
};
