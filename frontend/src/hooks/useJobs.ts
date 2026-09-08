import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jobsService } from "../services/jobs.service";

export function useJobs(params: { q?: string; mode?: string; level?: string; includeExpired?: boolean } = {}) {
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
