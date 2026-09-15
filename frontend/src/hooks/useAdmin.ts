import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../services/admin.service";
import type { AdminUser } from "../types/admin.types";

// ─── Analytics ────────────────────────────────────────────────────────────────
export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => adminService.getAnalytics(),
    staleTime: 30_000,
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function useAdminUsers(q = "", role = "", active_status = "", skip = 0, limit = 50) {
  return useQuery({
    queryKey: ["admin", "users", q, role, active_status, skip, limit],
    queryFn: () => adminService.listUsers(q, role, active_status, skip, limit),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useAdminUser(id: number | null) {
  return useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => adminService.getUser(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useUpdateUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<AdminUser> }) =>
      adminService.updateUserProfile(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "user", vars.id] });
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      adminService.updateRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      // Also refresh current user data in case the promoted user later re-opens their session
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
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

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, new_password }: { id: number; new_password: string }) =>
      adminService.resetUserPassword(id, new_password),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
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
