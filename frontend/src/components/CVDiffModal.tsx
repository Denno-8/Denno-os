import { useState, useEffect } from "react";
import { X, Layers, Plus, Minus, Equal, ArrowRight } from "lucide-react";
import { api } from "../services/api";
import type { CVVersion } from "../types/cv.types";

interface CVDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvs: CVVersion[];
}

export default function CVDiffModal({ isOpen, onClose, cvs }: CVDiffModalProps) {
  const [v1Id, setV1Id] = useState<string>(cvs[0]?.id || "");
  const [v2Id, setV2Id] = useState<string>(cvs[1]?.id || cvs[0]?.id || "");
  const [diffResult, setDiffResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && v1Id && v2Id) {
      loadDiff();
    }
  }, [isOpen, v1Id, v2Id]);

  const loadDiff = async () => {
    if (!v1Id || !v2Id) return;
    setLoading(true);
    try {
      const data = await api.get<any>(`/cv/diff?v1=${v1Id}&v2=${v2Id}`);
      setDiffResult(data);
    } catch (e) {
      console.error("Diff load error", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">CV Version Diff & Comparison</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare skill keywords, ATS score delta, and structural changes between CV versions
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Version Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Base Version (V1)</label>
            <select
              value={v1Id}
              onChange={(e) => setV1Id(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-semibold outline-none"
            >
              {cvs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.ats_score}% ATS)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Comparison Version (V2)</label>
            <select
              value={v2Id}
              onChange={(e) => setV2Id(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-semibold outline-none"
            >
              {cvs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.ats_score}% ATS)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Result */}
        {loading ? (
          <div className="py-10 text-center text-xs text-slate-400">Loading version comparison…</div>
        ) : diffResult ? (
          <div className="space-y-4">
            {/* Score Delta */}
            <div className="flex items-center justify-between p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold">
              <span className="text-indigo-900 dark:text-indigo-200">
                Score Comparison: V1 ({diffResult.v1.ats_score}%) → V2 ({diffResult.v2.ats_score}%)
              </span>
              <span className={`px-2.5 py-0.5 rounded-full ${diffResult.diff.score_delta >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                {diffResult.diff.score_delta >= 0 ? `+${diffResult.diff.score_delta}% ATS Delta` : `${diffResult.diff.score_delta}% ATS Delta`}
              </span>
            </div>

            {/* Added / Removed / Common Skills */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Added */}
              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl">
                <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mb-2">
                  <Plus size={14} /> Skills Added in V2 ({diffResult.diff.added_skills.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {diffResult.diff.added_skills.map((s: string) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold">
                      +{s}
                    </span>
                  ))}
                  {diffResult.diff.added_skills.length === 0 && <span className="text-[11px] text-slate-400">None</span>}
                </div>
              </div>

              {/* Removed */}
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl">
                <div className="text-xs font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-1 mb-2">
                  <Minus size={14} /> Skills Removed in V2 ({diffResult.diff.removed_skills.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {diffResult.diff.removed_skills.map((s: string) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 text-[11px] font-bold line-through">
                      -{s}
                    </span>
                  ))}
                  {diffResult.diff.removed_skills.length === 0 && <span className="text-[11px] text-slate-400">None</span>}
                </div>
              </div>

              {/* Common */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-2">
                  <Equal size={14} /> Unchanged Skills ({diffResult.diff.common_skills.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {diffResult.diff.common_skills.map((s: string) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors">
            Close Diff View
          </button>
        </div>
      </div>
    </div>
  );
}
