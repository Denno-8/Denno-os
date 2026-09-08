import { useState } from "react";
import ApiErrorCard from "../../components/ApiErrorCard";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock, Trash2 } from "lucide-react";
import { useCalendarEvents, useCreateEvent, useDeleteEvent } from "../../hooks/useCalendar";
import { EVENT_TYPES, TYPE_COLORS } from "../../types/calendar.types";

export default function CalendarPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data: events, isLoading, isError, refetch } = useCalendarEvents(month, year);
  const deleteEvent = useDeleteEvent();
  const [showAdd, setShowAdd] = useState(false);

  if (isLoading) return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading calendar…</div>;
  if (isError) return <ApiErrorCard onRetry={refetch} />;

  const list = events ?? [];
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  return (
    <div className="p-2 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Calendar Timeline</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track interviews, assessments, and application deadlines</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 shadow-md transition-all hover:scale-[1.02]"
        >
          <Plus size={16} />
          <span>Add Event</span>
        </button>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">{monthLabel}</span>
        <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="space-y-2.5">
        {list.map((ev) => {
          const colorName = TYPE_COLORS[ev.type] ?? "blue";
          const hexColor = colorName === "blue" ? "#2563eb" : colorName === "green" ? "#10b981" : colorName === "red" ? "#ef4444" : colorName === "purple" ? "#8b5cf6" : "#f59e0b";
          return (
            <div key={ev.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3.5 shadow-sm hover:shadow-md transition-all">
              <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: hexColor }} />
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">{ev.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                  <CalendarIcon size={12} className="text-slate-400" />
                  <span>{new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  {ev.time && (
                    <>
                      <span>•</span>
                      <Clock size={12} className="text-slate-400" />
                      <span>{ev.time}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-xs font-bold rounded-full px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 capitalize shrink-0">
                {ev.type}
              </span>
              <button
                onClick={() => deleteEvent.mutate(ev.id)}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline p-1 shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-14 text-center text-sm text-slate-400 dark:text-slate-500 shadow-sm">
            <CalendarIcon size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            No calendar events scheduled for {monthLabel}.
          </div>
        )}
      </div>

      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddEventModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState(EVENT_TYPES[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const createEvent = useCreateEvent();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Add Calendar Event</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 mb-5">
          <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400" placeholder="Event title (e.g. Technical Interview)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium" value={type} onChange={(e) => setType(e.target.value)}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400" placeholder="Time (e.g. 10:00 AM)" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button
            disabled={!title.trim() || !date}
            onClick={() => createEvent.mutate({ title, type, date, time, color: type }, { onSuccess: onClose })}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
          >
            Add Event
          </button>
          <button onClick={onClose} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
