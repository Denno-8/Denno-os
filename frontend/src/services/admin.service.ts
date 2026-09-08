import { api } from "./api";
import type { AdminUser, AdminJob, AdminCompany, PlatformAnalytics, AdminEmailSettings } from "../types/admin.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export const adminService = {
  // Analytics
  getAnalytics: () => api.get<PlatformAnalytics>("/admin/analytics"),

  // Users
  listUsers: (q = "", role = "", active_status = "", skip = 0, limit = 100) =>
    api.get<AdminUser[]>(`/admin/users?q=${encodeURIComponent(q)}&role=${role}&active_status=${active_status}&skip=${skip}&limit=${limit}`),
  getUser: (id: number) => api.get<AdminUser>(`/admin/users/${id}`),
  updateRole: (id: number, role: string) =>
    api.patch<AdminUser>(`/admin/users/${id}/role`, { role }),
  suspendUser: (id: number, suspended: boolean) =>
    api.patch<AdminUser>(`/admin/users/${id}/suspend`, { suspended }),
  deleteUser: (id: number) => api.delete<void>(`/admin/users/${id}`),
  promoteByEmail: (email: string) =>
    api.post<AdminUser>("/admin/promote", { email }),

  // Email / SMTP Settings
  getEmailSettings: () => api.get<AdminEmailSettings>("/admin/settings/email"),
  updateEmailSettings: (payload: Partial<AdminEmailSettings & { smtp_password?: string }>) =>
    api.patch<AdminEmailSettings>("/admin/settings/email", payload),
  testSmtpConnection: (target_email?: string) =>
    api.post<{ success: boolean; message: string; recipient: string }>("/admin/settings/email/test", { target_email }),

  // Jobs
  listJobs: (mode = "", level = "", is_expired = "", skip = 0, limit = 100) =>
    api.get<AdminJob[]>(`/admin/jobs?mode=${mode}&level=${level}&is_expired=${is_expired}&skip=${skip}&limit=${limit}`),
  deleteJob: (id: number) => api.delete<void>(`/admin/jobs/${id}`),

  // Companies
  listCompanies: (tier = "", sector = "", skip = 0, limit = 100) =>
    api.get<AdminCompany[]>(`/admin/companies?tier=${tier}&sector=${sector}&skip=${skip}&limit=${limit}`),
  deleteCompany: (id: number) => api.delete<void>(`/admin/companies/${id}`),

  // Export File Download
  downloadExport: async (resource: string, format: string) => {
    const token = sessionStorage.getItem("denno_access_token");
    const res = await fetch(`${API_URL}/admin/export?resource=${resource}&format=${format}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Export download failed");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = format === "excel" ? "xlsx" : format === "pdf" ? "pdf" : "docx";
    a.download = `admin_${resource}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};
