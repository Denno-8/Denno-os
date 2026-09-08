import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../services/admin.service";

// ─── Analytics ────────────────────────────────────────────────────────────────
export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => adminService.getAnalytics(),
    staleTime: 30_000,
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function useAdminUsers(q = "", role = "", active_status = "") {
  return useQuery({
    queryKey: ["admin", "users", q, role, active_status],
    queryFn: () => adminService.listUsers(q, role, active_status),
    staleTime: 15_000,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      adminService.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, suspended }: { id: number; suspended: boolean }) =>
      adminService.suspendUser(id, suspended),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminService.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function usePromoteByEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => adminService.promoteByEmail(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export function useAdminJobs(mode = "", level = "", is_expired = "") {
  return useQuery({
    queryKey: ["admin", "jobs", mode, level, is_expired],
    queryFn: () => adminService.listJobs(mode, level, is_expired),
    staleTime: 15_000,
  });
}

export function useDeleteAdminJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminService.deleteJob(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "jobs"] }),
  });
}

// ─── Companies ────────────────────────────────────────────────────────────────
export function useAdminCompanies(tier = "", sector = "") {
  return useQuery({
    queryKey: ["admin", "companies", tier, sector],
    queryFn: () => adminService.listCompanies(tier, sector),
    staleTime: 15_000,
  });
}

export function useDeleteAdminCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminService.deleteCompany(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "companies"] }),
  });
}

// ─── Email & Settings ─────────────────────────────────────────────────────────
export function useAdminEmailSettings() {
  return useQuery({
    queryKey: ["admin", "settings", "email"],
    queryFn: () => adminService.getEmailSettings(),
    staleTime: 30_000,
  });
}

export function useUpdateAdminEmailSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof adminService.updateEmailSettings>[0]) =>
      adminService.updateEmailSettings(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "settings", "email"] }),
  });
}

export function useTestSmtpConnection() {
  return useMutation({
    mutationFn: (target_email?: string) => adminService.testSmtpConnection(target_email),
  });
}

