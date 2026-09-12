import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "../services/notifications.service";

export function useNotifications() {
  const qc = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem("denno_token") || sessionStorage.getItem("denno_token");
    if (!token) return;

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
    const sseUrl = `${baseUrl}/notifications/stream?token=${encodeURIComponent(token)}`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type !== "ping") {
            qc.invalidateQueries({ queryKey: ["notifications"] });
          }
        } catch {
          // ignore heartbeats
        }
      };

      eventSource.addEventListener("notification", () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      });

      eventSource.onerror = () => {
        // SSE disconnected, query refetchInterval handles fallback
        eventSource?.close();
      };
    } catch (err) {
      console.warn("SSE connection skipped/failed:", err);
    }

    return () => {
      eventSource?.close();
    };
  }, [qc]);

  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsService.list(),
    refetchInterval: 15000, // Fallback poll every 15s
    staleTime: 15_000,
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: 10000,
    staleTime: 10_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useClearNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.clearAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
