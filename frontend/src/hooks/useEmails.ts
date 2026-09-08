import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emailsService } from "../services/emails.service";
import type { EmailCreateInput } from "../types/email.types";

const KEY = ["emails"] as const;

export function useEmails(unreadOnly = false) {
  return useQuery({ queryKey: [...KEY, unreadOnly], queryFn: () => emailsService.list(unreadOnly), staleTime: 30_000 });
}

export function useUnreadCount() {
  return useQuery({ queryKey: [...KEY, "unread-count"], queryFn: () => emailsService.unreadCount(), staleTime: 10_000 });
}

export function useCreateEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EmailCreateInput) => emailsService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarkEmailRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => emailsService.markRead(id, read),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
