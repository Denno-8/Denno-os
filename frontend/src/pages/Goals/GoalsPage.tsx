import { useState, useEffect } from "react";
import ApiErrorCard from "../../components/ApiErrorCard";
import { Target, Plus, Minus, Trash2, X, Trophy, Zap, TrendingUp, AlertCircle, CheckCircle2, Star, BarChart2 } from "lucide-react";
import { useGoals, useCreateGoal, useIncrementGoal, useDeleteGoal } from "../../hooks/useGoals";
import { goalsService } from "../../services/goals.service";
import type { GoalVelocityProjectionResponse, GOAL_CATEGORIES as GoalCatType } from "../../types/goal.types";
import { GOAL_CATEGORIES } from "../../types/goal.types";

export default function GoalsPage() {
  const { data: goals, isLoading, isError, refetch } = useGoals();
  const incrementGoal = useIncrementGoal();
  const deleteGoal = useDeleteGoal();
  const [showAdd, setShowAdd] = useState(false);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);

  const [velocityData, setVelocityData] = useState<GoalVelocityProjectionResponse | null>(null);
  const [isLoadingVelocity, setIsLoadingVelocity] = useState(false);

  useEffect(() => {
    setIsLoadingVelocity(true);
    goalsService.getVelocityProjections()
      .then((res) => setVelocityData(res))
      .catch((err) => console.error("Failed to load goal velocity projections", err))
      .finally(() => setIsLoadingVelocity(false));
  }, []);

  if (isLoading) return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading goals…</div>;
  if (isError) return <ApiErrorCard onRetry={refetch} />;

  // Category breakdown
  const categoryMap: Record<string, { total: number; current: number }> = {};
  (goals ?? []).forEach((g) => {
    if (!categoryMap[g.category]) categoryMap[g.category] = { total: 0, current: 0 };
    categoryMap[g.category].total += g.target;
    categoryMap[g.category].current += g.current;
  });
  const completedGoals = (goals ?? []).filter((g) => g.current >= g.target).length;

  const handleIncrement = (id: string, delta: number, current: number, target: number) => {
    incrementGoal.mutate({ id, delta });
    // Celebrate if hitting 100%
    if (delta > 0 && current + delta >= target) {
      setCelebratingId(id);
      setTimeout(() => setCelebratingId(null), 2500);
    }
  };

  return (
    <div className="p-2 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Career Goals & Targets</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {(goals ?? []).length} goals tracked · {completedGoals} completed
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 shadow-md transition-all hover:scale-[1.02]"
        >
          <Plus size={16} />
          <span>New Goal</span>
        </button>
      </div>

      {/* Category Breakdown Summary */}
      {Object.keys(categoryMap).length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={15} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Goal Progress by Category</span>
          </div>
          <div className="space-y-2.5">
            {Object.entries(categoryMap).map(([cat, { total, current }]) => {
              const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{cat}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{current}/{total} · {pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? "#10b981" : pct >= 50 ? "#3b82f6" : "#f59e0b"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Offer Pacing Velocity & Goal Projections Widget */}
      {velocityData && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl border border-indigo-500/30 p-6 text-white shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-700/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-400 flex items-center justify-center font-bold">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white m-0">Offer Pacing &amp; Velocity Diagnostics</h3>
                <p className="text-xs text-slate-400 m-0">AI Target Projections based on weekly Application Velocity &amp; Historical Conversion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                velocityData.status === "On Track"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
              }`}>
                {velocityData.status === "On Track" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {velocityData.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 font-semibold mb-1">Weekly Velocity</div>
              <div className="text-xl font-black text-white flex items-baseline gap-1">
                {velocityData.weekly_velocity} <span className="text-xs text-slate-400 font-normal">apps/wk</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 font-semibold mb-1">Total Tracked</div>
              <div className="text-xl font-black text-indigo-400 flex items-baseline gap-1">
                {velocityData.total_applications} <span className="text-xs text-slate-400 font-normal">apps</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 font-semibold mb-1">Est. Weeks to Offer</div>
              <div className="text-xl font-black text-emerald-400 flex items-baseline gap-1">
                {velocityData.projected_weeks_to_offer} <span className="text-xs text-slate-400 font-normal">weeks</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 font-semibold mb-1">Interview Conversion</div>
              <div className="text-xl font-black text-amber-400 flex items-baseline gap-1">
                {velocityData.interview_conversion_pct}%
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-300 font-medium flex items-center gap-2 pt-1 border-t border-slate-800">
            <TrendingUp size={14} className="text-indigo-400 shrink-0" />
            <span>Offer Rate: <strong>{velocityData.offer_conversion_pct}%</strong> | <strong>{velocityData.recommendation}</strong></span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(goals ?? []).map((g) => {
          const pct = Math.round((g.current / g.target) * 100);
          const isComplete = g.current >= g.target;
          const isCelebrating = celebratingId === g.id;
          const color = pct >= 100 ? "#10b981" : pct >= 40 ? "#3b82f6" : "#f59e0b";
          return (
            <div
              key={g.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all flex flex-col justify-between ${
                isCelebrating
                  ? "border-emerald-400 dark:border-emerald-500 shadow-emerald-200 dark:shadow-emerald-900 shadow-lg scale-[1.01]"
                  : isComplete
                  ? "border-emerald-200 dark:border-emerald-900 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
              }`}
              style={isCelebrating ? { animation: "pulse 0.5s ease-in-out 3" } : {}}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {isComplete && <Star size={14} className="text-emerald-500 fill-emerald-500" />}
                      {g.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {g.category}{g.deadline ? ` • Due ${g.deadline}` : ""}
                    </div>
                  </div>
                  <span className="text-xs font-bold rounded-full px-2.5 py-1 border" style={{ color, background: `${color}15`, borderColor: `${color}40` }}>
                    {pct}%
                  </span>
                </div>
                {/* Celebration Banner */}
                {isComplete && (
                  <div className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <Trophy size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    Goal achieved! Outstanding work — you hit your target.
                  </div>
                )}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-3 overflow-hidden">
                  <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
                </div>
              </div>
              <div className="flex justify-between items-center px-5 pb-4">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {g.current} of {g.target} completed
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleIncrement(g.id, -1, g.current, g.target)}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700"
                    title="Decrement"
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    onClick={() => handleIncrement(g.id, 1, g.current, g.target)}
                    className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-sm"
                    title="Increment"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => deleteGoal.mutate(g.id)}
                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline p-1.5 ml-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {(goals ?? []).length === 0 && (
          <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-14 text-center text-sm text-slate-400 dark:text-slate-500 shadow-sm">
            <Trophy size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            No goals tracked yet. Click New Goal to set targets.
          </div>
        )}
      </div>

      {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddGoalModal({ onClose }: { onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState(GOAL_CATEGORIES[0]);
  const [target, setTarget] = useState(10);
  const createGoal = useCreateGoal();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">New Goal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 mb-5">
          <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400" placeholder="Goal label (e.g. Apply to 30 jobs)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium" value={category} onChange={(e) => setCategory(e.target.value)}>
            {GOAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium" placeholder="Target count" value={target} onChange={(e) => setTarget(parseInt(e.target.value) || 1)} />
        </div>
        <div className="flex gap-3">
          <button
            disabled={!label.trim()}
            onClick={() => createGoal.mutate({ label, category, target, current: 0 }, { onSuccess: onClose })}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
          >
            Create Goal
          </button>
          <button onClick={onClose} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
