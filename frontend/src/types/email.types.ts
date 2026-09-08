export interface Email {
  id: string;
  from_name: string;
  subject: string;
  category: string;
  body: string;
  received_at: string;
  read: boolean;
  recommended_action: string;
  application_id: string | null;
  source: string;
  created_at: string;
}

export const EMAIL_CATEGORIES = [
  "Application Received", "Interview", "Assessment", "Offer",
  "Rejected", "Document Request", "Background Check", "Sent",
];

export interface EmailCreateInput {
  from_name: string;
  subject: string;
  category?: string;
  body?: string;
  recommended_action?: string;
}
