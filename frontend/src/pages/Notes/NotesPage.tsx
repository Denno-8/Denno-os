import { useState } from "react";
import ApiErrorCard from "../../components/ApiErrorCard";
import {
  BookOpen, Search, Plus, Trash2, X, Sparkles, Award, ChevronDown, ChevronUp,
  Network, Shield, Server, Cpu, Monitor, HardDrive, Wifi
} from "lucide-react";
import { useNotes, useNoteCategories, useCreateNote, useDeleteNote } from "../../hooks/useNotes";
import { TOP_200_QUESTIONS, QUESTION_CATEGORY_GROUPS, type InterviewQuestionItem } from "../../data/interviewQuestions200";
import { IT_KNOWLEDGE_BASE, IT_CATEGORY_GROUPS, type ITKnowledgeItem } from "../../data/itNetworkingData";

type ViewMode = "all" | "top200" | "ittech";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "1. Help Desk & Desktop Support": Monitor,
  "2. Networking Fundamentals": Network,
  "3. Windows Server & AD": Server,
  "4. Hardware & Infrastructure": HardDrive,
  "5. IT Security & Compliance": Shield,
  "6. Cloud & Virtualisation": Cpu,
  "7. Certifications & Study Guide": Award,
  "8. Real-World Support Scenarios": Sparkles,
};

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Beginner:     { bg: "rgba(16,185,129,0.12)", text: "#059669", border: "rgba(16,185,129,0.3)" },
  Intermediate: { bg: "rgba(245,158,11,0.12)", text: "#d97706", border: "rgba(245,158,11,0.3)" },
  Advanced:     { bg: "rgba(239,68,68,0.12)",  text: "#dc2626", border: "rgba(239,68,68,0.3)"  },
  Expert:       { bg: "rgba(139,92,246,0.12)", text: "#7c3aed", border: "rgba(139,92,246,0.3)" },
};

const JOBTYPE_COLORS: Record<string, string> = {
  "IT Support":  "#2563eb",
  "Networking":  "#0891b2",
  "Sysadmin":    "#7c3aed",
  "Security":    "#dc2626",
  "Cloud":       "#0284c7",
  "General IT":  "#64748b",
};

export default function NotesPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [expandedQId, setExpandedQId] = useState<number | null>(null);
  const [expandedITId, setExpandedITId] = useState<number | null>(null);
  const [itCategory, setITCategory] = useState("All");

  const { data: notes, isLoading, isError, refetch } = useNotes(
    category === "Top 200 Questions" ? "All" : category, q
  );
  const { data: categories } = useNoteCategories();
  const deleteNote = useDeleteNote();
  const [showAdd, setShowAdd] = useState(false);

  if (isLoading) return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading notes &amp; knowledge base…</div>;
  if (isError) return <ApiErrorCard onRetry={refetch} />;

  /* ── Filter Top 200 Questions ── */
  const filteredTop200 = TOP_200_QUESTIONS.filter((item) => {
    if (category !== "All" && category !== "Top 200 Questions") {
      if (!item.category.toLowerCase().includes(category.toLowerCase())) return false;
    }
    if (q.trim()) {
      const term = q.toLowerCase();
      return (
        item.question.toLowerCase().includes(term) ||
        item.answer.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    }
    return true;
  });

  /* ── Filter IT Knowledge Base ── */
  const filteredIT = IT_KNOWLEDGE_BASE.filter((item) => {
    const matchCat = itCategory === "All" || item.category === itCategory;
    if (!matchCat) return false;
    if (q.trim()) {
      const term = q.toLowerCase();
      return (
        item.question.toLowerCase().includes(term) ||
        item.answer.toLowerCase().includes(term) ||
        item.subcategory.toLowerCase().includes(term) ||
        item.tags.some((t) => t.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const itCategories = IT_CATEGORY_GROUPS.map((g) => g.title);

  return (
    <div className="p-2 space-y-6">
      {/* ── Top Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-transparent p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
            <Sparkles size={13} /> Document &amp; Knowledge Repository
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Knowledge Base &amp; Notes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {(notes ?? []).length} custom notes · Top 200 Coding Questions · {IT_KNOWLEDGE_BASE.length} IT/Networking entries
          </p>
        </div>

        {/* ── View Mode Toggle ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* IT Technician / Networking button */}
          <button
            onClick={() => setViewMode("ittech")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              viewMode === "ittech"
                ? "bg-cyan-600 text-white border-cyan-600 shadow-md"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Network size={14} />
            <span>IT &amp; Networking</span>
          </button>
          <button
            onClick={() => setViewMode("top200")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              viewMode === "top200"
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Award size={14} />
            <span>Top 200 Questions</span>
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              viewMode === "all"
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <BookOpen size={14} />
            <span>Custom Notes</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 shadow-md transition-all hover:scale-[1.02]"
          >
            <Plus size={15} />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px] relative flex items-center">
          <Search size={16} className="absolute left-3.5 text-slate-400" />
          <input
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 shadow-sm"
            placeholder={
              viewMode === "ittech"
                ? "Search networking, VLAN, DNS, troubleshooting, certifications…"
                : "Search notes, Top 200 questions, algorithms, SQL, system design…"
            }
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Category filter changes per view */}
        {viewMode === "ittech" ? (
          <select
            value={itCategory}
            onChange={(e) => setITCategory(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none shadow-sm font-medium"
          >
            <option value="All">All IT Categories</option>
            {itCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        ) : viewMode === "top200" ? (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none shadow-sm font-medium"
          >
            <option value="All">All Categories</option>
            <option value="Top 200 Questions">Top 200 Coding Questions</option>
            <option value="Fundamentals">Programming Fundamentals</option>
            <option value="OOP">Object-Oriented Programming</option>
            <option value="Data Structures">Data Structures</option>
            <option value="Algorithms">Algorithms</option>
            <option value="Database">Database &amp; SQL</option>
            <option value="System Design">System Design &amp; CS</option>
          </select>
        ) : (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none shadow-sm font-medium"
          >
            <option value="All">All Categories</option>
            {(categories ?? []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* VIEW: IT TECHNICIAN & NETWORKING KNOWLEDGE BASE            */}
      {/* ══════════════════════════════════════════════════════════ */}
      {viewMode === "ittech" && (
        <div className="space-y-5">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {IT_CATEGORY_GROUPS.map((grp) => {
              const CatIcon = CATEGORY_ICONS[grp.title] ?? Network;
              const isActive = itCategory === grp.title;
              return (
                <button
                  key={grp.id}
                  onClick={() => setITCategory(isActive ? "All" : grp.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all"
                  style={{
                    background: isActive ? "rgba(8,145,178,0.15)" : "var(--bg-card, #fff)",
                    borderColor: isActive ? "#0891b2" : "var(--border-color, #e2e8f0)",
                    color: isActive ? "#0891b2" : "var(--text-secondary, #64748b)",
                  }}
                >
                  <CatIcon size={12} />
                  {grp.icon} {grp.title.split(". ")[1]}
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full px-1.5 py-0 text-[10px]">
                    {IT_KNOWLEDGE_BASE.filter((i) => i.category === grp.title).length}
                  </span>
                </button>
              );
            })}
            {itCategory !== "All" && (
              <button
                onClick={() => setITCategory("All")}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <X size={11} /> Clear filter
              </button>
            )}
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              IT Technician &amp; Networking Knowledge Base ({filteredIT.length} entries)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredIT.map((item: ITKnowledgeItem) => {
              const isExpanded = expandedITId === item.id;
              const diffStyle = DIFFICULTY_STYLES[item.difficulty] ?? DIFFICULTY_STYLES.Intermediate;
              const CatIcon = CATEGORY_ICONS[item.category] ?? Network;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-[11px] font-bold rounded-md px-2 py-0.5 border inline-flex items-center gap-1"
                        style={{ background: "rgba(8,145,178,0.1)", color: "#0891b2", borderColor: "rgba(8,145,178,0.25)" }}
                      >
                        <CatIcon size={11} />
                        IT-{item.id}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {item.subcategory}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0"
                      style={diffStyle}
                    >
                      {item.difficulty}
                    </span>
                  </div>

                  {/* Question */}
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 leading-snug">
                    {item.question}
                  </h4>

                  {/* Answer */}
                  <pre
                    className={`text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-3 leading-relaxed whitespace-pre-wrap font-sans ${!isExpanded ? "line-clamp-4" : ""}`}
                  >
                    {item.answer}
                  </pre>

                  {/* Code Snippet */}
                  {isExpanded && item.codeSnippet && (
                    <div className="bg-slate-900 text-green-400 p-3 rounded-xl font-mono text-[11px] mb-3 border border-slate-800 overflow-x-auto">
                      <pre className="m-0 whitespace-pre-wrap">{item.codeSnippet}</pre>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <div className="flex gap-1 flex-wrap">
                      {item.jobTypes.map((jt) => (
                        <span
                          key={jt}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: `${JOBTYPE_COLORS[jt] ?? "#64748b"}18`,
                            color: JOBTYPE_COLORS[jt] ?? "#64748b",
                          }}
                        >
                          #{jt}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setExpandedITId(isExpanded ? null : item.id)}
                      className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
                    >
                      <span>{isExpanded ? "Show Less" : "Read Full Answer"}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredIT.length === 0 && (
              <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-14 text-center text-sm text-slate-400">
                <Network size={32} className="mx-auto mb-2 opacity-30" />
                No IT entries match your search. Try a different term or clear the filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* VIEW: TOP 200 CODING QUESTIONS                             */}
      {/* ══════════════════════════════════════════════════════════ */}
      {viewMode === "top200" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Top 200 Interview Questions Reference ({filteredTop200.length} items)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTop200.map((item: InterviewQuestionItem) => {
              const isExpanded = expandedQId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-md px-2 py-0.5 border border-blue-200 dark:border-blue-800">
                          Q{item.id}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {item.category.split(". ")[1]}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {item.difficulty}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {item.question}
                    </h4>

                    <p className={`text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-3 leading-relaxed whitespace-pre-wrap ${!isExpanded ? "line-clamp-3" : ""}`}>
                      {item.answer}
                    </p>

                    {isExpanded && item.codeSnippet && (
                      <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] mb-3 border border-slate-800 overflow-x-auto">
                        <pre className="m-0 whitespace-pre-wrap">{item.codeSnippet}</pre>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-1 flex-wrap">
                      {item.jobTypes.map((jt) => (
                        <span key={jt} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-1.5 py-0.5 rounded">
                          #{jt}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setExpandedQId(isExpanded ? null : item.id)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>{isExpanded ? "Show Less" : "Read Full Solution"}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* VIEW: CUSTOM NOTES                                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {viewMode === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(notes ?? []).map((n) => (
            <div key={n.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full px-2.5 py-0.5 border border-blue-200 dark:border-blue-800">
                    {n.category}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">{n.title}</h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-3 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {n.body}
                </p>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-1.5 flex-wrap">
                  {n.tags.map((t) => (
                    <span key={t} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg px-2 py-0.5 font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => deleteNote.mutate(n.id)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {(notes ?? []).length === 0 && (
            <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-14 text-center text-sm text-slate-400 dark:text-slate-500 shadow-sm">
              <BookOpen size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              No custom notes found. Switch to the "IT &amp; Networking" tab to explore the full knowledge base.
            </div>
          )}
        </div>
      )}

      {showAdd && <AddNoteModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddNoteModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("IT Support");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const createNote = useCreateNote();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Add Knowledge Note</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <optgroup label="IT Technician & Support">
              <option>IT Support</option>
              <option>Help Desk</option>
              <option>Desktop Support</option>
              <option>Asset Management</option>
            </optgroup>
            <optgroup label="Networking">
              <option>Networking</option>
              <option>Cisco / Routing</option>
              <option>Wireless</option>
              <option>Firewall / Security</option>
              <option>VPN</option>
            </optgroup>
            <optgroup label="Systems">
              <option>Windows Server</option>
              <option>Active Directory</option>
              <option>Linux</option>
              <option>PowerShell</option>
            </optgroup>
            <optgroup label="Cloud & Security">
              <option>Azure</option>
              <option>AWS</option>
              <option>Microsoft 365</option>
              <option>Cybersecurity</option>
            </optgroup>
            <optgroup label="General">
              <option>Notes</option>
              <option>Certifications</option>
              <option>Study Notes</option>
              <option>Other</option>
            </optgroup>
          </select>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-500">Note Content (Markdown supported)</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                className={`px-2 py-0.5 rounded ${!isPreview ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-500"}`}
              >
                Edit Raw
              </button>
              <button
                type="button"
                onClick={() => setIsPreview(true)}
                className={`px-2 py-0.5 rounded ${isPreview ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-500"}`}
              >
                Preview
              </button>
            </div>
          </div>

          {!isPreview ? (
            <textarea
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 resize-none font-mono"
              rows={6}
              placeholder="CLI commands, network diagrams, config snippets, troubleshooting steps…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          ) : (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[140px] max-h-48 overflow-y-auto text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">
              {body ? body : <span className="text-slate-400 italic">No content to preview</span>}
            </div>
          )}

          <input
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400"
            placeholder="Tags (comma-separated, e.g. cisco, vlan, ospf, troubleshooting)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            disabled={!title.trim()}
            onClick={() =>
              createNote.mutate(
                { title, category, body, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) },
                { onSuccess: onClose }
              )
            }
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
          >
            Save Note
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
