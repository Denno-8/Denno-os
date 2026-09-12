import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../services/api";

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { id: "welcome",   title: "Welcome to Denno",          subtitle: "Your AI career command centre" },
  { id: "profile",   title: "Tell us about yourself",     subtitle: "We'll tailor everything to you" },
  { id: "career",    title: "Career preferences",         subtitle: "So we can surface the right jobs" },
  { id: "goals",     title: "Set your first goal",        subtitle: "A target keeps you on track" },
  { id: "done",      title: "You're all set!",            subtitle: "Let's get to work" },
] as const;

type StepId = typeof STEPS[number]["id"];

interface OnboardingData {
  first_name: string;
  last_name: string;
  title: string;
  location: string;
  phone: string;
  years_experience: number;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  career_goal: string;
  availability: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  skills: string[];
  goalTitle: string;
  goalDeadline: string;
}

const CURRENCIES = ["KES", "USD", "GBP", "EUR", "ZAR", "NGN", "GHS"];
const AVAILABILITIES = [
  "Immediately",
  "2 weeks notice",
  "1 month notice",
  "3 months notice",
  "Not actively looking",
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<StepId>("welcome");
  const [skillInput, setSkillInput] = useState("");
  const [data, setData] = useState<OnboardingData>({
    first_name: "",
    last_name: "",
    title: "",
    location: "",
    phone: "",
    years_experience: 0,
    linkedin: "",
    github: "",
    website: "",
    summary: "",
    career_goal: "",
    availability: "Immediately",
    salary_min: 0,
    salary_max: 0,
    currency: "KES",
    skills: [],
    goalTitle: "",
    goalDeadline: "",
  });

  const currentIndex = STEPS.findIndex((s) => s.id === step);
  const progress = ((currentIndex) / (STEPS.length - 1)) * 100;

  const update = (field: keyof OnboardingData, value: unknown) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !data.skills.includes(s)) {
      update("skills", [...data.skills, s]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) =>
    update("skills", data.skills.filter((s) => s !== skill));

  // ── API mutations ─────────────────────────────────────────────────────────
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const { goalTitle, goalDeadline, ...profile } = data;
      await apiClient.put("/auth/me", profile);
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      if (!data.goalTitle) return;
      await apiClient.post("/goals/", {
        title: data.goalTitle,
        deadline: data.goalDeadline || null,
        status: "active",
      });
    },
  });

  const handleNext = async () => {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (step === "career") {
      // Save profile before moving to goal step
      await saveProfileMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ["me"] });
    }
    if (step === "goals") {
      // Create goal then move to done
      await createGoalMutation.mutateAsync();
    }
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1].id);
    }
  };

  const handleSkip = () => {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };

  const handleFinish = () => navigate("/applications");

  const currentStep = STEPS.find((s) => s.id === step)!;
  const isLoading = saveProfileMutation.isPending || createGoalMutation.isPending;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
    }}>
      {/* Ambient glow blobs */}
      <div style={{
        position: "fixed", top: "10%", left: "5%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "10%", right: "5%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 560,
        background: "rgba(15,23,42,0.85)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #6366f1, #3b82f6)",
            transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
            borderRadius: 2,
          }} />
        </div>

        <div style={{ padding: "2.5rem" }}>
          {/* Step indicator */}
          <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i <= currentIndex
                  ? "linear-gradient(90deg, #6366f1, #3b82f6)"
                  : "rgba(255,255,255,0.1)",
                transition: "background 0.4s",
              }} />
            ))}
          </div>

          {/* Header */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{
              width: 48, height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, marginBottom: "1rem",
              boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            }}>
              {step === "welcome" ? "👋" : step === "profile" ? "👤" : step === "career" ? "🎯" : step === "goals" ? "🏆" : "🚀"}
            </div>
            <h1 style={{
              margin: 0, fontSize: "1.6rem", fontWeight: 700,
              background: "linear-gradient(135deg, #f8fafc, #94a3b8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              lineHeight: 1.2,
            }}>
              {currentStep.title}
            </h1>
            <p style={{ margin: "0.5rem 0 0", color: "#64748b", fontSize: "0.9rem" }}>
              {currentStep.subtitle}
            </p>
          </div>

          {/* ── Step Content ───────────────────────────────────────────── */}

          {step === "welcome" && (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1.5rem", lineHeight: 1 }}>🎉</div>
              <p style={{ color: "#94a3b8", lineHeight: 1.7, fontSize: "0.95rem", margin: 0 }}>
                Denno is your AI-powered career intelligence platform. In the next few steps,
                we'll set up your profile so you can track applications, tailor your CV,
                generate cover letters, and stay ahead of interviews — all in one place.
              </p>
            </div>
          )}

          {step === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <Field label="First Name" required>
                  <Input value={data.first_name} onChange={(v) => update("first_name", v)} placeholder="Jane" />
                </Field>
                <Field label="Last Name" required>
                  <Input value={data.last_name} onChange={(v) => update("last_name", v)} placeholder="Doe" />
                </Field>
              </div>
              <Field label="Professional Title">
                <Input value={data.title} onChange={(v) => update("title", v)} placeholder="Senior Software Engineer" />
              </Field>
              <Field label="Location">
                <Input value={data.location} onChange={(v) => update("location", v)} placeholder="Nairobi, Kenya" />
              </Field>
              <Field label="Phone">
                <Input value={data.phone} onChange={(v) => update("phone", v)} placeholder="+254 700 000 000" />
              </Field>
              <Field label="LinkedIn URL">
                <Input value={data.linkedin} onChange={(v) => update("linkedin", v)} placeholder="https://linkedin.com/in/janedoe" />
              </Field>
            </div>
          )}

          {step === "career" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Field label="Years of Experience">
                <Input
                  type="number"
                  value={String(data.years_experience)}
                  onChange={(v) => update("years_experience", parseInt(v) || 0)}
                  placeholder="5"
                />
              </Field>
              <Field label="Availability">
                <Select
                  value={data.availability}
                  onChange={(v) => update("availability", v)}
                  options={AVAILABILITIES}
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: "0.75rem" }}>
                <Field label="Salary Min">
                  <Input
                    type="number"
                    value={String(data.salary_min)}
                    onChange={(v) => update("salary_min", parseInt(v) || 0)}
                    placeholder="80000"
                  />
                </Field>
                <Field label="Salary Max">
                  <Input
                    type="number"
                    value={String(data.salary_max)}
                    onChange={(v) => update("salary_max", parseInt(v) || 0)}
                    placeholder="120000"
                  />
                </Field>
                <Field label="Currency">
                  <Select
                    value={data.currency}
                    onChange={(v) => update("currency", v)}
                    options={CURRENCIES}
                  />
                </Field>
              </div>
              <Field label="Skills">
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="Type a skill and press Enter…"
                    style={inputStyle}
                  />
                  <button onClick={addSkill} style={addBtnStyle}>+</button>
                </div>
                {data.skills.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {data.skills.map((skill) => (
                      <span key={skill} style={tagStyle}>
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", marginLeft: 4, padding: 0, fontSize: 14, lineHeight: 1 }}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
              <Field label="One-line career summary">
                <textarea
                  value={data.summary}
                  onChange={(e) => update("summary", e.target.value)}
                  placeholder="Results-driven engineer with 5+ years building scalable systems…"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
            </div>
          )}

          {step === "goals" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>
                Setting a goal keeps your job search focused. You can always add more later.
              </p>
              <Field label="Goal Title" required>
                <Input
                  value={data.goalTitle}
                  onChange={(v) => update("goalTitle", v)}
                  placeholder="Land a Senior Engineer role at a Series B startup"
                />
              </Field>
              <Field label="Target Deadline">
                <Input
                  type="date"
                  value={data.goalDeadline}
                  onChange={(v) => update("goalDeadline", v)}
                />
              </Field>
            </div>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{
                width: 72, height: 72,
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, margin: "0 auto 1.25rem",
                boxShadow: "0 12px 32px rgba(34,197,94,0.3)",
              }}>
                ✓
              </div>
              <h2 style={{ margin: "0 0 0.75rem", color: "#f8fafc", fontSize: "1.2rem", fontWeight: 600 }}>
                Your profile is ready!
              </h2>
              <p style={{ color: "#64748b", lineHeight: 1.7, fontSize: "0.9rem", margin: 0 }}>
                Start by browsing the job board, importing your CV, or logging your first application.
                Denno's AI will keep your career on track 🚀
              </p>
              <div style={{
                display: "flex", gap: 12, marginTop: "1.75rem", justifyContent: "center", flexWrap: "wrap",
              }}>
                {[
                  { label: "Browse Jobs", path: "/jobs", icon: "💼" },
                  { label: "Upload CV", path: "/cv", icon: "📄" },
                  { label: "Add Application", path: "/applications", icon: "✏️" },
                ].map((cta) => (
                  <button
                    key={cta.path}
                    onClick={() => navigate(cta.path)}
                    style={{
                      background: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.25)",
                      color: "#a5b4fc", borderRadius: 10, padding: "0.6rem 1.1rem",
                      cursor: "pointer", fontSize: "0.85rem", fontWeight: 500,
                      display: "flex", alignItems: "center", gap: 6,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.22)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.12)";
                    }}
                  >
                    <span>{cta.icon}</span> {cta.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Footer actions ──────────────────────────────────────────── */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: "2rem", paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            {currentIndex > 0 && step !== "done" ? (
              <button
                onClick={() => setStep(STEPS[currentIndex - 1].id)}
                style={ghostBtnStyle}
              >
                ← Back
              </button>
            ) : <div />}

            <div style={{ display: "flex", gap: 10 }}>
              {step !== "welcome" && step !== "done" && (
                <button onClick={handleSkip} style={ghostBtnStyle}>Skip</button>
              )}

              {step === "done" ? (
                <button onClick={handleFinish} style={primaryBtnStyle}>
                  Go to Dashboard →
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={isLoading}
                  style={{ ...primaryBtnStyle, opacity: isLoading ? 0.7 : 1 }}
                >
                  {isLoading ? "Saving…" : step === "goals" ? "Finish Setup →" : "Continue →"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, padding: "0.65rem 0.9rem",
  color: "#f1f5f9", fontSize: "0.9rem",
  outline: "none", transition: "border-color 0.2s",
};

const addBtnStyle: React.CSSProperties = {
  flexShrink: 0, width: 38, height: 38,
  background: "rgba(99,102,241,0.2)",
  border: "1px solid rgba(99,102,241,0.3)",
  borderRadius: 10, color: "#818cf8",
  fontSize: 20, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const tagStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center",
  background: "rgba(99,102,241,0.15)",
  border: "1px solid rgba(99,102,241,0.25)",
  borderRadius: 6, padding: "2px 10px",
  color: "#a5b4fc", fontSize: "0.8rem",
};

const primaryBtnStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #6366f1, #3b82f6)",
  border: "none", borderRadius: 10,
  color: "#fff", fontWeight: 600,
  padding: "0.7rem 1.5rem", cursor: "pointer",
  fontSize: "0.9rem",
  boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
  transition: "transform 0.15s, box-shadow 0.15s",
};

const ghostBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#64748b",
  padding: "0.7rem 1.25rem",
  cursor: "pointer", fontSize: "0.9rem",
  transition: "border-color 0.2s, color 0.2s",
};

// Tiny helper components
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label style={{ display: "block", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 500, marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#f87171" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
    />
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: "pointer" }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
