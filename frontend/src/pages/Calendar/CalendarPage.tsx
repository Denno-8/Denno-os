import { useState, useMemo } from "react";
import ApiErrorCard from "../../components/ApiErrorCard";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock,
  Trash2, Download, Search, Filter, MapPin, CheckCircle2, AlertCircle,
  FileText, CalendarDays, ExternalLink, Sparkles, Building2, Tag
} from "lucide-react";
import { useCalendarEvents, useCreateEvent, useDeleteEvent } from "../../hooks/useCalendar";
import { EVENT_TYPES, TYPE_COLORS, type CalendarEvent } from "../../types/calendar.types";
import { getAccessToken } from "../../services/api";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [presetDate, setPresetDate] = useState("");

  const { data: rawEvents, isLoading, isError, refetch } = useCalendarEvents(month, year);
  const deleteEvent = useDeleteEvent();

  const events: CalendarEvent[] = useMemo(() => {
    if (!rawEvents) return [];
    return rawEvents.filter((ev) => {
      const matchQuery = !searchQuery.trim() || ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || (ev.type && ev.type.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = typeFilter === "all" || ev.type.toLowerCase() === typeFilter.toLowerCase();
      return matchQuery && matchType;
    });
  }, [rawEvents, searchQuery, typeFilter]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isError) return <ApiErrorCard onRetry={refetch} />;

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
    setSelectedDay(null);
  };

  // ── Grid Calendar Matrix Calculation ──
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const handleDayClick = (dayNum: number) => {
    setSelectedDay(dayNum === selectedDay ? null : dayNum);
  };

  const handleOpenAddForDay = (dayNum: number) => {
    const formattedMonth = String(month).padStart(2, "0");
    const formattedDay = String(dayNum).padStart(2, "0");
    setPresetDate(`${year}-${formattedMonth}-${formattedDay}`);
    setShowAddModal(true);
  };

  const handleExportICS = () => {
    const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
    const token = getAccessToken();
    window.open(`${API_URL}/calendar/export/ics?month=${month}&year=${year}&token=${token || ""}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarDays size={24} className="text-blue-500" />
            Career Schedule & Calendar
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Track interviews, assessment dates, application deadlines, and follow-up reminders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportICS}
            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors shadow-xs"
            title="Download .ics file to import into Google Calendar or Apple Calendar"
          >
            <Download size={14} /> Export .ics / iCal
          </button>
          <button
            onClick={() => { setPresetDate(""); setShowAddModal(true); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-md hover:scale-[1.02]"
          >
            <Plus size={15} /> Add Calendar Event
          </button>
        </div>
      </div>

      {/* ── Toolbar: Month Nav, Filters & View Toggle ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => shiftMonth(-1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center min-w-[150px]">
            <h2 className="text-base font-black text-slate-900 dark:text-white">{monthLabel}</h2>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {events.length} Event{events.length !== 1 ? "s" : ""} Scheduled
            </div>
          </div>
          <button
            onClick={() => shiftMonth(1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Search & Type Filter */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedule events…"
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
          >
            <option value="all">All Types</option>
            <option value="interview">Interviews</option>
            <option value="assessment">Assessments</option>
            <option value="deadline">Deadlines</option>
            <option value="task">Tasks</option>
            <option value="learning">Learning</option>
            <option value="reminder">Reminders</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              viewMode === "grid"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <CalendarIcon size={14} /> Grid View
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              viewMode === "timeline"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Clock size={14} /> Timeline List
          </button>
        </div>
      </div>

      {/* ── View Mode: Interactive Monthly Grid ── */}
      {viewMode === "grid" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="py-2.5 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Monthly Day Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/60">
            {/* Previous Month Overflow Days */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
              const prevDay = daysInPrevMonth - firstDayOfMonth + idx + 1;
              return (
                <div key={`prev-${idx}`} className="min-h-[100px] p-2 bg-slate-50/40 dark:bg-slate-950/20 text-slate-300 dark:text-slate-700 select-none">
                  <span className="text-xs font-bold">{prevDay}</span>
                </div>
              );
            })}

            {/* Current Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const formattedDateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayEvents = events.filter((ev) => String(ev.date).startsWith(formattedDateStr));
              
              const isToday = now.getDate() === dayNum && now.getMonth() + 1 === month && now.getFullYear() === year;
              const isSelected = selectedDay === dayNum;

              return (
                <div
                  key={dayNum}
                  onClick={() => handleDayClick(dayNum)}
                  className={`min-h-[110px] p-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isSelected
                      ? "bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-500 z-10"
                      : isToday
                      ? "bg-blue-50/20 dark:bg-slate-800/40"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isToday
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-700 dark:text-slate-300"
                    }`}>
                      {dayNum}
                    </span>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenAddForDay(dayNum); }}
                      title={`Add event on ${monthLabel} ${dayNum}`}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:scale-110 transition-all"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Day Event Pills */}
                  <div className="space-y-1 my-1 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const colorName = TYPE_COLORS[ev.type] ?? "blue";
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold truncate cursor-pointer transition-transform hover:scale-[1.02] border ${
                            colorName === "blue"
                              ? "bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800"
                              : colorName === "green"
                              ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                              : colorName === "red"
                              ? "bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800"
                              : colorName === "purple"
                              ? "bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800"
                              : "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {ev.time ? `${ev.time} ` : ""}{ev.title}
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <div className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── View Mode: Chronological Timeline List ── */}
      {viewMode === "timeline" && (
        <div className="space-y-3">
          {events.map((ev) => {
            const colorName = TYPE_COLORS[ev.type] ?? "blue";
            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${
                    colorName === "blue" ? "bg-blue-500" : colorName === "green" ? "bg-emerald-500" : colorName === "red" ? "bg-rose-500" : colorName === "purple" ? "bg-purple-500" : "bg-amber-500"
                  }`} />
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm truncate group-hover:text-blue-600 transition-colors">
                      {ev.title}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarIcon size={12} className="text-slate-400" />
                        {new Date(ev.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {ev.time && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" /> {ev.time}
                        </span>
                      )}
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" /> {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border capitalize ${
                    colorName === "blue"
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      : colorName === "green"
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : colorName === "red"
                      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      : "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                  }`}>
                    {ev.type}
                  </span>

                  <button
                    onClick={(e) => { e.stopPropagation(); deleteEvent.mutate(ev.id); }}
                    title="Delete Event"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}

          {events.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-14 text-center shadow-sm">
              <CalendarDays size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                No events found for {monthLabel}.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold border bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 capitalize">
                  {selectedEvent.type}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarIcon size={14} className="text-blue-500" />
                <span>Date: <strong>{new Date(selectedEvent.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</strong></span>
              </div>
              {selectedEvent.time && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-blue-500" />
                  <span>Time: <strong>{selectedEvent.time}</strong></span>
                </div>
              )}
              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-blue-500" />
                  <span>Location: <strong>{selectedEvent.location}</strong></span>
                </div>
              )}
            </div>

            {selectedEvent.description && (
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Details</label>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { deleteEvent.mutate(selectedEvent.id); setSelectedEvent(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} /> Remove Event
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Event Modal ── */}
      {showAddModal && (
        <AddEventModal
          presetDate={presetDate}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// ─── Add Event Modal Component ────────────────────────────────────────────────
function AddEventModal({ presetDate, onClose }: { presetDate: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState(EVENT_TYPES[0]);
  const [date, setDate] = useState(presetDate || new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("10:00 AM");
  const createEvent = useCreateEvent();

  const handleSubmit = () => {
    if (!title.trim() || !date) return;
    createEvent.mutate(
      { title: title.trim(), type, date, time, color: type },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Plus size={18} className="text-blue-500" />
            Schedule Career Event
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {createEvent.isError && (
          <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {(createEvent.error as any)?.detail || (createEvent.error as any)?.message || "Failed to save event. Please check inputs and try again."}
          </div>
        )}

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Event Title</label>
            <input
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 transition"
              placeholder="e.g. Technical Interview at M-KOPA"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Category</label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 transition"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Time</label>
              <input
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 transition"
                placeholder="10:00 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Date</label>
            <input
              type="date"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 transition"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-xs font-extrabold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button
            disabled={!title.trim() || !date || createEvent.isPending}
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-extrabold disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            {createEvent.isPending ? "Saving…" : "Save Event"}
          </button>
        </div>
      </div>
    </div>
  );
}
