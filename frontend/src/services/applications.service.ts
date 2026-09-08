import { api } from "./api";
import type {
  Application,
  ApplicationAnalytics,
  ApplicationCreateInput,
  ApplicationUpdateInput,
  FollowUpDraftResponse,
  PipelineFunnelAnalytics,
} from "../types/application.types";

export const applicationsService = {
  list: (stage?: string) =>
    api.get<Application[]>(`/applications${stage ? `?stage=${encodeURIComponent(stage)}` : ""}`),

  get: (id: string) => api.get<Application>(`/applications/${id}`),

  create: (input: ApplicationCreateInput) =>
    api.post<Application>("/applications", input),

  update: (id: string, patch: ApplicationUpdateInput) =>
    api.patch<Application>(`/applications/${id}`, patch),

  remove: (id: string) => api.delete<void>(`/applications/${id}`),

  analytics: () => api.get<ApplicationAnalytics>("/applications/analytics"),

  getFollowUpDraft: (id: string, tone: string = "polite") =>
    api.post<FollowUpDraftResponse>(`/applications/${id}/followup-draft?tone=${encodeURIComponent(tone)}`, {}),

  getFunnelAnalytics: () =>
    api.get<PipelineFunnelAnalytics>("/applications/analytics/funnel"),
};
