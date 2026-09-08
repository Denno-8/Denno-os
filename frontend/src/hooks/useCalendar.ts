import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarService } from "../services/calendar.service";
import type { CalendarEventCreateInput } from "../types/calendar.types";

const KEY = ["calendar"] as const;

export function useCalendarEvents(month?: number, year?: number) {
  return useQuery({ queryKey: [...KEY, month, year], queryFn: () => calendarService.list(month, year), staleTime: 60_000 });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CalendarEventCreateInput) => calendarService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
