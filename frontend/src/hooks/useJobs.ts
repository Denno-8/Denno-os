import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jobsService } from "../services/jobs.service";

export function useJobs(params: { q?: string; mode?: string; level?: string; includeExpired?: boolean; date_filter?: string; sort?: string } = {}) {
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => jobsService.list(params),
    staleTime: 60_000, // jobs refreshed by background sync — 60s freshness window
  });
}

export function useApplyToJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => jobsService.apply(jobId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useSyncLinkedInJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ query, location }: { query?: string; location?: string } = {}) =>
      jobsService.syncLinkedIn(query, location),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

