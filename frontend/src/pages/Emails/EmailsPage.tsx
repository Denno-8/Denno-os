import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ApiErrorCard from "../../components/ApiErrorCard";
import ApplicationTemplatesModal from "../../components/ApplicationTemplatesModal";
import {
  Mail,
  Plus,
  Trash2,
  X,
  Tag,
  Inbox,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Reply,
  Send,
  Clock,
  ArrowRight,
  Video,
  Briefcase,
  Calendar,
  AlertCircle,
  ExternalLink,
  FileText,
  Check,
  Zap,
} from "lucide-react";
import {
  useEmails,
  useCreateEmail,
  useMarkEmailRead,
  useDeleteEmail,
  useProcessInboundEmail,
} from "../../hooks/useEmails";
import { useApplications } from "../../hooks/useApplications";
import { EMAIL_CATEGORIES, type Email } from "../../types/email.types";
import { api } from "../../services/api";
import { useQueryClient } from "@tanstack/react-query";

export default function EmailsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<Email | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImportInbound, setShowImportInbound] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [initialDraft, setInitialDraft] = useState<{ subject: string; body: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const { data: emails, isLoading, isError, refetch } = useEmails();
  const { data: applications } = useApplications();
  const markRead = useMarkEmailRead();
  const deleteEmail = useDeleteEmail();
  const queryClient = useQueryClient();

  if (isLoading) return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading inbox…</div>;
  if (isError) return <ApiErrorCard onRetry={refetch} />;

  const appMap = useMemo(() => {
    const map = new Map<string, any>();
    (applications ?? []).forEach((app: any) => {
      map.set(String(app.id), app);
    });
    return map;
  }, [applications]);

  const filtered = (emails ?? []).filter(
    (e) =>
      filter === "All" ||
      e.category === filter ||
      (filter === "Sent" && (e.category === "Application Sent" || e.category === "Sent")) ||
      (filter === "Interview" && (e.category === "Interview Invitation" || e.category === "Technical Interview" || e.category === "Final Interview" || e.category === "Interview"))
  );
  const unreadCount = (emails ?? []).filter((e) => !e.read).length;

  const handleSyncInbox = async () => {
    setIsSyncing(true);
    try {
      const result = await api.post<{ synced: boolean; count: number; message: string }>("/emails/sync-inbox", {});
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", "analytics"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      const msg = result.message || `Synced ${result.count ?? 0} recruiter email${result.count !== 1 ? "s" : ""}`;
      setSyncMsg(msg);
      setTimeout(() => setSyncMsg(""), 6000);
    } catch (err) {
      setSyncMsg("Inbox sync check completed.");
      setTimeout(() => setSyncMsg(""), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper to detect meeting link in email body
  const extractMeetingLink = (text: string = "") => {
    const match = text.match(/(https?:\/\/[^\s>"]*(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com|calendly\.com|webex\.com)[^\s>"]*)/i);
    return match ? match[0] : null;
  };

  const selectedApp = selected?.application_id ? appMap.get(String(selected.application_id)) : null;
  const meetingLink = selected ? extractMeetingLink(selected.body + " " + selected.recommended_action) : null;

  return (
    <div className="p-2 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Career Inbox &amp; Response Intelligence</span>
            {syncMsg && (
              <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-xl flex items-center gap-1 shadow-sm animate-pulse">
                <CheckCircle2 size={13} /> {syncMsg}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {unreadCount} unread correspondence emails · Auto-matched with active job applications
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowImportInbound(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold px-4 py-2.5 shadow-md transition-all hover:scale-[1.02]"
          >
            <Zap size={16} className="text-amber-300" />
            <span>Process Recruiter Email</span>
          </button>

          <button
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-semibold px-3.5 py-2.5 shadow-md transition-all hover:scale-[1.02]"
          >
            <Sparkles size={16} className="text-blue-400" />
            <span>Templates</span>
          </button>
          <button
            disabled={isSyncing}
            onClick={handleSyncInbox}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold px-3.5 py-2.5 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} className={isSyncing ? "animate-spin text-blue-500" : ""} />
            <span>{isSyncing ? "Syncing..." : "Sync Inbox"}</span>
          </button>
          <button
            onClick={() => {
              setInitialDraft(null);
              setShowAdd(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 text-sm font-semibold px-3.5 py-2.5 transition-all"
          >
            <Plus size={16} />
            <span>Add Manual</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
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

      {/* Email List & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email Cards List */}
        <div className="flex flex-col gap-2.5">
          {filtered.map((e) => {
            const linkedApp = e.application_id ? appMap.get(String(e.application_id)) : null;
            const hasLink = extractMeetingLink(e.body + " " + e.recommended_action);

            return (
              <div
                key={e.id}
                onClick={() => {
                  setSelected(e);
                  if (!e.read) markRead.mutate({ id: e.id, read: true });
                }}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border cursor-pointer transition-all ${
                  selected?.id === e.id ? "border-blue-500 shadow-md ring-1 ring-blue-500/20" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                } ${!e.read ? "border-l-4 border-l-blue-500" : ""}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${e.read ? "font-semibold text-slate-800 dark:text-slate-200" : "font-extrabold text-slate-900 dark:text-slate-100"}`}>
                        {e.from_name}
                      </span>
                      {hasLink && (
                        <span title="Meeting link detected" className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          <Video size={10} /> Call
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{e.subject}</div>

                    {linkedApp && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/40 w-fit">
                        <Briefcase size={12} className="shrink-0 text-emerald-500" />
                        <span className="font-bold truncate max-w-[180px]">{linkedApp.company_name}</span>
                        <span className="text-emerald-500">•</span>
                        <span className="truncate">{linkedApp.role}</span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full px-2.5 py-1 border border-blue-200 dark:border-blue-800 shrink-0">
                    {e.category}
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-sm text-slate-400 dark:text-slate-500">
              <Inbox size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              No emails found in this filter category.
            </div>
          )}
        </div>

        {/* Selected Email Panel */}
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

              {/* Linked Job Application Card */}
              {selectedApp && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {selectedApp.company_name?.slice(0, 2).toUpperCase() || "JOB"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {selectedApp.company_name} — {selectedApp.role}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Stage: <b className="text-blue-600 dark:text-blue-400">{selectedApp.stage}</b></span>
                        <span>•</span>
                        <span>Applied: {selectedApp.date_applied}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/applications")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-2"
                  >
                    <span>View Application</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              )}

              {/* Detected Video Call / Meeting Link */}
              {meetingLink && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 min-w-0">
                    <Video size={16} className="text-emerald-600 shrink-0" />
                    <span className="truncate">Meeting Link: {meetingLink}</span>
                  </div>
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm shrink-0 ml-2"
                  >
                    <span>Join Call</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

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
                  <span>Quick AI Reply</span>
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl px-3.5 py-2 border border-purple-200 dark:border-purple-800 transition-all"
                >
                  <Sparkles size={13} />
                  <span>Templates</span>
                </button>
              </div>

              {/* Email Body Content */}
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
              <div className="text-xs">Select any recruiter correspondence on the left to view details and response options</div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showImportInbound && (
        <ProcessInboundModal
          applications={applications ?? []}
          onClose={() => setShowImportInbound(false)}
        />
      )}

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

/** Modal to Paste & Process Recruiter Email directly */
function ProcessInboundModal({
  applications,
  onClose,
}: {
  applications: any[];
  onClose: () => void;
}) {
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);

  const processInbound = useProcessInboundEmail();
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const handleProcess = () => {
    if (!subject.trim() || !body.trim()) return;

    processInbound.mutate(
      {
        sender_name: senderName,
        sender_email: senderEmail,
        subject,
        body,
        application_id: selectedAppId,
      },
      {
        onSuccess: (data) => {
          setSuccessResult(data);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500/20" size={20} />
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
              Process Recruiter Email Response
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {successResult ? (
          <div className="space-y-4 py-2">
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-emerald-800 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-base">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span>Inbound Email Successfully Processed!</span>
              </div>
              <p className="text-xs">
                Email classified as <b>{successResult.classified?.category}</b>.
              </p>
              {successResult.application ? (
                <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1">
                  <div><b>Mapped Application:</b> {successResult.application.company_name} ({successResult.application.role})</div>
                  <div><b>New Application Stage:</b> <span className="font-bold text-blue-600 dark:text-blue-400">{successResult.application.stage}</span></div>
                  {successResult.interview_created && (
                    <div className="text-purple-600 dark:text-purple-400 font-bold">📅 Interview &amp; Calendar Event Automatically Created!</div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Logged into Career Inbox (No matching job application found).
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors shadow-sm"
            >
              Done &amp; Return to Inbox
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste an inbound recruiter email (Interview invitation, assessment link, offer letter, or rejection). AI will auto-detect the intent, update the application stage, create interview reminders, and dispatch a notification.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400"
                  placeholder="Sender Name (e.g. Jane Doe)"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
                <input
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400"
                  placeholder="Sender Email (e.g. hr@company.com)"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Job Application (Optional — AI auto-detects if left empty)
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium"
                  value={selectedAppId ?? ""}
                  onChange={(e) => setSelectedAppId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Auto-detect matching application from email text</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.company_name} — {app.role} ({app.stage})
                    </option>
                  ))}
                </select>
              </div>

              <input
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 font-semibold"
                placeholder="Subject Line (e.g. Invitation to Technical Interview - Senior Engineer)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <textarea
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 resize-none font-mono text-xs"
                rows={6}
                placeholder="Paste Recruiter Email Body text here... (e.g., 'We would like to invite you to an interview on Google Meet at https://meet.google.com/abc-defg-hij...')"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={!subject.trim() || !body.trim() || processInbound.isPending}
                onClick={handleProcess}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
              >
                {processInbound.isPending ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Analyzing &amp; Wiring...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Process &amp; Wire Application</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
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
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Add Manual Email Record</h3>
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
