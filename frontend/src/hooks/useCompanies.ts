import { useQuery } from "@tanstack/react-query";
import { companiesService } from "../services/companies.service";

export function useCompanies(params: { q?: string; sector?: string } = {}) {
  return useQuery({
    queryKey: ["companies", params],
    queryFn: () => companiesService.list(params),
    staleTime: 120_000, // companies change infrequently
  });
}

export function useCompanySectors() {
  return useQuery({
    queryKey: ["companies", "sectors"],
    queryFn: () => companiesService.sectors(),
    staleTime: 300_000, // sectors are very stable
  });
}
