import { api } from "./api";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "application" | "email" | "job_source" | "match";
  link: string;
  read: boolean;
  created_at: string;
}

export const notificationsService = {
  list: () => api.get<NotificationItem[]>("/notifications"),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) => api.patch<{ status: string }>(`/notifications/${id}/read`, {}),
  markUnread: (id: string) => api.patch<{ status: string }>(`/notifications/${id}/unread`, {}),
  deleteNotification: (id: string) => api.delete<{ status: string }>(`/notifications/${id}`),
  markAllRead: () => api.post<{ status: string }>("/notifications/mark-all-read", {}),
  batchMarkRead: (ids: string[], read: boolean) =>
    api.post<{ status: string; count: number }>("/notifications/batch-read", {
      ids: ids.map((id) => Number(id)),
      read,
    }),
  batchDelete: (ids: string[]) =>
    api.post<{ status: string; count: number }>("/notifications/batch-delete", {
      ids: ids.map((id) => Number(id)),
    }),
  clearAll: () => api.post<{ status: string }>("/notifications/clear", {}),
  create: (data: { title: string; message: string; type?: string; link?: string }) =>
    api.post<NotificationItem>("/notifications", data),
};

