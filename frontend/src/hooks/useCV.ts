import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cvService } from "../services/cv.service";
import type { CVVersionCreateInput, CVVersionUpdateInput } from "../types/cv.types";

const KEY = ["cv"] as const;

export function useCVVersions() {
  return useQuery({ queryKey: KEY, queryFn: () => cvService.list(), staleTime: 120_000 });
}

export function useCreateCV() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CVVersionCreateInput) => cvService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useGenerateCVForJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { job_title: string; company_name: string; required_skills: string[]; description?: string }) =>
      cvService.generateForJob(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCV() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: CVVersionUpdateInput }) => cvService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCV() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cvService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useTailorCV() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { job_title: string; required_skills: string[]; description?: string } }) =>
      cvService.tailor(id, payload),
  });
}

