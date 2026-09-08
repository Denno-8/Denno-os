/**
 * JobPortalPreviewCard
 *
 * Primary view: Attempts to render the employer's live job portal inside an iframe
 * so the user can see the actual page and verify the listing.
 *
 * Fallback: When the site blocks iframe embedding (X-Frame-Options / CSP) —
 * which most major job boards do — we show:
 *   1. A clear explanation banner
 *   2. A dominant "Open Live Job Page ↗" button that opens in a real browser tab
 *   3. A rich preview card built from DB data so the user still has all details
 */

import React, { useState, useRef, useEffect } from "react";
import {
  ExternalLink, Building2, MapPin, Briefcase, DollarSign,
  Clock, Star, WifiOff, Globe, AlertCircle, RefreshCw, Monitor,
  ChevronDown, ChevronUp, Shield,
} from "lucide-react";
import type { Job } from "../types/job.types";

interface JobPortalPreviewCardProps {
  job: Job;
  height?: number;
  showChrome?: boolean;
}

type IframeState = "loading" | "loaded" | "blocked" | "no-url";

export default function JobPortalPreviewCard({
  job,
  height = 420,
  showChrome = true,
}: JobPortalPreviewCardProps) {
  const hasUrl = !!job.source_url?.startsWith("http");
  const [iframeState, setIframeState] = useState<IframeState>(hasUrl ? "loading" : "no-url");
  const [showDetails, setShowDetails] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Many sites don't fire onError — they just show a blank page or Chrome's
  // "refused to connect" message. We use a timeout to detect this.
  useEffect(() => {
    if (iframeState === "loading") {
      loadTimerRef.current = setTimeout(() => {
        // If still loading after 6 seconds, assume it's blocked
        setIframeState((s) => (s === "loading" ? "blocked" : s));
      }, 6000);
    }
    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    };
  }, [iframeState]);

  const handleIframeLoad = () => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc && doc.title === "" && (!doc.body || doc.body.innerHTML.trim() === "")) {
        setIframeState("blocked");
      } else {
        setIframeState("loaded");
      }
    } catch {
      // Cross-origin access denied — page actually loaded successfully
      setIframeState("loaded");
    }
  };

  const handleIframeError = () => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    setIframeState("blocked");
  };

  const handleRetry = () => {
    setRefreshKey((k) => k + 1);
    setIframeState("loading");
  };

  const displayUrl = job.source_url || "";

  // ── Blocked / No-URL fallback details card ─────────────────────────────────
  const detailsCard = (
    <div
      className={`${iframeState === "loaded" ? "hidden" : "flex"} flex-col overflow-y-auto bg-white dark:bg-slate-900`}
      style={{ maxHeight: showChrome ? height - 36 : height }}
    >
      {/* "Can't embed" notice — only when we tried and got blocked */}
      {iframeState === "blocked" && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
          <Shield size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-extrabold text-amber-900 dark:text-amber-200">
              This employer's portal blocks in-app embedding
            </div>
            <div className="text-amber-700 dark:text-amber-300 font-medium mt-0.5">
              Most major job sites (LinkedIn, Greenhouse, Lever, Workday) use security headers
              that prevent embedding. Click the button below to open the real page in your browser.
            </div>
          </div>
        </div>
      )}

      {/* BIG CTA — open in real browser */}
      {hasUrl && (
        <div className="px-4 py-4 bg-gradient-to-br from-blue-600 to-indigo-700 shrink-0">
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-3.5 bg-white hover:bg-blue-50 text-blue-700 font-extrabold text-sm rounded-2xl shadow-xl transition-all group"
          >
            <Globe size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
            <span>Open Live Job Portal in Browser ↗</span>
          </a>
          <p className="text-center text-blue-200 text-[11px] mt-2 font-medium">
            {job.source_url}
          </p>
        </div>
      )}

      {/* Job Details from DB */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Company header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-white font-black text-xl shrink-0 shadow">
            {job.company_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              {job.company_name}
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug mt-0.5">
              {job.title}
            </h3>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1"><Briefcase size={11} /> {job.mode}</span>
              <span className="flex items-center gap-1"><MapPin size={11} /> {job.level}</span>
              {job.employment_type && (
                <span className="flex items-center gap-1"><Clock size={11} /> {job.employment_type}</span>
              )}
            </div>
          </div>
        </div>

        {/* Salary */}
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2.5">
          <DollarSign size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Salary Range
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {job.currency} {job.salary_min.toLocaleString()} – {job.salary_max.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Skills */}
        {job.required_skills?.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">
              <Star size={12} className="text-amber-500" /> Required Skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              About the Role
              {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showDetails && (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700 line-clamp-6">
                {job.description}
              </p>
            )}
          </div>
        )}

        {/* Requirements */}
        {job.requirements?.length > 0 && (
          <div>
            <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
              Key Requirements
            </div>
            <ul className="space-y-1">
              {job.requirements.slice(0, 5).map((req, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg px-3 py-2"
                >
                  <span className="text-blue-500 font-black shrink-0">{i + 1}.</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact */}
        {job.contact_email && (
          <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5">
            <span className="font-bold text-blue-700 dark:text-blue-300">Apply to:</span>
            <a href={`mailto:${job.contact_email}`} className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              {job.contact_email}
            </a>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-md bg-white dark:bg-slate-900"
      style={{ height }}
    >
      {/* Browser chrome / address bar */}
      {showChrome && (
        <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 shrink-0">
          {/* Traffic lights */}
          <div className="flex gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>

          {/* URL bar */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 flex items-center gap-2 min-w-0 border border-slate-200 dark:border-slate-700 text-[11px]">
            <Monitor size={11} className="text-slate-400 shrink-0" />
            {hasUrl ? (
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-blue-600 dark:text-blue-400 truncate flex-1 hover:underline"
              >
                {job.source_url}
              </a>
            ) : (
              <span className="text-slate-400 italic">No URL — manual/direct application</span>
            )}
            {iframeState === "loaded" && (
              <span className="flex items-center gap-0.5 text-emerald-600 text-[10px] font-extrabold shrink-0 ml-1">
                ● Live
              </span>
            )}
            {iframeState === "blocked" && (
              <span className="flex items-center gap-0.5 text-amber-600 text-[10px] font-extrabold shrink-0 ml-1">
                <AlertCircle size={10} /> Blocked
              </span>
            )}
            {iframeState === "loading" && (
              <RefreshCw size={11} className="animate-spin text-blue-500 shrink-0 ml-1" />
            )}
          </div>

          {/* Browser controls */}
          <div className="flex items-center gap-1 shrink-0">
            {(iframeState === "blocked" || iframeState === "loading") && hasUrl && (
              <button
                onClick={handleRetry}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Retry"
              >
                <RefreshCw size={12} />
              </button>
            )}
            {hasUrl && (
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                title="Open in new browser tab"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading state */}
        {iframeState === "loading" && hasUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 z-10 text-center px-6">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
            <div className="text-xs text-slate-500">
              <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Loading employer portal…</div>
              <div>Connecting to <span className="font-mono text-blue-600 dark:text-blue-400 break-all">{job.source_url}</span></div>
            </div>
          </div>
        )}

        {/* Iframe */}
        {hasUrl && (
          <iframe
            key={refreshKey}
            ref={iframeRef}
            src={job.source_url}
            title={`${job.company_name} — ${job.title}`}
            className={`w-full border-none bg-white transition-opacity duration-300 ${iframeState === "loaded" ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{ height: showChrome ? height - 36 : height }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}

        {/* Fallback card — shown when blocked or no URL */}
        {(iframeState === "blocked" || iframeState === "no-url") && detailsCard}
      </div>
    </div>
  );
}
