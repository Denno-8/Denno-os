import { api } from "./api";
import type { Email, EmailCreateInput } from "../types/email.types";

export interface ProcessInboundPayload {
  sender_name?: string;
  sender_email?: string;
  subject: string;
  body: string;
  application_id?: number | null;
}

export interface ProcessInboundResult {
  email: Email;
  application?: {
    id: string | null;
    company_name: string | null;
    role: string | null;
    stage: string | null;
  } | null;
  classified: {
    category: string;
    recommended_stage: string | null;
    recommended_action: string;
    extracted_data: {
      interview_datetime?: string | null;
      meeting_link?: string | null;
      assessment_deadline?: string | null;
      offer_details?: string | null;
      summary?: string;
    };
  };
  stage_updated: boolean;
  interview_created: boolean;
  notification_created: boolean;
}

export const emailsService = {
  list: (unreadOnly = false) =>
    api.get<Email[]>(`/emails${unreadOnly ? "?unread_only=true" : ""}`),
  unreadCount: () => api.get<number>("/emails/unread-count"),
  create: (input: EmailCreateInput) => api.post<Email>("/emails", input),
  markRead: (id: string, read: boolean) => api.patch<Email>(`/emails/${id}`, { read }),
  remove: (id: string) => api.delete<void>(`/emails/${id}`),
  processInbound: (payload: ProcessInboundPayload) =>
    api.post<ProcessInboundResult>("/emails/process-inbound", payload),
};

