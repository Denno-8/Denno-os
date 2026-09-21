import React, { useState, useEffect } from "react";
import { X, Send, Copy, Download, Calendar, Sparkles, Check, RefreshCw, Mail, Clock, AlertCircle } from "lucide-react";
import { applicationsService } from "../services/applications.service";
import type { FollowUpDraftResponse } from "../types/application.types";

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  companyName: string;
  roleTitle: string;
  stage: string;
  dateApplied?: string;
  recruiterEmail?: string | null;
}

export default function FollowUpModal({
  isOpen,
  onClose,
  applicationId,
  companyName,
  roleTitle,
  stage,
  dateApplied,
  recruiterEmail,
}: FollowUpModalProps) {
  const [tone, setTone] = useState<"polite" | "confident" | "technical">("polite");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<FollowUpDraftResponse | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [dispatchDetails, setDispatchDetails] = useState<{ sent: boolean; recruiter_email: string; smtp_warning?: string } | null>(null);

  const fetchDraft = async (selectedTone: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await applicationsService.getFollowUpDraft(applicationId, selectedTone);
      setDraft(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate follow-up draft.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && applicationId) {
      setDispatchSuccess(false);
      setDispatchDetails(null);
      setErrorMsg(null);
      fetchDraft(tone);
    }
  }, [isOpen, applicationId, tone]);

  if (!isOpen) return null;

  const handleCopySubject = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft.subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2500);
  };

  const handleCopyBody = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft.body);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2500);
  };

  const handleDownloadICS = () => {
    if (!draft?.ics_content) return;
    const blob = new Blob([draft.ics_content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FollowUp_${companyName.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDispatchEmail = async () => {
    if (!draft) return;
    setIsDispatching(true);
    setErrorMsg(null);
    try {
      const res = await applicationsService.sendFollowUpEmail(applicationId, {
        subject: draft.subject,
        body: draft.body,
        tone: tone,
        recruiter_email: draft.recruiter_email || recruiterEmail || undefined,
      });
      setDispatchSuccess(true);
      setDispatchDetails(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to dispatch follow-up email.");
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight m-0">AI Follow-Up Email Dispatch</h3>
              <p className="text-xs text-slate-300 m-0">Contextual check-in &amp; 1-click direct dispatch for {companyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {dispatchSuccess ? (
            <div className="py-8 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <Check size={36} />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">Follow-Up Email Dispatched! 🚀</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Your tailored check-in email was successfully sent to <strong>{dispatchDetails?.recruiter_email || recruiterEmail || "the recruiter"}</strong>.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  Stage updated to "Followed Up"
                </div>
              </div>
              {dispatchDetails?.smtp_warning && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs">
                  {dispatchDetails.smtp_warning}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tone Selector & Context info */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{roleTitle} at {companyName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-[10px]">
                      {stage}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock size={12} /> {draft?.days_elapsed ?? 0} days since applied</span>
                    <span className="flex items-center gap-1"><Mail size={12} /> Recruiter: {draft?.recruiter_email || recruiterEmail || "careers@company.com"}</span>
                  </div>
                </div>

                {/* Tone Selector Pills */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  {(["polite", "confident", "technical"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        tone === t
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <RefreshCw size={28} className="animate-spin mx-auto text-blue-500" />
                  <p className="font-bold">Drafting tailored follow-up email...</p>
                </div>
              ) : errorMsg ? (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2 font-bold">
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              ) : draft ? (
                <div className="space-y-4">
                  {/* Subject Line Block */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Email Subject Line</label>
                      <button
                        onClick={handleCopySubject}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 text-[11px]"
                      >
                        {copiedSubject ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        <span>{copiedSubject ? "Copied!" : "Copy Subject"}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-slate-100 font-semibold select-all">
                      {draft.subject}
                    </div>
                  </div>

                  {/* Email Body Block */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Email Message Body</label>
                      <button
                        onClick={handleCopyBody}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 text-[11px]"
                      >
                        {copiedBody ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        <span>{copiedBody ? "Copied!" : "Copy Body"}</span>
                      </button>
                    </div>
                    <textarea
                      readOnly
                      rows={8}
                      value={draft.body}
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-sans text-xs text-slate-900 dark:text-slate-100 outline-none resize-none leading-relaxed select-all"
                    />
                  </div>

                  {/* Recommended Date & Calendar Action */}
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-amber-950 dark:text-amber-100 text-xs">Scheduled Reminder</div>
                        <div className="text-[11px] text-amber-700 dark:text-amber-300">Recommended follow-up date: <strong>{new Date(draft.recommended_date).toLocaleDateString()}</strong></div>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadICS}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                      title="Download .ics event file to import into Google Calendar or Apple Calendar"
                    >
                      <Download size={13} />
                      <span>Download .ics Event</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles size={12} className="text-blue-500" /> Direct Brevo / SMTP dispatch enabled
          </div>
          <div className="flex items-center gap-2">
            {dispatchSuccess ? (
              <>
                <button
                  onClick={handleDownloadICS}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Download size={13} />
                  <span>Download .ics Reminder</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs transition-colors"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCopyBody}
                  disabled={!draft || isDispatching}
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleDispatchEmail}
                  disabled={!draft || isDispatching}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all"
                >
                  {isDispatching ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Dispatching Email...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>🚀 Dispatch Follow-Up Email</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

