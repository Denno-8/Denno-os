import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "../services/notifications.service";
import { API_URL } from "../services/api";

export function useNotifications() {
  const qc = useQueryClient();

  useEffect(() => {
    const token =
      sessionStorage.getItem("denno_access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("denno_token") ||
      sessionStorage.getItem("denno_token");
    if (!token) return;

    const sseUrl = `${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
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

export function useMarkNotificationUnread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markUnread(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useBatchMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, read }: { ids: string[]; read: boolean }) =>
      notificationsService.batchMarkRead(ids, read),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useBatchDeleteNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => notificationsService.batchDelete(ids),
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

