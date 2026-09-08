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
  clearAll: () => api.post<{ status: string }>("/notifications/clear", {}),
  create: (data: { title: string; message: string; type?: string; link?: string }) =>
    api.post<NotificationItem>("/notifications", data),
};
