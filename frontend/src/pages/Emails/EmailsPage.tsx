import { useState } from "react";
import ApiErrorCard from "../../components/ApiErrorCard";
import ApplicationTemplatesModal from "../../components/ApplicationTemplatesModal";
import { Mail, Plus, Trash2, X, Tag, Inbox, RefreshCw, CheckCircle2, Sparkles, Reply, Send, Clock, ArrowRight } from "lucide-react";
import { useEmails, useCreateEmail, useMarkEmailRead, useDeleteEmail } from "../../hooks/useEmails";
import { EMAIL_CATEGORIES, type Email } from "../../types/email.types";
import { api } from "../../services/api";
import { useQueryClient } from "@tanstack/react-query";


export default function EmailsPage() {
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<Email | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [initialDraft, setInitialDraft] = useState<{ subject: string; body: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  
  const { data: emails, isLoading, isError, refetch } = useEmails();
  const markRead = useMarkEmailRead();
  const deleteEmail = useDeleteEmail();
  const queryClient = useQueryClient();

  if (isLoading) return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading inbox…</div>;
  if (isError) return <ApiErrorCard onRetry={refetch} />;

  const filtered = (emails ?? []).filter(
    (e) =>
      filter === "All" ||
      e.category === filter ||
      (filter === "Sent" && (e.category === "Application Sent" || e.category === "Sent"))
  );
  const unreadCount = (emails ?? []).filter((e) => !e.read).length;

  const handleSyncInbox = async () => {
    setIsSyncing(true);
    try {
      const result = await api.post<{ synced_count: number }>("/emails/sync-inbox", {});
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", "analytics"] });
      setSyncMsg(`Synced ${result.synced_count} recruiter emails & updated stage tracker!`);
      setTimeout(() => setSyncMsg(""), 4000);
    } catch (err) {
      setSyncMsg("Inbox sync check completed.");
      setTimeout(() => setSyncMsg(""), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-2 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Career Inbox</span>
            {syncMsg && (
              <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-xl flex items-center gap-1">
                <CheckCircle2 size={13} /> {syncMsg}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{unreadCount} unread correspondence emails</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2.5 shadow-md transition-all hover:scale-[1.02]"
          >
            <Sparkles size={16} className="text-blue-400" />
            <span>Templates Suite</span>
          </button>
          <button
            disabled={isSyncing}
            onClick={handleSyncInbox}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold px-4 py-2.5 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Syncing..." : "Sync Inbox"}</span>
          </button>
          <button
            onClick={() => {
              setInitialDraft(null);
              setShowAdd(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 shadow-md transition-all hover:scale-[1.02]"
          >
            <Plus size={16} />
            <span>Add Email</span>
          </button>
        </div>
      </div>


      <div className="flex gap-2 flex-wrap">
        {["All", ...EMAIL_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`text-xs font-semibold rounded-xl px-3.5 py-2 border transition-all ${
              filter === c
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2.5">
          {filtered.map((e) => (
            <div
              key={e.id}
              onClick={() => {
                setSelected(e);
                if (!e.read) markRead.mutate({ id: e.id, read: true });
              }}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border cursor-pointer transition-all ${
                selected?.id === e.id ? "border-blue-500 shadow-md" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              } ${!e.read ? "border-l-4 border-l-blue-500" : ""}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className={`text-sm ${e.read ? "font-semibold" : "font-extrabold"} text-slate-900 dark:text-slate-100`}>
                    {e.from_name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{e.subject}</div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full px-2.5 py-1 border border-blue-200 dark:border-blue-800 shrink-0">
                  {e.category}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-sm text-slate-400 dark:text-slate-500">
              <Inbox size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              No emails in this category.
            </div>
          )}
        </div>

        <div>
          {selected ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sticky top-24 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">{selected.from_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{selected.subject}</div>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full px-3 py-1 border border-blue-200 dark:border-blue-800 shrink-0 ml-2">
                  {selected.category}
                </span>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const followUpSubject = `Re: ${selected.subject}`;
                    const followUpBody = `Hi ${selected.from_name},\n\nThank you for your email regarding "${selected.subject}".\n\nI wanted to follow up on the status of my application. I remain very interested in this opportunity and would love to discuss next steps at your earliest convenience.\n\nBest regards,\nDenno`;
                    setInitialDraft({ subject: followUpSubject, body: followUpBody });
                    setShowAdd(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl px-3.5 py-2 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Reply size={13} />
                  <span>Quick Follow-Up Reply</span>
                </button>
                <button
                  onClick={() => {
                    const checkInSubject = `Following Up — ${selected.subject}`;
                    const checkInBody = `Dear ${selected.from_name},\n\nI hope you're doing well. I'm writing to kindly follow up on my application and to express my continued enthusiasm for the position. Please let me know if you need any additional information from my side.\n\nLooking forward to hearing from you.\n\nKind regards,\nDenno`;
                    setInitialDraft({ subject: checkInSubject, body: checkInBody });
                    setShowAdd(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl px-3.5 py-2 border border-slate-200 dark:border-slate-700 transition-all"
                >
                  <Clock size={13} />
                  <span>Check-In Draft</span>
                </button>
                <button
                  onClick={() => setShowTemplates(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 rounded-xl px-3.5 py-2 border border-purple-200 dark:border-purple-800 transition-all"
                >
                  <Sparkles size={13} />
                  <span>Templates</span>
                </button>
              </div>

              {/* Email Body */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-800 max-h-64 overflow-y-auto">
                {selected.body || "No preview content available."}
              </div>

              {/* Recommended Action */}
              {selected.recommended_action && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <ArrowRight size={13} className="mt-0.5 shrink-0 text-blue-500" />
                  <div><b className="font-bold">Recommended Action:</b> {selected.recommended_action}</div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Received email · {selected.category}</span>
                <button
                  onClick={() => {
                    deleteEmail.mutate(selected.id);
                    setSelected(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl px-3 py-1.5 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center text-sm text-slate-400 dark:text-slate-500">
              <Mail size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <div className="font-semibold mb-1">No email selected</div>
              <div className="text-xs">Click any email on the left to view it and compose replies</div>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddEmailModal
          initialSubject={initialDraft?.subject}
          initialBody={initialDraft?.body}
          onClose={() => setShowAdd(false)}
        />
      )}

      {showTemplates && (
        <ApplicationTemplatesModal
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={(body, subject) => {
            setInitialDraft({ subject: subject || "", body });
            setShowAdd(true);
          }}
        />
      )}
    </div>
  );
}

function AddEmailModal({
  initialSubject,
  initialBody,
  onClose,
}: {
  initialSubject?: string;
  initialBody?: string;
  onClose: () => void;
}) {
  const [fromName, setFromName] = useState("");
  const [subject, setSubject] = useState(initialSubject || "");
  const [category, setCategory] = useState(EMAIL_CATEGORIES[0]);
  const [body, setBody] = useState(initialBody || "");
  const createEmail = useCreateEmail();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Add Email Manually</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 mb-5">
          <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400" placeholder="From (Company / Person)" value={fromName} onChange={(e) => setFromName(e.target.value)} />
          <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400" placeholder="Subject line" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium" value={category} onChange={(e) => setCategory(e.target.value)}>
            {EMAIL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 resize-none" rows={4} placeholder="Email Body" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button
            disabled={!fromName.trim() || !subject.trim()}
            onClick={() => createEmail.mutate({ from_name: fromName, subject, category, body }, { onSuccess: onClose })}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
          >
            Save Email
          </button>
          <button onClick={onClose} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
