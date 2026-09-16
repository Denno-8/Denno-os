import { useQuery } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authService.me(),
    staleTime: 30 * 1000, // 30s stale time so role changes reflect quickly
  });
}

export function useIsAdmin() {
  const { data: user } = useCurrentUser();
  return user?.role === "admin";
}
