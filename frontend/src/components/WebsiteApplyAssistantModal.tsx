import React, { useState } from "react";
import {
  ExternalLink, Copy, Check, FileText, Sparkles, ShieldCheck, Mail, CheckCircle2,
  X, Download, ArrowRight, Clock, RefreshCw, Globe, Inbox,
} from "lucide-react";
import { cvService } from "../services/cv.service";

interface WebsiteApplyAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  portalUrl: string;
  cvVersionId?: string;
  coverLetterText?: string;
  onConfirmApplied?: () => void;
}

export default function WebsiteApplyAssistantModal({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  portalUrl,
  cvVersionId,
  coverLetterText = "",
  onConfirmApplied,
}: WebsiteApplyAssistantModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const candidateInfo = {
    fullName: "Dennis Koech",
    email: "deno14619@gmail.com",
    phone: "+254 716 949 061",
    location: "Nairobi, Kenya",
    linkedIn: "https://linkedin.com/in/denniskoech",
    gitHub: "https://github.com/denniskoech-dev",
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadResume = () => {
    try {
      cvService.exportPDF(cvVersionId || "1", "Sapphire", `Resume_Dennis_Koech_${companyName.replace(/\s+/g, "_")}`);
    } catch (e) {
      console.warn("Resume download failed", e);
    }
  };

  const handleLaunchPortal = () => {
    if (portalUrl && portalUrl.startsWith("http")) {
      window.open(portalUrl, "_blank", "noopener,noreferrer");
    }
    handleDownloadResume();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between border-b border-blue-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white m-0 flex items-center gap-2">
                <span>Website Application Assistant</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-black border border-blue-400/40">1-Click Auto Fill</span>
              </h3>
              <p className="text-xs text-blue-200 mt-0.5 m-0 font-medium">
                {jobTitle} · {companyName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-blue-200 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Active response monitoring callout */}
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold shrink-0 flex items-center justify-center">
              <Inbox size={16} />
            </div>
            <div>
              <div className="font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <span>Inbound Recruiter Email Monitor Active</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 m-0 font-medium">
                When you submit on the employer portal, any confirmation or interview invite arriving at <strong>deno14619@gmail.com</strong> will be automatically caught and logged in your pipeline!
              </p>
            </div>
          </div>

          {/* Quick Copy Profile Chips */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[10px] flex items-center justify-between">
              <span>Candidate Application Fields (Click to Copy):</span>
              <span className="text-blue-600 dark:text-blue-400">1-Click Fast Paste</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(candidateInfo).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCopy(val, key)}
                  className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between hover:border-blue-500 transition-all text-left group"
                >
                  <div className="truncate pr-2">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">{key}</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">{val}</span>
                  </div>
                  <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-600 shrink-0">
                    {copiedField === key ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Document Download & Cover Letter Paste */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                Application Documents:
              </span>
              <button
                type="button"
                onClick={handleDownloadResume}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm text-xs"
              >
                <Download size={13} /> Download ATS Resume PDF
              </button>
            </div>

            {coverLetterText && (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Tailored Cover Letter Text</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(coverLetterText, "coverLetter")}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-blue-600 font-bold flex items-center gap-1 text-[11px]"
                  >
                    {copiedField === "coverLetter" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {copiedField === "coverLetter" ? "Copied!" : "Copy Text"}
                  </button>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 max-h-32 overflow-y-auto text-[11px] font-mono leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {coverLetterText}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold rounded-xl"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              handleLaunchPortal();
              if (onConfirmApplied) onConfirmApplied();
            }}
            className="w-full sm:flex-1 py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs"
          >
            <span>Open Job Portal &amp; Download Resume</span>
            <ExternalLink size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
