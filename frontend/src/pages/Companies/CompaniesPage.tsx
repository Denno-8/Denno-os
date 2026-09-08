import { useState, useMemo } from "react";
import ApiErrorCard from "../../components/ApiErrorCard";
import {
  Building2, Search, MapPin, Globe, ExternalLink, Star, StarOff,
  Layers, Shield, Zap, TrendingUp, Filter, ChevronDown,
  Briefcase, Award, X, Info, BarChart2, Code2, Mail
} from "lucide-react";
import { useCompanies, useCompanySectors } from "../../hooks/useCompanies";

// Tech stack category colors
const STACK_COLORS: Record<string, { bg: string; text: string }> = {
  // Languages
  Python:      { bg: "rgba(59,130,246,0.12)",  text: "#2563eb" },
  JavaScript:  { bg: "rgba(234,179,8,0.15)",   text: "#b45309" },
  TypeScript:  { bg: "rgba(56,189,248,0.12)",  text: "#0284c7" },
  Java:        { bg: "rgba(239,68,68,0.12)",   text: "#dc2626" },
  Go:          { bg: "rgba(6,182,212,0.12)",   text: "#0891b2" },
  Rust:        { bg: "rgba(249,115,22,0.12)",  text: "#ea580c" },
  // Frameworks
  React:       { bg: "rgba(96,165,250,0.12)",  text: "#3b82f6" },
  "Next.js":   { bg: "rgba(15,23,42,0.08)",    text: "#334155" },
  Django:      { bg: "rgba(34,197,94,0.12)",   text: "#16a34a" },
  FastAPI:     { bg: "rgba(16,185,129,0.12)",  text: "#059669" },
  // Cloud
  AWS:         { bg: "rgba(251,191,36,0.12)",  text: "#d97706" },
  Azure:       { bg: "rgba(37,99,235,0.12)",   text: "#1d4ed8" },
  GCP:         { bg: "rgba(234,88,12,0.12)",   text: "#c2410c" },
  // Databases
  PostgreSQL:  { bg: "rgba(99,102,241,0.12)",  text: "#4f46e5" },
  MongoDB:     { bg: "rgba(34,197,94,0.12)",   text: "#15803d" },
  Redis:       { bg: "rgba(239,68,68,0.12)",   text: "#b91c1c" },
  // DevOps
  Docker:      { bg: "rgba(14,165,233,0.12)",  text: "#0369a1" },
  Kubernetes:  { bg: "rgba(37,99,235,0.15)",   text: "#1e40af" },
};

const TIER_META: Record<number, { label: string; color: string; bg: string; icon: any }> = {
  1: { label: "Tier 1 — Elite",   color: "#d97706", bg: "rgba(251,191,36,0.12)", icon: Award },
  2: { label: "Tier 2 — Target",  color: "#2563eb", bg: "rgba(59,130,246,0.12)", icon: TrendingUp },
  3: { label: "Tier 3 — Growth",  color: "#059669", bg: "rgba(34,197,94,0.12)",  icon: Zap },
};

// Simulated salary benchmarks per sector
const SECTOR_SALARY: Record<string, string> = {
  "Fintech":         "KES 120K–250K / mo",
  "E-Commerce":      "KES 90K–180K / mo",
  "Telecoms":        "KES 100K–210K / mo",
  "Healthcare Tech": "KES 80K–160K / mo",
  "EdTech":          "KES 70K–140K / mo",
  "SaaS":            "KES 110K–230K / mo",
  "Logistics Tech":  "KES 80K–150K / mo",
  "Media & Tech":    "KES 75K–145K / mo",
  "NGO & Dev":       "KES 60K–120K / mo",
};

export default function CompaniesPage() {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("All");
  const [tierFilter, setTierFilter] = useState<number | "All">("All");
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [selectedStack, setSelectedStack] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: companies, isLoading, isError, refetch } = useCompanies({ q, sector });
  const { data: sectors } = useCompanySectors();

  const toggleWatch = (id: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Collect all unique tech stacks across companies
  const allStacks = useMemo(() => {
    const seen = new Set<string>();
    (companies ?? []).forEach((co) => co.tech_stack?.forEach((s: string) => seen.add(s)));
    return Array.from(seen).sort();
  }, [companies]);

  const filtered = useMemo(() => {
    let list = companies ?? [];
    if (showWatchlistOnly) list = list.filter((c) => watchlist.has(c.id));
    if (tierFilter !== "All") list = list.filter((c) => c.tier === tierFilter);
    if (selectedStack) list = list.filter((c) => c.tech_stack?.includes(selectedStack));
    return list;
  }, [companies, showWatchlistOnly, tierFilter, selectedStack, watchlist]);

  if (isLoading) return (
    <div className="p-6 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
      <Building2 size={18} className="animate-pulse text-blue-500" /> Loading company intelligence…
    </div>
  );
  if (isError) return <ApiErrorCard onRetry={refetch} />;

  const totalWatched = watchlist.size;

  return (
    <div className="p-2 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5">
            <Building2 size={13} /> Company Intelligence Hub
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Employer Directory
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {companies?.length ?? 0} verified employers · tech stack filters · tier ranking · salary benchmarks
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {totalWatched > 0 && (
            <button
              onClick={() => setShowWatchlistOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl text-xs font-bold px-3.5 py-2 border transition-all ${
                showWatchlistOnly
                  ? "bg-amber-500 text-white border-amber-500 shadow-md"
                  : "bg-white dark:bg-slate-900 text-amber-600 border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              }`}
            >
              <Star size={13} />
              Watchlist ({totalWatched})
            </button>
          )}
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="inline-flex items-center gap-1.5 rounded-xl text-xs font-bold px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <BarChart2 size={13} />
            {viewMode === "grid" ? "List View" : "Grid View"}
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Employers", val: companies?.length ?? 0, color: "text-blue-600 dark:text-blue-400", icon: Building2 },
          { label: "Tier 1 Elite", val: (companies ?? []).filter((c) => c.tier === 1).length, color: "text-amber-600 dark:text-amber-400", icon: Award },
          { label: "Open Roles", val: (companies ?? []).reduce((s, c) => s + (c.open_roles_count || 0), 0), color: "text-emerald-600 dark:text-emerald-400", icon: Briefcase },
          { label: "On Watchlist", val: totalWatched, color: "text-purple-600 dark:text-purple-400", icon: Star },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</div>
              <div className={`text-2xl font-extrabold ${color} mt-0.5`}>{val}</div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace("text-", "bg-").replace("-600", "-50").replace("-400", "-900/30")}`}>
              <Icon size={20} className={color} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative flex items-center">
            <Search size={15} className="absolute left-3.5 text-slate-400" />
            <input
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400"
              placeholder="Search company name, location, ATS platform…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none font-medium"
          >
            <option value="All">All Sectors</option>
            {(sectors ?? []).map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
          <select
            value={String(tierFilter)}
            onChange={(e) => setTierFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none font-medium"
          >
            <option value="All">All Tiers</option>
            <option value="1">Tier 1 — Elite</option>
            <option value="2">Tier 2 — Target</option>
            <option value="3">Tier 3 — Growth</option>
          </select>
        </div>

        {/* Tech Stack Filter Pills */}
        {allStacks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs font-bold text-slate-400 self-center flex items-center gap-1 mr-1">
              <Code2 size={12} /> Stack:
            </span>
            {allStacks.slice(0, 18).map((stack) => {
              const style = STACK_COLORS[stack] ?? { bg: "rgba(100,116,139,0.1)", text: "#64748b" };
              const isActive = selectedStack === stack;
              return (
                <button
                  key={stack}
                  onClick={() => setSelectedStack(isActive ? null : stack)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all"
                  style={{
                    background: isActive ? style.text : style.bg,
                    color: isActive ? "#fff" : style.text,
                    borderColor: style.text + "50",
                  }}
                >
                  {stack}
                </button>
              );
            })}
            {selectedStack && (
              <button
                onClick={() => setSelectedStack(null)}
                className="text-[11px] font-bold px-2 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition-all"
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Active filter summary ── */}
      {(selectedStack || tierFilter !== "All" || showWatchlistOnly) && (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Filter size={13} />
          <span>Showing <strong className="text-slate-800 dark:text-slate-200">{filtered.length}</strong> of {companies?.length ?? 0} companies</span>
          {selectedStack && <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">Stack: {selectedStack}</span>}
          {tierFilter !== "All" && <span className="bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">{TIER_META[tierFilter as number]?.label}</span>}
        </div>
      )}

      {/* ── Company Grid/List ── */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center shadow-sm">
          <Building2 size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <div className="text-sm font-bold text-slate-500 dark:text-slate-400">No companies match your filters.</div>
          <button onClick={() => { setSelectedStack(null); setTierFilter("All"); setShowWatchlistOnly(false); setSector("All"); setQ(""); }}
            className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
          {filtered.map((co) => {
            const tier = TIER_META[co.tier] ?? TIER_META[3];
            const TierIcon = tier.icon;
            const isWatched = watchlist.has(co.id);
            const isExpanded = expandedId === co.id;
            const benchmarkSalary = SECTOR_SALARY[co.sector] ?? "KES 80K–180K / mo";

            return (
              <div
                key={co.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-sm hover:shadow-lg ${
                  isWatched
                    ? "border-amber-300 dark:border-amber-700"
                    : "border-slate-200 dark:border-slate-800"
                } ${viewMode === "list" ? "flex gap-4 p-4 items-start" : "flex flex-col p-5"}`}
              >
                {/* Company Header */}
                <div className={`flex items-start justify-between gap-3 ${viewMode === "list" ? "flex-1" : "mb-4"}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Logo Avatar */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-black shadow-sm shrink-0"
                      style={{ background: tier.bg, color: tier.color, border: `1.5px solid ${tier.color}30` }}
                    >
                      {co.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">{co.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 flex-wrap">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{co.location}</span>
                        <span>·</span>
                        <span>{co.sector}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleWatch(co.id)}
                      title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                        isWatched
                          ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500"
                      }`}
                    >
                      {isWatched ? <Star size={14} /> : <StarOff size={14} />}
                    </button>
                  </div>
                </div>

                {/* Tier + Open Roles Badges */}
                <div className={`flex items-center gap-2 flex-wrap ${viewMode === "list" ? "mt-1" : "mb-3"}`}>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border"
                    style={{ background: tier.bg, color: tier.color, borderColor: tier.color + "40" }}
                  >
                    <TierIcon size={10} />
                    {tier.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <Briefcase size={10} />
                    {co.open_roles_count} open roles
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {co.ats_platform}
                  </span>
                </div>

                {viewMode === "grid" && (
                  <>
                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(co.tech_stack ?? []).slice(0, 5).map((s: string) => {
                        const style = STACK_COLORS[s] ?? { bg: "rgba(100,116,139,0.1)", text: "#64748b" };
                        return (
                          <button
                            key={s}
                            onClick={() => setSelectedStack(selectedStack === s ? null : s)}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all hover:opacity-80"
                            style={{ background: style.bg, color: style.text, borderColor: style.text + "40" }}
                          >
                            {s}
                          </button>
                        );
                      })}
                      {(co.tech_stack ?? []).length > 5 && (
                        <span className="text-[11px] font-semibold text-slate-400 self-center">
                          +{co.tech_stack.length - 5} more
                        </span>
                      )}
                    </div>

                    {/* Salary Benchmark */}
                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 mb-3">
                      <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">Market Salary Benchmark</div>
                        <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">{benchmarkSalary}</div>
                      </div>
                    </div>

                    {/* Expanded detail toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : co.id)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mb-3"
                    >
                      <Info size={12} />
                      {isExpanded ? "Less info" : "More info"}
                    </button>

                    {isExpanded && (
                      <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl text-xs space-y-1.5 mb-3">
                        {co.contact_email && (
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <Mail size={12} className="text-slate-400" />
                            <span>{co.contact_email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Layers size={12} className="text-slate-400" />
                          <span>ATS: <strong>{co.ats_platform}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Shield size={12} className="text-slate-400" />
                          <span>Status: <strong className="capitalize">{co.verification_status}</strong></span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(co.tech_stack ?? []).map((s: string) => {
                            const style = STACK_COLORS[s] ?? { bg: "rgba(100,116,139,0.1)", text: "#64748b" };
                            return (
                              <span key={s} className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: style.bg, color: style.text }}>
                                {s}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                      <span className="text-xs font-semibold text-slate-400">
                        {new Date(co.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                      {co.career_url ? (
                        <a
                          href={co.career_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 rounded-xl px-3 py-1.5 transition-colors"
                        >
                          <Globe size={12} />
                          <span>Careers Page</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600 font-medium">No career URL</span>
                      )}
                    </div>
                  </>
                )}

                {/* List view compact info */}
                {viewMode === "list" && (
                  <div className="flex items-center gap-3 flex-wrap mt-2">
                    {(co.tech_stack ?? []).slice(0, 4).map((s: string) => {
                      const style = STACK_COLORS[s] ?? { bg: "rgba(100,116,139,0.1)", text: "#64748b" };
                      return (
                        <span key={s} className="text-[11px] font-bold px-2 py-0.5 rounded-lg border" style={{ background: style.bg, color: style.text, borderColor: style.text + "40" }}>
                          {s}
                        </span>
                      );
                    })}
                    {co.career_url && (
                      <a href={co.career_url} target="_blank" rel="noreferrer" className="ml-auto text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <ExternalLink size={12} /> Careers
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
