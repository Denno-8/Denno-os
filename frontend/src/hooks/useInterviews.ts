import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { interviewsService } from "../services/interviews.service";
import type { InterviewCreateInput, InterviewUpdateInput } from "../types/interview.types";

const KEY = ["interviews"] as const;

export function useInterviews(upcomingOnly = false) {
  return useQuery({ queryKey: [...KEY, upcomingOnly], queryFn: () => interviewsService.list(upcomingOnly), staleTime: 60_000 });
}

export function useCreateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InterviewCreateInput) => interviewsService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: InterviewUpdateInput }) => interviewsService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => interviewsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
