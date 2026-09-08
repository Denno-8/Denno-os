import { useState, useRef } from "react";
import ApiErrorCard from "../../components/ApiErrorCard";
import { FileText, Plus, Target, Trash2, Zap, X, Check, Upload, Sparkles, Layers, Download, AlertTriangle, FileCode, Edit3, Save } from "lucide-react";
import { useCVVersions, useCreateCV, useUpdateCV, useDeleteCV } from "../../hooks/useCV";
import CVMatchModal from "../../components/CVMatchModal";
import TailoringDiffModal from "../../components/TailoringDiffModal";
import CVDiffModal from "../../components/CVDiffModal";
import CVStyledPreview from "../../components/CVStyledPreview";
import StructuredCVEditor from "../../components/StructuredCVEditor";
import { cvService } from "../../services/cv.service";
import { api } from "../../services/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export default function CVPage() {
  const { data: cvs, isLoading, isError, refetch } = useCVVersions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);

  const [newSkill, setNewSkill] = useState("");
  const [uploading, setUploading] = useState(false);
  const [atsAnalysis, setAtsAnalysis] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Inline edit state ──
  const [isEditing, setIsEditing] = useState(false);
  const [cvEditorMode, setCvEditorMode] = useState<"structured" | "raw">("structured");
  const [editName, setEditName] = useState("");
  const [editFocus, setEditFocus] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const updateCV = useUpdateCV();
  const deleteCV = useDeleteCV();

  // These MUST be declared before any early returns
  const [selectedTheme, setSelectedTheme] = useState<string>("Sapphire");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [downloadingOriginal, setDownloadingOriginal] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [previewViewMode, setPreviewViewMode] = useState<"styled" | "raw">("styled");

  if (isLoading) return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading CV versions…</div>;
  if (isError) return <ApiErrorCard onRetry={refetch} />;

  const list = cvs ?? [];
  const selected = list.find((c) => c.id === selectedId) ?? list[0] ?? null;

  const addSkill = () => {
    if (!selected || !newSkill.trim()) return;
    const currentSkills = selected.skills ?? [];
    updateCV.mutate({ id: selected.id, patch: { skills: [...currentSkills, newSkill.trim()] } });
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    if (!selected) return;
    const currentSkills = selected.skills ?? [];
    updateCV.mutate({ id: selected.id, patch: { skills: currentSkills.filter((s) => s !== skill) } });
  };

  const startEdit = () => {
    if (!selected) return;
    setEditName(selected.name);
    setEditFocus(selected.focus ?? "");
    setEditContent(selected.parsed_content ?? "");
    setIsEditing(true);
    setCvEditorMode("structured");
    setSaveMsg(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSaveMsg(null);
  };

  const saveEdit = () => {
    if (!selected) return;
    const patch: { name?: string; focus?: string; parsed_content?: string } = {};
    if (editName.trim() && editName.trim() !== selected.name) patch.name = editName.trim();
    if (editFocus.trim() !== (selected.focus ?? "")) patch.focus = editFocus.trim();
    if (editContent !== (selected.parsed_content ?? "")) patch.parsed_content = editContent;
    if (Object.keys(patch).length === 0) {
      setIsEditing(false);
      return;
    }
    updateCV.mutate(
      { id: selected.id, patch },
      {
        onSuccess: () => {
          setIsEditing(false);
          setSaveMsg("Changes saved successfully.");
          setTimeout(() => setSaveMsg(null), 3000);
          refetch();
        },
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = sessionStorage.getItem("denno_access_token");
      const res = await fetch(`${API_URL}/cv/${selected.id}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        refetch();
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRunRealATS = async () => {
    if (!selected) return;
    try {
      const res = await api.post<any>(`/cv/${selected.id}/analyze`, {});
      setAtsAnalysis(res);
      refetch();
    } catch (e) {
      console.error(e);
    }
  };


  const handleDownloadPDF = async () => {
    if (!selected) return;
    setExportingPdf(true);
    setDownloadError(null);
    try {
      await cvService.exportPDF(selected.id, selectedTheme, selected.name);
    } catch (err: any) {
      console.error("Error exporting PDF", err);
      setDownloadError(err?.message || "Failed to export PDF file.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadOriginal = async () => {
    if (!selected) return;
    setDownloadingOriginal(true);
    setDownloadError(null);
    try {
      const ext = selected.file_url?.split(".")?.pop() ?? "txt";
      const filename = `${selected.name.replace(/\s+/g, "_")}_original.${ext}`;
      await cvService.downloadRaw(selected.id, filename);
    } catch (err: any) {
      console.error("Error downloading raw file", err);
      setDownloadError(err?.message || "Failed to download original document.");
    } finally {
      setDownloadingOriginal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div style={styles.banner}>
        <div>
          <div style={styles.badge}>Document Intelligence Pipeline</div>
          <h2 style={styles.heading}>CV & Resume Version Manager</h2>
          <p style={styles.subHeading}>
            {list.length} active CV versions with PDF/DOCX parsing, AI tailoring diffs, and real ATS scoring.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {list.length >= 2 && (
            <button
              onClick={() => setShowDiffModal(true)}
              className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
            >
              <Layers size={15} /> Compare Versions
            </button>
          )}
          <button style={styles.addBtn} onClick={() => setShowAdd(true)}>
            <Plus size={16} />
            <span>Create New Version</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-5">
        {/* CV Versions List */}
        <div className="flex flex-col gap-2">
          {list.map((cv) => (
            <div
              key={cv.id}
              onClick={() => setSelectedId(cv.id)}
              style={{
                ...styles.cvItem,
                ...(selected?.id === cv.id ? styles.cvItemActive : {}),
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div style={styles.cvName}>{cv.name}</div>
                  <div style={styles.cvFocus}>{cv.focus || "General Profile"}</div>
                </div>
                <span style={styles.scoreTag}>{(cv.ats_score ?? 0) > 0 ? `${cv.ats_score}% ATS` : "Draft"}</span>
              </div>
              <div style={styles.cvMeta}>
                {(cv.times_used ?? 0) > 0 ? `Used in ${cv.times_used} applications` : "Not used in applications yet"}
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div style={styles.emptyState}>No CV versions created yet.</div>
          )}
        </div>

        {/* Selected CV Details */}
        <div style={styles.detailPanel} className="space-y-6">
          {selected ? (
            <>
              {/* Header Actions */}
              <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                {/* Title row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="CV Version Name"
                          className="w-full bg-white dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-500 text-slate-900 dark:text-white font-bold text-sm rounded-xl px-3 py-2 outline-none"
                        />
                        <input
                          value={editFocus}
                          onChange={(e) => setEditFocus(e.target.value)}
                          placeholder="Focus Area (e.g. Cloud Architecture)"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs rounded-xl px-3 py-2 outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0">{selected.name}</h3>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                          Target Focus: {selected.focus || "General"}
                        </div>
                      </>
                    )}
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveEdit}
                          disabled={updateCV.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                        >
                          <Save size={14} /> {updateCV.isPending ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-colors"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={startEdit}
                        className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
                      >
                        <Edit3 size={14} /> Edit CV Details
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Upload size={14} /> {uploading ? "Parsing..." : "Upload File"}
                    </button>

                    <button
                      onClick={() => setShowTailorModal(true)}
                      className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
                    >
                      <Sparkles size={14} /> Tailor for Job
                    </button>

                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer outline-none"
                      title="Select PDF Accent Theme"
                    >
                      <option value="Sapphire">Theme: Sapphire</option>
                      <option value="Emerald">Theme: Emerald</option>
                      <option value="Obsidian">Theme: Obsidian</option>
                      <option value="Violet">Theme: Violet</option>
                      <option value="Crimson">Theme: Crimson</option>
                    </select>

                    <button
                      disabled={exportingPdf}
                      onClick={handleDownloadPDF}
                      className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      <Download size={14} /> {exportingPdf ? "Exporting PDF..." : "Export PDF"}
                    </button>

                    <button
                      disabled={downloadingOriginal}
                      onClick={handleDownloadOriginal}
                      className="bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-violet-100 transition-colors disabled:opacity-50"
                    >
                      <FileCode size={14} /> {downloadingOriginal ? "Downloading..." : "Download Original"}
                    </button>

                    <button
                      onClick={() => deleteCV.mutate(selected.id, { onSuccess: () => setSelectedId(null) })}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                {/* Save success message */}
                {saveMsg && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
                    <Check size={14} /> {saveMsg}
                  </div>
                )}

                {/* Inline editable content section */}
                {isEditing && (
                  <div className="space-y-3">
                    {/* Editor mode toggle */}
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">CV Content</label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        {(["structured", "raw"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setCvEditorMode(m)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              cvEditorMode === m
                                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                            }`}
                          >
                          {m === "structured" ? <><FileText size={11} /> Section Editor</> : <><FileCode size={11} /> Raw Text</>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {cvEditorMode === "structured" ? (
                      <StructuredCVEditor
                        content={editContent}
                        onChange={(full) => setEditContent(full)}
                        isSaving={updateCV.isPending}
                        showToolbar={false}
                      />
                    ) : (
                      <>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={14}
                          placeholder="Paste or type the full text of your CV here…"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-xs font-mono leading-relaxed rounded-xl px-4 py-3 outline-none resize-y focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
                        />
                        <p className="text-[11px] text-slate-400">Editing this will update what recruiters see in your exported PDF. Skills will be re-extracted on the next ATS analysis run.</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {downloadError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{downloadError}</span>
                  </div>
                  <button onClick={() => setDownloadError(null)} className="text-rose-500 hover:text-rose-700 font-bold text-sm">×</button>
                </div>
              )}

              {/* Skills section */}
              <div>
                <label style={styles.label}>Associated Skills &amp; Extracted Keywords ({(selected.skills ?? []).length})</label>
                <div className="flex flex-wrap gap-1.5 my-2">
                  {(selected.skills ?? []).map((s) => (
                    <span key={s} style={styles.skillTag}>
                      <span>{s}</span>
                      <button onClick={() => removeSkill(s)} style={styles.removeTagBtn}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {(selected.skills ?? []).length === 0 && (
                    <span className="text-xs text-slate-400">No skills extracted yet. Upload a PDF or add skills manually below.</span>
                  )}
                </div>

                <div className="flex gap-2 max-w-md mt-3">
                  <input
                    style={styles.input}
                    placeholder="Add new skill (e.g. AWS, Docker, GraphQL)…"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  />
                  <button onClick={addSkill} style={styles.addSkillBtn}>Add</button>
                </div>
              </div>

              {/* Parsed content viewer (when not editing) */}
              {!isEditing && selected.parsed_content && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      CV Content Preview
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setPreviewViewMode("styled")}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            previewViewMode === "styled"
                              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          Styled View
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewViewMode("raw")}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            previewViewMode === "raw"
                              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          Raw Text
                        </button>
                      </div>
                      <button
                        onClick={startEdit}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-xl"
                      >
                        <Edit3 size={11} /> Edit Text
                      </button>
                    </div>
                  </div>

                  {previewViewMode === "styled" ? (
                    <CVStyledPreview
                      content={selected.parsed_content}
                      name={selected.name}
                      focus={selected.focus}
                      skills={selected.skills}
                      atsScore={selected.ats_score}
                      themeColor={selectedTheme.toLowerCase()}
                    />
                  ) : (
                    <pre className="w-full bg-slate-950 text-slate-100 border border-slate-800 text-xs sm:text-sm font-semibold font-mono leading-relaxed rounded-xl px-4 py-3 whitespace-pre-wrap max-h-80 overflow-y-auto tracking-wide shadow-inner">
                      {selected.parsed_content}
                    </pre>
                  )}
                </div>
              )}

              {/* Real ATS Analysis Engine */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Multi-Criteria ATS Analysis Engine
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Evaluates keyword match %, section headers, formatting red flags, and quantified metrics.
                    </p>
                  </div>
                  <button onClick={handleRunRealATS} style={styles.boostBtn}>
                    <Zap size={14} /> Run Real ATS Analysis
                  </button>
                </div>

                {atsAnalysis && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-800 dark:text-slate-200">
                        ATS Score: <strong className="text-blue-600">{atsAnalysis.ats_score}%</strong> ({atsAnalysis.readability_rating})
                      </span>
                      <span className="text-slate-500">
                        Quantified Metrics: {atsAnalysis.quantified_metrics_count} detected
                      </span>
                    </div>

                    {atsAnalysis.red_flags.length > 0 && (
                      <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 flex items-start gap-2">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">Formatting Red Flags:</div>
                          {atsAnalysis.red_flags.map((rf: string, idx: number) => (
                            <div key={idx}>• {rf}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {atsAnalysis.optimization_tips.length > 0 && (
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">Optimization Suggestions:</div>
                        <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1">
                          {atsAnalysis.optimization_tips.map((tip: string, idx: number) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>
              Select a CV version on the left to edit skills and run match analysis.
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddCVModal onClose={() => setShowAdd(false)} />}
      {selected && (
        <TailoringDiffModal
          isOpen={showTailorModal}
          onClose={() => setShowTailorModal(false)}
          cvId={selected.id}
          cvName={selected.name}
          onApplyTailored={(skills, score, content) => {
            updateCV.mutate({ id: selected.id, patch: { skills, ats_score: score, parsed_content: content } });
            refetch();
          }}
        />
      )}
      {showDiffModal && (
        <CVDiffModal
          isOpen={showDiffModal}
          onClose={() => setShowDiffModal(false)}
          cvs={list}
        />
      )}
    </div>
  );
}

function AddCVModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  const createCV = useCreateCV();

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Create New CV Version</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
        <input style={modalStyles.input} placeholder="Version Name (e.g. Backend Lead CV)" value={name} onChange={(e) => setName(e.target.value)} />
        <input style={{ ...modalStyles.input, marginTop: 10 }} placeholder="Focus Area (e.g. Cloud Architecture)" value={focus} onChange={(e) => setFocus(e.target.value)} />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            disabled={!name.trim()}
            onClick={() => createCV.mutate({ name, focus }, { onSuccess: onClose })}
            style={{ ...modalStyles.btn, ...(!name.trim() ? modalStyles.disabled : {}) }}
          >
            Create Version
          </button>
          <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    background: "linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(29,78,216,0.05) 100%)",
    border: "1px solid rgba(59,130,246,0.25)", borderRadius: 20, padding: "24px 28px",
    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap",
  },
  badge: {
    display: "inline-block", fontSize: 11, fontWeight: 700, color: "#3b82f6",
    background: "rgba(59,130,246,0.15)", padding: "3px 10px", borderRadius: 99,
    marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em",
  },
  heading: { margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text-primary)" },
  subHeading: { margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" },
  addBtn: {
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none",
    borderRadius: 12, color: "#fff", padding: "10px 16px", fontWeight: 700,
    fontSize: 12, cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
    display: "flex", alignItems: "center", gap: 8,
  },
  cvItem: {
    backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)",
    borderRadius: 14, padding: 14, cursor: "pointer", transition: "all 0.2s",
  },
  cvItemActive: {
    backgroundColor: "rgba(59,130,246,0.12)", borderColor: "#3b82f6",
  },
  cvName: { fontSize: 14, fontWeight: 700, color: "var(--text-primary)" },
  cvFocus: { fontSize: 12, color: "var(--text-secondary)", marginTop: 2 },
  scoreTag: {
    fontSize: 10, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.15)",
    padding: "2px 6px", borderRadius: 6,
  },
  cvMeta: { fontSize: 11, color: "var(--text-muted)", marginTop: 8 },
  emptyState: { color: "var(--text-muted)", fontSize: 13, padding: 16 },
  detailPanel: {
    backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)",
    borderRadius: 20, padding: 28,
  },
  deleteBtn: {
    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
    color: "#ef4444", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6,
  },
  label: { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" },
  skillTag: {
    fontSize: 11, background: "rgba(59,130,246,0.15)", color: "#3b82f6", fontWeight: 600,
    padding: "3px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 6,
  },
  removeTagBtn: { background: "none", border: "none", color: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center" },
  input: {
    flex: 1, backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)",
    borderRadius: 10, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none",
  },
  addSkillBtn: {
    backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)",
    padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  boostBtn: {
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none",
    color: "#fff", padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6,
  },
};

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.6)", zIndex: 110,
    display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(4px)", padding: 16,
  },
  modal: {
    width: "100%", maxWidth: 400, backgroundColor: "var(--modal-bg)",
    border: "1px solid var(--border-color)", borderRadius: 20,
    padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
    color: "var(--text-primary)",
  },
  input: {
    width: "100%", backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)",
    borderRadius: 10, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none",
  },
  btn: {
    flex: 1, padding: "10px 0", background: "#2563eb", border: "none",
    borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
  },
  cancelBtn: {
    flex: 1, padding: "10px 0", backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)",
    borderRadius: 10, color: "var(--text-secondary)", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
};
