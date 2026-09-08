import { useState } from "react";
import { X, Send, Copy, Check, ExternalLink, MessageSquare, Sparkles } from "lucide-react";
import type { Recruiter } from "../types/recruiter.types";
import { useUpdateRecruiter } from "../hooks/useRecruiters";

interface LinkedInOutreachModalProps {
  recruiter: Recruiter;
  onClose: () => void;
}

const TEMPLATES = [
  {
    id: "connection_note",
    name: "🤝 Connection Request Note (Short - 300 max)",
    maxLength: 300,
    text: (name: string, company: string) =>
      `Hi ${name}, I came across your profile and admire your work at ${company || "tech companies"}. As a software developer building modern web & tech solutions, I'd love to connect and follow your work!`,
  },
  {
    id: "recruiter_pitch",
    name: "💼 Recruiter / InMail Pitch",
    maxLength: 1900,
    text: (name: string, company: string) =>
      `Hi ${name},\n\nI hope you're having a great week! I'm reaching out because I've been closely following ${company || "tech engineering opportunities"} and am really impressed by the team's work.\n\nI'm a Software Engineer experienced in Full-Stack Development (React, TypeScript, Python/FastAPI, PostgreSQL, & Cloud APIs). I'm currently exploring software & tech engineering roles where I can deliver high-impact features.\n\nIf you have a moment, I'd welcome a quick conversation or connection. Thank you for your time!\n\nBest regards,\nDennis Kibet`,
  },
  {
    id: "referral_ask",
    name: "🙋‍♂️ Employee Referral Request",
    maxLength: 1900,
    text: (name: string, company: string) =>
      `Hi ${name},\n\nHope you're doing well! I saw an open engineering role at ${company || "your company"} that matches my software development background in React, Python, and web applications.\n\nSince you're at ${company || "the company"}, I wanted to ask if you'd be open to sharing any advice or considering a referral? I'd be super grateful for any insights into the team culture.\n\nThanks a lot!`,
  },
  {
    id: "application_followup",
    name: "🎯 Application Follow-up",
    maxLength: 1900,
    text: (name: string, company: string) =>
      `Hi ${name},\n\nI recently submitted my application for the software engineering position at ${company || "your company"}.\n\nGiven my hands-on experience building production software systems, I wanted to reach out directly to reiterate my strong interest in joining the team. Please let me know if there are any additional details I can provide!\n\nThank you, ${name}!`,
  },
];

export default function LinkedInOutreachModal({ recruiter, onClose }: LinkedInOutreachModalProps) {
  const updateRecruiter = useUpdateRecruiter();
  const [selectedTemplate, setSelectedTemplate] = useState("connection_note");
  const [linkedinUrl, setLinkedinUrl] = useState(recruiter.linkedin || "");
  const [copied, setCopied] = useState(false);
  const [sentStatus, setSentStatus] = useState(false);

  const tpl = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];
  const [message, setMessage] = useState(() => tpl.text(recruiter.name || "there", recruiter.company_name || ""));

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const newTpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
    setMessage(newTpl.text(recruiter.name || "there", recruiter.company_name || ""));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenLinkedIn = () => {
    // 1. Copy text to clipboard
    navigator.clipboard.writeText(message);
    setCopied(true);

    // 2. Save LinkedIn URL if changed
    if (linkedinUrl !== recruiter.linkedin) {
      updateRecruiter.mutate({ id: recruiter.id, patch: { linkedin: linkedinUrl } });
    }

    // 3. Mark last contacted timestamp
    updateRecruiter.mutate({
      id: recruiter.id,
      patch: { last_contacted_at: new Date().toISOString() },
    });

    setSentStatus(true);

    // 4. Open LinkedIn target URL
    let targetUrl = "https://www.linkedin.com/messaging/";
    if (linkedinUrl.startsWith("http")) {
      targetUrl = linkedinUrl;
    } else if (linkedinUrl.trim()) {
      targetUrl = `https://www.linkedin.com/in/${linkedinUrl.replace(/[^a-zA-Z0-9\-_]/g, "")}`;
    }

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const charCount = message.length;
  const isOverLimit = charCount > tpl.maxLength;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "linear-gradient(135deg, #0077b5, #00a0dc)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(0,119,181,0.3)",
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                LinkedIn Outreach &amp; Messaging
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
                Messaging <strong style={{ color: "#0077b5" }}>{recruiter.name}</strong> ({recruiter.company_name || "Contact"})
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* LinkedIn Profile URL */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
            LinkedIn Profile URL / Connection Link
          </label>
          <input
            type="text"
            placeholder="e.g. https://www.linkedin.com/in/username"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Template selector */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
            Outreach Template
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTemplateChange(t.id)}
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: selectedTemplate === t.id ? 700 : 500,
                  border: selectedTemplate === t.id ? "1px solid #0077b5" : "1px solid var(--border-color)",
                  background: selectedTemplate === t.id ? "rgba(0,119,181,0.1)" : "var(--input-bg)",
                  color: selectedTemplate === t.id ? "#0077b5" : "var(--text-primary)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Message editor */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>
              Generated LinkedIn Text
            </label>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: isOverLimit ? "#ef4444" : charCount > tpl.maxLength * 0.85 ? "#f59e0b" : "#10b981",
              }}
            >
              {charCount} / {tpl.maxLength} chars
            </span>
          </div>
          <textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              ...inputStyle,
              fontFamily: "inherit",
              resize: "vertical",
              lineHeight: 1.5,
              borderColor: isOverLimit ? "#ef4444" : "var(--input-border)",
            }}
          />
        </div>

        {/* Status notice */}
        {copied && (
          <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: 12, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <Check size={14} />
            <span>Message text copied to clipboard! Ready to paste on LinkedIn.</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleOpenLinkedIn}
            style={{
              flex: 2,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "linear-gradient(135deg, #0077b5, #005885)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "11px 16px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,119,181,0.35)",
            }}
          >
            <Send size={15} />
            <span>Send on LinkedIn</span>
            <ExternalLink size={13} style={{ opacity: 0.8 }} />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              padding: "11px 12px",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? "Copied!" : "Copy Text"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.65)",
  backdropFilter: "blur(5px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 200,
  padding: 16,
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  background: "var(--modal-bg)",
  border: "1px solid var(--border-color)",
  borderRadius: 20,
  padding: 24,
  boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--input-bg)",
  border: "1px solid var(--input-border)",
  color: "var(--text-primary)",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};
