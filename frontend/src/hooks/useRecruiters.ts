import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recruitersService } from "../services/recruiters.service";
import type { RecruiterCreateInput, RecruiterUpdateInput } from "../types/recruiter.types";

const KEY = ["recruiters"] as const;

export function useRecruiters(strength?: string) {
  return useQuery({ queryKey: [...KEY, strength], queryFn: () => recruitersService.list(strength), staleTime: 120_000 });
}

export function useCreateRecruiter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecruiterCreateInput) => recruitersService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRecruiter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: RecruiterUpdateInput }) => recruitersService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRecruiter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recruitersService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
