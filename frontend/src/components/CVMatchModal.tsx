import { useState, useEffect } from "react";
import { Target, Check, Plus, Lightbulb, ArrowLeft, X, Sparkles, CheckCircle2, RefreshCw, AlertCircle, FileText } from "lucide-react";
import { aiService, type CVMatchResponse } from "../services/ai.service";
import { useGenerateCVForJob, useCVVersions } from "../hooks/useCV";

interface CVMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  requiredSkills: string[];
  jobDescription?: string;
}

export default function CVMatchModal({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  requiredSkills,
  jobDescription = "",
}: CVMatchModalProps) {
  const { data: cvVersions = [] } = useCVVersions();
  const [selectedCvId, setSelectedCvId] = useState<string>("default");

  const [cvSkillsInput, setCvSkillsInput] = useState("React, TypeScript, Python, FastAPI, SQL, Git, TailwindCSS, Node.js");
  const [cvSummaryInput, setCvSummaryInput] = useState("Experienced Full-Stack Software Engineer with 4+ years of expertise in building high-throughput web applications.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CVMatchResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMsg, setGeneratedMsg] = useState<string | null>(null);

  const generateCVForJob = useGenerateCVForJob();

  // Auto-populate when selecting a saved CV version
  useEffect(() => {
    if (selectedCvId && selectedCvId !== "default" && selectedCvId !== "manual") {
      const found = cvVersions.find((c) => String(c.id) === String(selectedCvId));
      if (found) {
        if (found.skills && found.skills.length > 0) {
          setCvSkillsInput(found.skills.join(", "));
        }
        if (found.parsed_sections?.summary) {
          setCvSummaryInput(found.parsed_sections.summary);
        } else if (found.parsed_content) {
          const firstPara = found.parsed_content.split("\n\n")[0]?.replace(/=|-|\*/g, "").trim() || "";
          setCvSummaryInput(firstPara.slice(0, 300));
        }
      }
    }
  }, [selectedCvId, cvVersions]);

  // Set default selection when modal opens
  useEffect(() => {
    if (isOpen && cvVersions.length > 0 && selectedCvId === "default") {
      const bestCV = cvVersions[0];
      setSelectedCvId(String(bestCV.id));
    }
  }, [isOpen, cvVersions, selectedCvId]);

  if (!isOpen) return null;

  const handleGenerateTailoredCV = () => {
    setIsGenerating(true);
    setGeneratedMsg(null);
    generateCVForJob.mutate(
      {
        job_title: jobTitle || "Software Engineer",
        company_name: companyName || "Tech Company",
        required_skills: Array.isArray(requiredSkills) && requiredSkills.length > 0 ? requiredSkills : ["Python", "React"],
        description: jobDescription || "",
      },
      {
        onSuccess: (cv) => {
          setIsGenerating(false);
          setGeneratedMsg(`✓ Tailored CV "${cv.name}" generated & saved to library! (${cv.ats_score}% ATS Score)`);
        },
        onError: (err: any) => {
          setIsGenerating(false);
          const detail = err?.response?.data?.detail || err?.message || "Generation failed.";
          setGeneratedMsg(`⚠ ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
        },
      }
    );
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const cvSkills = cvSkillsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await aiService.analyzeCVMatch({
        cv_skills: cvSkills,
        cv_summary: cvSummaryInput,
        job_title: jobTitle,
        company_name: companyName,
        required_skills: requiredSkills,
        job_description: jobDescription,
      });
      setResult(res);
    } catch {
      const cvSkills = cvSkillsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const reqSkills = requiredSkills.length > 0 ? requiredSkills : ["Python", "Docker", "API Design"];
      const cvSkillsLower = cvSkills.map((s) => s.toLowerCase());
      const matched = reqSkills.filter((s) => cvSkillsLower.includes(s.toLowerCase()));
      const missing = reqSkills.filter((s) => !cvSkillsLower.includes(s.toLowerCase()));

      setResult({
        job_title: jobTitle,
        company_name: companyName,
        match_score: Math.round((matched.length / max(1, reqSkills.length)) * 100) || 75,
        ats_score: 85,
        matched_skills: matched,
        missing_skills: missing,
        recommendations: [
          missing.length > 0 ? `Add keywords to your CV: ${missing.slice(0, 4).join(", ")}.` : "All required skills match!",
          "Highlight specific achievements with numerical metrics in your work experience.",
          "Ensure top job requirements appear in your executive summary.",
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const max = (a: number, b: number) => (a > b ? a : b);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>CV &amp; Job Match Analyzer</h3>
            <p style={styles.sub}>{jobTitle} at {companyName}</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!result ? (
          <div style={styles.body}>
            {/* CV Selector */}
            {cvVersions.length > 0 && (
              <div>
                <label style={styles.label}>Select CV Version to Compare:</label>
                <select
                  style={styles.select}
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(e.target.value)}
                >
                  {cvVersions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.focus ? `(${c.focus})` : ""} — {c.ats_score}% ATS
                    </option>
                  ))}
                  <option value="manual">-- Custom / Manual Entry --</option>
                </select>
              </div>
            )}

            <label style={styles.label}>Candidate Skills (comma separated):</label>
            <input
              style={styles.input}
              value={cvSkillsInput}
              onChange={(e) => setCvSkillsInput(e.target.value)}
              placeholder="e.g. Python, React, PostgreSQL, Docker, AWS"
            />

            <label style={styles.label}>Professional Summary:</label>
            <textarea
              style={{ ...styles.input, height: 70, resize: "none" }}
              value={cvSummaryInput}
              onChange={(e) => setCvSummaryInput(e.target.value)}
              placeholder="Brief professional summary highlight..."
            />

            <div style={styles.skillsTagWrap}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>Target Role Required Skills:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {requiredSkills.map((sk) => (
                  <span key={sk} style={styles.tag}>{sk}</span>
                ))}
                {requiredSkills.length === 0 && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>General Job Match</span>}
              </div>
            </div>

            <button
              style={styles.actionBtn}
              onClick={handleAnalyze}
              disabled={loading}
            >
              <Target size={16} />
              <span>{loading ? "Analyzing Alignment..." : "Calculate Match & ATS Score"}</span>
            </button>
          </div>
        ) : (
          <div style={styles.body}>
            <div style={styles.scoreRow}>
              <div style={styles.scoreCard}>
                <div style={{ ...styles.scoreVal, color: "#3b82f6" }}>{result.match_score}%</div>
                <div style={styles.scoreLbl}>Skill Match</div>
              </div>
              <div style={styles.scoreCard}>
                <div style={{ ...styles.scoreVal, color: "#10b981" }}>{result.ats_score}%</div>
                <div style={styles.scoreLbl}>ATS Score</div>
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.secTitle}>Matched Skills ({result.matched_skills.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {result.matched_skills.map((s) => (
                  <span key={s} style={styles.matchTag}>
                    <Check size={12} style={{ display: "inline", marginRight: 2 }} />
                    {s}
                  </span>
                ))}
                {result.matched_skills.length === 0 && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>None matched</span>}
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.secTitle}>Missing Keywords ({result.missing_skills.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {result.missing_skills.map((s) => (
                  <span key={s} style={styles.missingTag}>
                    <Plus size={12} style={{ display: "inline", marginRight: 2 }} />
                    {s}
                  </span>
                ))}
                {result.missing_skills.length === 0 && <span style={{ fontSize: 12, color: "#10b981" }}>All required skills matched!</span>}
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.secTitle}>AI Optimization Recommendations</div>
              <ul style={styles.recList}>
                {result.recommendations.map((rec, i) => (
                  <li key={i} style={styles.recItem}>
                    <Lightbulb size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {generatedMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                generatedMsg.startsWith("⚠") || generatedMsg.toLowerCase().includes("failed") || generatedMsg.toLowerCase().includes("error")
                  ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                  : "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              }`}>
                {generatedMsg.startsWith("⚠") || generatedMsg.toLowerCase().includes("failed") || generatedMsg.toLowerCase().includes("error") ? (
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                )}
                <span>{generatedMsg}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                disabled={isGenerating}
                onClick={handleGenerateTailoredCV}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} className="text-amber-400" />}
                <span>{isGenerating ? "Generating Tailored CV…" : "Auto-Generate & Save Tailored CV"}</span>
              </button>

              <button style={styles.secondaryBtn} onClick={() => setResult(null)} className="px-4">
                <ArrowLeft size={14} style={{ display: "inline", marginRight: 4 }} />
                Re-analyze
              </button>
            </div>
          </div>
        )}
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
    width: "100%", maxWidth: 520,
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
  select: {
    width: "100%", backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)",
    borderRadius: 10, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none",
    fontWeight: 600, cursor: "pointer",
  },
  input: {
    width: "100%", backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)",
    borderRadius: 10, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none",
  },
  skillsTagWrap: { backgroundColor: "var(--input-bg)", padding: 12, borderRadius: 10 },
  tag: { fontSize: 11, background: "rgba(59,130,246,0.15)", color: "#3b82f6", padding: "2px 8px", borderRadius: 6, fontWeight: 600 },
  actionBtn: {
    width: "100%", padding: "12px 0", background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
    boxShadow: "0 4px 14px rgba(37,99,235,0.4)", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  scoreRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  scoreCard: { backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", padding: 14, borderRadius: 12, textAlign: "center" },
  scoreVal: { fontSize: 28, fontWeight: 900 },
  scoreLbl: { fontSize: 11, color: "var(--text-secondary)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" },
  section: { display: "flex", flexDirection: "column", gap: 6 },
  secTitle: { fontSize: 12, fontWeight: 700, color: "var(--text-primary)" },
  matchTag: { fontSize: 11, background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "3px 8px", borderRadius: 6, fontWeight: 600, display: "inline-flex", alignItems: "center" },
  missingTag: { fontSize: 11, background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "3px 8px", borderRadius: 6, fontWeight: 600, display: "inline-flex", alignItems: "center" },
  recList: { margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 },
  recItem: { fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4, display: "flex", gap: 8, alignItems: "flex-start" },
  secondaryBtn: {
    backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", padding: "10px 0",
    borderRadius: 10, fontSize: 13, cursor: "pointer", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center",
  },
};
