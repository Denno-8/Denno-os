import { api } from "./api";
import type { Recruiter, RecruiterCreateInput, RecruiterUpdateInput } from "../types/recruiter.types";

export const recruitersService = {
  list: (strength?: string) =>
    api.get<Recruiter[]>(`/recruiters${strength && strength !== "All" ? `?strength=${strength}` : ""}`),
  create: (input: RecruiterCreateInput) => api.post<Recruiter>("/recruiters", input),
  update: (id: string, patch: RecruiterUpdateInput) => api.patch<Recruiter>(`/recruiters/${id}`, patch),
  remove: (id: string) => api.delete<void>(`/recruiters/${id}`),
};
