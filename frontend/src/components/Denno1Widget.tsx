import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, X, Send, Sparkles, Copy, Check, RotateCcw,
  Maximize2, Minimize2, Briefcase, FileText, Mic,
  GraduationCap, ArrowRight, History, Plus, Trash2,
  ChevronLeft, AlertCircle, Volume2, VolumeX, Download,
  Zap, Target, Compass, PlayCircle, DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { aiService, type ChatMessage, type ChatSession } from "../services/ai.service";
import { useChatSessions, useDeleteChatSession, useCreateChatSession } from "../hooks/useAI";
import { useCreateGoal } from "../hooks/useGoals";

/** Enhanced Markdown & 1-Click Action Cards renderer */
function MarkdownText({ text, onActionNavigate, onCreateGoal }: { text: string; onActionNavigate: (path: string) => void; onCreateGoal: (label: string, target: number) => void }) {
  const lines = text.split("\n");
  const [createdGoalLabels, setCreatedGoalLabels] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, i) => {
        // Parse 1-Click Action Tags
        if (line.startsWith("[ACTION:")) {
          const actionStr = line.slice(8, -1);
          const parts = actionStr.split("|");
          const type = parts[0];
          const params: Record<string, string> = {};
          parts.slice(1).forEach((p) => {
            const [k, v] = p.split("=");
            if (k && v) params[k] = v;
          });

          if (type === "MOCK_INTERVIEW") {
            return (
              <div key={i} className="my-2 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <PlayCircle size={18} className="text-amber-300 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold m-0">AI Mock STAR Practice</div>
                    <div className="text-[10px] text-blue-100">Dynamic question bank &amp; real-time STAR response coach</div>
                  </div>
                </div>
                <button
                  onClick={() => onActionNavigate("/interviews")}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs shrink-0 transition-transform active:scale-95 shadow-sm"
                >
                  Start Practice
                </button>
              </div>
            );
          }

          if (type === "CREATE_GOAL") {
            const label = params.label || "Target Applications";
            const target = parseInt(params.target || "5") || 5;
            const isDone = createdGoalLabels[label];

            return (
              <div key={i} className="my-2 p-3 rounded-xl bg-slate-900 text-slate-100 border border-slate-700 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">{label}</div>
                    <div className="text-[10px] text-slate-400">Target count: {target} items</div>
                  </div>
                </div>
                <button
                  disabled={isDone}
                  onClick={() => {
                    onCreateGoal(label, target);
                    setCreatedGoalLabels((prev) => ({ ...prev, [label]: true }));
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    isDone
                      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default"
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm"
                  }`}
                >
                  {isDone ? "✓ Goal Added" : "+ 1-Click Goal"}
                </button>
              </div>
            );
          }

          if (type === "NAVIGATE") {
            const path = params.path || "/";
            const label = params.label || "Open Module";

            return (
              <div key={i} className="my-1.5">
                <button
                  onClick={() => onActionNavigate(path)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.01]"
                >
                  <Zap size={13} className="text-amber-300" />
                  <span>{label}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            );
          }

          return null;
        }

        if (line.startsWith("## ")) {
          return (
            <div key={i} className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mt-2 mb-0.5 uppercase tracking-wide">
              {renderInline(line.slice(3))}
            </div>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <div key={i} className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1.5">
              {renderInline(line.slice(4))}
            </div>
          );
        }
        if (line.startsWith("| ") && line.endsWith(" |")) {
          const cells = line.split("|").filter((c) => c.trim());
          return (
            <div key={i} className="flex gap-2 text-[11px] font-mono bg-slate-50 dark:bg-slate-800 rounded px-2 py-0.5">
              {cells.map((c, j) => <span key={j} className="flex-1">{c.trim()}</span>)}
            </div>
          );
        }
        if (line.startsWith("|---")) return null;
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-1.5 text-xs">
              <span className="text-blue-500 font-bold mt-0.5 shrink-0">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const [num, ...rest] = line.split(/\.\s/);
          return (
            <div key={i} className="flex gap-1.5 text-xs">
              <span className="text-blue-500 font-bold shrink-0">{num}.</span>
              <span>{renderInline(rest.join(". "))}</span>
            </div>
          );
        }
        if (line === "---") {
          return <hr key={i} className="border-slate-200 dark:border-slate-700 my-1" />;
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <div key={i} className="text-xs">{renderInline(line)}</div>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-slate-100 dark:bg-slate-700 text-blue-700 dark:text-blue-300 px-1 rounded text-[10px] font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// ─── Quick Prompts ────────────────────────────────────────────────────────────

type CategoryTab = "career" | "cv" | "interview" | "salary" | "automations";

const TAB_CONFIG: { id: CategoryTab; label: string; icon: any; prompts: string[] }[] = [
  {
    id: "career",
    label: "Career",
    icon: Briefcase,
    prompts: ["What should I do today?", "Recommended daily habits", "How to track application momentum"],
  },
  {
    id: "cv",
    label: "CV & ATS",
    icon: FileText,
    prompts: ["How to increase my CV ATS score?", "Quantifiable metrics examples for CV", "Tailor CV summary for Backend Engineer"],
  },
  {
    id: "interview",
    label: "STAR & Mock",
    icon: Mic,
    prompts: ["Explain STAR response framework", "Launch AI STAR Mock Interview", "Top behavioral questions"],
  },
  {
    id: "salary",
    label: "Salary & Market",
    icon: DollarSign,
    prompts: ["Salary for Senior SWE in Kenya & USD", "How to negotiate remote salary", "High-demand tech stack in 2026"],
  },
  {
    id: "automations",
    label: "Automations",
    icon: Zap,
    prompts: ["Draft recruiter outreach email", "1-Click Cover Letter Studio", "Skill Gap Heatmap analysis"],
  },
];

// ─── Initial message ──────────────────────────────────────────────────────────

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "## Welcome to Denno1 AI\n\nI'm your **personal career intelligence assistant**. I have live access to your applications, CV scores, goals, and interview pipeline.\n\nAsk me anything:\n- **Salary benchmarks** in KES/USD\n- **Interview STAR frameworks & Mock Simulator**\n- **CV & ATS optimization tips**\n- **Cold recruiter email drafts**\n\n[ACTION:MOCK_INTERVIEW]",
};

// ─── Widget ───────────────────────────────────────────────────────────────────

export default function Denno1Widget() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<CategoryTab>("career");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | undefined>();

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: sessions, refetch: refetchSessions } = useChatSessions();
  const deleteSession = useDeleteChatSession();
  const createGoal = useCreateGoal();
  const createSession = useCreateChatSession();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || streaming) return;
      setInput("");
      setError(null);

      const userMessage: ChatMessage = { role: "user", content: msg, timestamp: new Date().toISOString() };
      const nextMessages: ChatMessage[] = [...messages, userMessage];
      setMessages(nextMessages);
      setStreamingText("");
      setStreaming(true);

      let accumulated = "";

      await aiService.streamChat(
        nextMessages.map(({ role, content }) => ({ role, content })),
        currentSessionId,
        (delta) => {
          accumulated += delta;
          setStreamingText(accumulated);
        },
        (fullText, sessionId) => {
          setStreaming(false);
          setStreamingText("");
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullText, timestamp: new Date().toISOString() },
          ]);
          if (sessionId && !currentSessionId) {
            setCurrentSessionId(sessionId);
          }
          refetchSessions();
        },
        (err) => {
          setStreaming(false);
          setStreamingText("");
          setError("Connection issue — is the backend running?");
          console.error("AI stream error:", err);
        },
      );
    },
    [input, messages, streaming, currentSessionId, refetchSessions],
  );

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const resetChat = () => {
    setMessages([WELCOME]);
    setStreamingText("");
    setCurrentSessionId(undefined);
    setError(null);
  };

  const loadSession = async (session: ChatSession) => {
    try {
      const full = await aiService.getSession(session.id);
      setMessages(
        full.messages && full.messages.length > 0
          ? full.messages
          : [WELCOME],
      );
      setCurrentSessionId(session.id);
      setShowHistory(false);
    } catch (e) {
      console.error("Failed to load session", e);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteSession.mutate(id, {
      onSuccess: () => {
        if (currentSessionId === id) {
          resetChat();
        }
      },
    });
  };

  const currentTabObj = TAB_CONFIG.find((t) => t.id === activeTab) || TAB_CONFIG[0];

  const speakText = (text: string, index: number) => {
    if (!("speechSynthesis" in window)) return;
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/\[ACTION:[^\]]+\]/g, "").replace(/[\#\*\_\|]/g, " ");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const exportChat = () => {
    const mdContent = messages
      .map((m) => `### ${m.role === "user" ? "User" : "Denno1 AI"}\n\n${m.content}\n\n---`)
      .join("\n\n");
    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `denno1-chat-transcript-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleActionNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const handleCreateGoalAction = (label: string, target: number) => {
    createGoal.mutate({ label, category: "Applications", target, current: 0 });
  };

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div
          className={`fixed right-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col z-[999] transition-all duration-200 ${
            expanded
              ? "bottom-6 w-[520px] h-[720px]"
              : "bottom-24 w-[400px] h-[560px]"
          }`}
        >
          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-t-2xl px-4 py-3 flex items-center justify-between border-b border-slate-700/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-900/40">
                <Bot size={17} />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Denno1 Assistant</span>
                  <Sparkles size={12} className="text-amber-400" />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  {currentSessionId ? `Session #${currentSessionId}` : "Context-Aware AI"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={exportChat}
                title="Export Transcript to Markdown"
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Download size={14} />
              </button>
              <button
                onClick={() => setShowHistory((h) => !h)}
                title="Chat History"
                className={`text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors ${showHistory ? "bg-slate-700 text-white" : ""}`}
              >
                <History size={14} />
              </button>
              <button
                onClick={resetChat}
                title="New Chat"
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Plus size={15} />
              </button>
              <button
                onClick={() => setExpanded((e) => !e)}
                title={expanded ? "Minimize" : "Expand"}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── History Sidebar ── */}
          {showHistory && (
            <div className="absolute inset-0 z-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Chat History</span>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <button
                  onClick={resetChat}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                >
                  <Plus size={14} /> New Conversation
                </button>
                {(sessions ?? []).length === 0 && (
                  <div className="text-center text-slate-400 text-xs py-8">No past conversations yet.</div>
                )}
                {(sessions ?? []).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => loadSession(s)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs border transition-colors ${
                      currentSessionId === s.id
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold"
                        : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{s.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {s.message_count} msg · {new Date(s.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 transition-all ml-2 shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Category Tabs ── */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1 overflow-x-auto shrink-0">
            {TAB_CONFIG.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={12} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Error Banner ── */}
          {error && (
            <div className="mx-3 mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-xs text-red-700 dark:text-red-300 font-semibold shrink-0">
              <AlertCircle size={13} className="shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                <X size={12} />
              </button>
            </div>
          )}

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`relative group max-w-[90%] px-3.5 py-2.5 rounded-2xl ${
                    m.role === "user"
                      ? "bg-blue-600 text-white text-xs font-medium shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 w-full"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <MarkdownText
                      text={m.content}
                      onActionNavigate={handleActionNavigate}
                      onCreateGoal={handleCreateGoalAction}
                    />
                  ) : (
                    <span className="text-xs">{m.content}</span>
                  )}

                  {m.role === "assistant" && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 p-0.5 rounded-md border border-slate-200 dark:border-slate-700 transition-opacity">
                      <button
                        onClick={() => speakText(m.content, i)}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title={speakingIndex === i ? "Stop Audio" : "Read Aloud (Voice)"}
                      >
                        {speakingIndex === i ? <VolumeX size={11} className="text-rose-500 animate-pulse" /> : <Volume2 size={11} />}
                      </button>
                      <button
                        onClick={() => copyText(m.content, i)}
                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Copy text"
                      >
                        {copiedIndex === i ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick navigation shortcuts after last assistant message */}
                {m.role === "assistant" && i === messages.length - 1 && !streaming && (
                  <div className="flex flex-wrap gap-1 mt-1.5 ml-1">
                    {[
                      { label: "Cover Letter AI", to: "/cover-letter", color: "blue" },
                      { label: "Courses Catalog", to: "/learning", color: "emerald" },
                      { label: "Set Career Goal", to: "/goals", color: "amber" },
                    ].map((btn) => (
                      <button
                        key={btn.to}
                        onClick={() => { setOpen(false); navigate(btn.to); }}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors text-${btn.color}-600 dark:text-${btn.color}-400 bg-${btn.color}-50 dark:bg-${btn.color}-950/40 border-${btn.color}-200/50 dark:border-${btn.color}-800/50 hover:bg-${btn.color}-100`}
                      >
                        <span>{btn.label}</span>
                        <ArrowRight size={10} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Streaming text bubble */}
            {streaming && (
              <div className="flex flex-col items-start">
                <div className="max-w-[90%] px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 w-full">
                  {streamingText ? (
                    <MarkdownText
                      text={streamingText}
                      onActionNavigate={handleActionNavigate}
                      onCreateGoal={handleCreateGoalAction}
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Sparkles size={13} className="animate-spin text-blue-500" />
                      <span>Denno1 is thinking…</span>
                    </div>
                  )}
                  {/* Blinking cursor */}
                  {streamingText && (
                    <span className="inline-block w-0.5 h-3 bg-blue-500 ml-0.5 animate-pulse" />
                  )}
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* ── Quick Prompts ── */}
          <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/60 shrink-0">
            {currentTabObj.prompts.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={streaming}
                className="text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1 whitespace-nowrap shrink-0 transition-colors font-medium disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>

          {/* ── Input ── */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0 bg-white dark:bg-slate-900 rounded-b-2xl">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={`Ask about ${currentTabObj.label.toLowerCase()}…`}
              disabled={streaming}
              className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-slate-400 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={streaming || !input.trim()}
              className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 shrink-0 hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              {streaming ? (
                <Sparkles size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Toggle Button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-xl shadow-blue-900/40 flex items-center justify-center z-[998] transition-all hover:scale-105 active:scale-95"
        title="Denno1 AI Assistant"
      >
        {open ? <X size={22} /> : <Bot size={24} />}
      </button>
    </>
  );
}
