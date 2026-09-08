import React, { useState, useEffect } from "react";
import { X, Building2, Cpu, AlertTriangle, ShieldCheck, TrendingUp, RefreshCw, Briefcase, Award, CheckCircle2, Layers } from "lucide-react";
import { jobsService } from "../services/jobs.service";
import type { CompanyIntelligence } from "../types/job.types";

interface CompanyIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
}

export default function CompanyIntelligenceModal({
  isOpen,
  onClose,
  companyName,
}: CompanyIntelligenceModalProps) {
  const [loading, setLoading] = useState(false);
  const [intel, setIntel] = useState<CompanyIntelligence | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchIntelligence = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await jobsService.getCompanyIntelligence(companyName);
      setIntel(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load company intelligence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && companyName) {
      fetchIntelligence();
    }
  }, [isOpen, companyName]);

  if (!isOpen) return null;

  const getGhostRiskBadge = (risk?: string) => {
    if (risk === "High") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-extrabold text-xs border border-rose-300 dark:border-rose-800 flex items-center gap-1">
          <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400" /> High Ghost Job Risk (&gt;60d active)
        </span>
      );
    }
    if (risk === "Moderate") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold text-xs border border-amber-300 dark:border-amber-800 flex items-center gap-1">
          <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" /> Moderate Age (&gt;35d active)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
        <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" /> Low Ghost Risk (Fresh Postings)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight m-0">{companyName} — Tech Stack &amp; Signals</h3>
              <p className="text-xs text-slate-300 m-0">Aggregated tech stack profile, hiring velocity &amp; listing age telemetry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <RefreshCw size={28} className="animate-spin mx-auto text-indigo-500" />
              <p className="font-bold">Aggregating company tech stack and hiring signals...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2 font-bold">
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          ) : intel ? (
            <div className="space-y-5">
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Active Listings</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{intel.active_jobs}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Tracked</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{intel.total_jobs}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Hiring Velocity</div>
                  <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{intel.hiring_velocity}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Oldest Active Posting</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {intel.oldest_posting_days ? `${intel.oldest_posting_days} days` : "N/A"}
                  </div>
                </div>
              </div>

              {/* Ghost Job Risk Indicator */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">Ghost Job Risk Diagnostic</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Evaluates posting persistence without recruiter status updates
                  </div>
                </div>
                {getGhostRiskBadge(intel.ghost_job_risk)}
              </div>

              {/* Top Required Tech Stack */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 m-0">
                  <Cpu size={14} className="text-indigo-500" />
                  <span>Company Tech Stack &amp; Top Required Skills</span>
                </h4>
                {intel.top_skills && intel.top_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {intel.top_skills.map((skill, idx) => (
                      <div
                        key={skill}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 font-extrabold text-xs flex items-center gap-1.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 flex items-center justify-center text-[10px] font-black">
                          #{idx + 1}
                        </span>
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No skill tags extracted for this company yet.</p>
                )}
              </div>

              {/* Recent Roles */}
              {intel.recent_roles && intel.recent_roles.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 m-0">
                    <Briefcase size={14} className="text-blue-500" />
                    <span>Recent Postings at {companyName}</span>
                  </h4>
                  <div className="space-y-1.5">
                    {intel.recent_roles.map((roleTitle, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-blue-500 shrink-0" />
                        <span>{roleTitle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <TrendingUp size={12} className="text-indigo-500" /> Auto-aggregated from active job repository
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold text-xs transition-colors"
          >
            Close Intelligence
          </button>
        </div>
      </div>
    </div>
  );
}
