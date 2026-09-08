import { api } from "./api";
import type { Company } from "../types/company.types";

export const companiesService = {
  list: (params: { q?: string; sector?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.sector && params.sector !== "All") qs.set("sector", params.sector);
    const suffix = qs.toString() ? `?${qs}` : "";
    return api.get<Company[]>(`/companies${suffix}`);
  },
  sectors: () => api.get<string[]>("/companies/sectors"),
  get: (id: string) => api.get<Company>(`/companies/${id}`),
};
