import { api } from "./api";
import type { JobSource } from "../types/jobSource.types";

export type { JobSource };

export interface CreateJobSourcePayload {
  company_id: string;
  company_name: string;
  url: string;
  scrape_method?: string;
  status?: string;
  jobs_found?: number;
}

export interface SyncNowResult {
  status: string;
  total_new_jobs_added: number;
  expired_jobs_swept: number;
  synced_at: string;
  sources?: Array<{ source: string; added: number; skipped?: number; error?: string }>;
}

export interface VerifyResult {
  id: string;
  status: string;
  jobs_found: number;
  last_checked_at: string;
}

export const jobSourcesService = {
  /** List all job sources, optionally filtered by status */
  list: (status?: string) =>
    api.get<JobSource[]>(`/job-sources${status && status !== "All" ? `?status=${status}` : ""}`),

  /** Create a new job source (admin only) */
  create: (payload: CreateJobSourcePayload) =>
    api.post<JobSource>(`/job-sources`, payload),

  /** Update job source fields (admin only) */
  update: (id: string, data: Partial<CreateJobSourcePayload>) =>
    api.patch<JobSource>(`/job-sources/${id}`, data),

  /** Verify / re-check a single source and trigger its live fetcher */
  verify: (id: string) =>
    api.post<VerifyResult>(`/job-sources/${id}/verify`, {}),

  /** Admin: Trigger full sync across ALL external job scrapers */
  syncNow: () =>
    api.post<SyncNowResult>(`/job-sources/sync-now`, {}),

  /** Delete a job source (admin only) */
  delete: (id: string) =>
    api.delete<void>(`/job-sources/${id}`),
};
