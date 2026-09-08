import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationsService } from "../services/applications.service";
import type { ApplicationCreateInput, ApplicationUpdateInput } from "../types/application.types";

const KEY = ["applications"] as const;
const ANALYTICS_KEY = ["applications", "analytics"] as const;
const JOBS_KEY = ["jobs"] as const;

export function useApplications(stage?: string) {
  return useQuery({
    queryKey: stage ? [...KEY, stage] : KEY,
    queryFn: () => applicationsService.list(stage),
    staleTime: 30_000,
  });
}

export function useApplicationAnalytics() {
  return useQuery({
    queryKey: ANALYTICS_KEY,
    queryFn: () => applicationsService.analytics(),
    staleTime: 60_000, // analytics don't need real-time freshness
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplicationCreateInput) => applicationsService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ANALYTICS_KEY });
      qc.invalidateQueries({ queryKey: JOBS_KEY });
    },
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ApplicationUpdateInput }) =>
      applicationsService.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData(KEY);
      qc.setQueryData(KEY, (old: any) =>
        old?.map((a: any) => (a.id === id ? { ...a, ...patch } : a))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(KEY, context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ANALYTICS_KEY });
      qc.invalidateQueries({ queryKey: JOBS_KEY });
    },
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ANALYTICS_KEY });
      qc.invalidateQueries({ queryKey: JOBS_KEY });
    },
  });
}

