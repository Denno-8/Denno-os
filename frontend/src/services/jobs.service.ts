import { api } from "./api";
import type { Job, SalaryBenchmarksResponse, CompanyIntelligence } from "../types/job.types";
import type { Application } from "../types/application.types";

export const jobsService = {
  list: (params: { q?: string; mode?: string; level?: string; includeExpired?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.mode && params.mode !== "All") qs.set("mode", params.mode);
    if (params.level && params.level !== "All") qs.set("level", params.level);
    if (params.includeExpired) qs.set("include_expired", "true");
    const suffix = qs.toString() ? `?${qs}` : "";
    return api.get<Job[]>(`/jobs${suffix}`);
  },
  get: (id: string) => api.get<Job>(`/jobs/${id}`),
  apply: (id: string) => api.post<Application>(`/jobs/${id}/apply`, {}),
  fetchExternal: (url: string) => api.post<Job>("/jobs/fetch-external", { url }),
  syncLive: () => api.post<{ added_count: number; updated_count: number; total_fetched: number }>("/jobs/sync-live", {}),
  getSalaryBenchmarks: () => api.get<SalaryBenchmarksResponse>("/jobs/intelligence/salary-benchmarks"),
  getCompanyIntelligence: (companyName: string) => api.get<CompanyIntelligence>(`/jobs/intelligence/company/${encodeURIComponent(companyName)}`),
};
