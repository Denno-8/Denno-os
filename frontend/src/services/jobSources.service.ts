import { api } from "./api";
import type { JobSource } from "../types/jobSource.types";

export type { JobSource };

export const jobSourcesService = {
  list: (status?: string) =>
    api.get<JobSource[]>(`/job-sources${status && status !== "All" ? `?status=${status}` : ""}`),
  verify: (id: string) => api.post<{ id: string; status: string; jobs_found: number; last_checked_at: string }>(`/job-sources/${id}/verify`, {}),
  syncNow: () => api.post<{ status: string; total_new_jobs_added: number }>(`/job-sources/sync-now`, {}),
};
