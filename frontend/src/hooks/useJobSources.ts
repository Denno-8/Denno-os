import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jobSourcesService } from "../services/jobSources.service";

const KEY = ["job-sources"] as const;

export function useJobSources(status?: string) {
  return useQuery({ queryKey: [...KEY, status], queryFn: () => jobSourcesService.list(status), staleTime: 120_000 });
}

export function useVerifySource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobSourcesService.verify(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
