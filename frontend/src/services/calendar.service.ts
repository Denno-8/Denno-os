import { api } from "./api";
import type { CalendarEvent, CalendarEventCreateInput } from "../types/calendar.types";

export const calendarService = {
  list: (month?: number, year?: number) => {
    const qs = new URLSearchParams();
    if (month) qs.set("month", String(month));
    if (year) qs.set("year", String(year));
    const suffix = qs.toString() ? `?${qs}` : "";
    return api.get<CalendarEvent[]>(`/calendar${suffix}`);
  },
  create: (input: CalendarEventCreateInput) => api.post<CalendarEvent>("/calendar", input),
  remove: (id: string) => api.delete<void>(`/calendar/${id}`),
};
