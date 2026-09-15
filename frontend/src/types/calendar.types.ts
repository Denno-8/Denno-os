export interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  color: string;
  location?: string;
  description?: string;
  application_id: string | null;
  created_at: string;
}

export interface CalendarEventCreateInput {
  title: string;
  type?: string;
  date: string;
  time?: string;
  color?: string;
  location?: string;
  description?: string;
}

export const EVENT_TYPES = ["Interview", "Assessment", "Deadline", "Task", "Learning", "Reminder"];
export const TYPE_COLORS: Record<string, string> = {
  Interview: "blue", Assessment: "green", Deadline: "red", Task: "purple", Learning: "green", Reminder: "amber",
};
