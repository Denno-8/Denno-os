import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiService, type CoverLetterRequest, type ChatMessage } from "../services/ai.service";

export function useGenerateCoverLetter() {
  return useMutation({
    mutationFn: (input: CoverLetterRequest) => aiService.generateCoverLetter(input),
  });
}

export function useDenno1Chat() {
  return useMutation({
    mutationFn: ({
      messages,
      session_id,
    }: {
      messages: ChatMessage[];
      session_id?: number;
    }) => aiService.chat(messages, session_id),
  });
}

export function useChatSessions() {
  return useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => aiService.listSessions(),
    staleTime: 30_000,
  });
}

export function useChatSession(id: number | undefined) {
  return useQuery({
    queryKey: ["chat-session", id],
    queryFn: () => aiService.getSession(id!),
    enabled: !!id,
  });
}

export function useCreateChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => aiService.createSession(title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-sessions"] }),
  });
}

export function useDeleteChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => aiService.deleteSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-sessions"] }),
  });
}

export function useUpdateChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { title?: string; messages?: ChatMessage[] } }) =>
      aiService.updateSession(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["chat-sessions"] });
      qc.invalidateQueries({ queryKey: ["chat-session", id] });
    },
  });
}
