import { api } from "./api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export interface CoverLetterRequest {
  job_title: string;
  company: string;
  category?: string;
  tone?: string;
  job_description?: string;
}

export interface CoverLetterResponse {
  letter: string;
  category?: string;
}

export interface CVMatchRequest {
  cv_skills?: string[];
  cv_summary?: string;
  job_title: string;
  company_name?: string;
  required_skills?: string[];
  job_description?: string;
}

export interface CVMatchResponse {
  job_title: string;
  company_name: string;
  match_score: number;
  ats_score: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  reply: string;
  session_id?: number;
}

export interface ChatSession {
  id: number;
  title: string;
  message_count?: number;
  messages?: ChatMessage[];
  created_at: string;
  updated_at: string;
}

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem("denno_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const aiService = {
  generateCoverLetter: (input: CoverLetterRequest) =>
    api.post<CoverLetterResponse>("/ai/cover-letter", input),

  analyzeCVMatch: (input: CVMatchRequest) =>
    api.post<CVMatchResponse>("/ai/cv-match", input),

  chat: (messages: ChatMessage[], session_id?: number, save_session = true) =>
    api.post<ChatResponse>("/ai/denno1", { messages, session_id, save_session }),

  /** SSE streaming chat — calls onDelta for each token, onDone when complete */
  streamChat: async (
    messages: ChatMessage[],
    session_id: number | undefined,
    onDelta: (token: string) => void,
    onDone: (fullText: string, sessionId?: number) => void,
    onError: (err: Error) => void,
  ) => {
    try {
      const res = await fetch(`${API_URL}/ai/denno1/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({ messages, session_id, save_session: true }),
      });

      if (!res.ok) throw new Error(`AI stream error: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.delta) onDelta(data.delta);
            if (data.done) onDone(data.full_text, data.session_id);
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  },

  // ── Chat Sessions ──
  createSession: (title = "New Chat") =>
    api.post<ChatSession>("/ai/chat-sessions", { title }),

  listSessions: () =>
    api.get<ChatSession[]>("/ai/chat-sessions"),

  getSession: (id: number) =>
    api.get<ChatSession>(`/ai/chat-sessions/${id}`),

  updateSession: (id: number, payload: { title?: string; messages?: ChatMessage[] }) =>
    api.patch<{ id: number; title: string; message_count: number }>(`/ai/chat-sessions/${id}`, payload),

  deleteSession: (id: number) =>
    api.delete<void>(`/ai/chat-sessions/${id}`),
};
