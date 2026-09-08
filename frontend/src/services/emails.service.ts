import { api } from "./api";
import type { Email, EmailCreateInput } from "../types/email.types";

export const emailsService = {
  list: (unreadOnly = false) =>
    api.get<Email[]>(`/emails${unreadOnly ? "?unread_only=true" : ""}`),
  unreadCount: () => api.get<number>("/emails/unread-count"),
  create: (input: EmailCreateInput) => api.post<Email>("/emails", input),
  markRead: (id: string, read: boolean) => api.patch<Email>(`/emails/${id}`, { read }),
  remove: (id: string) => api.delete<void>(`/emails/${id}`),
};
