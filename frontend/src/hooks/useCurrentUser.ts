import { useQuery } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authService.me(),
    staleTime: 5 * 60 * 1000, // role rarely changes mid-session
  });
}

export function useIsAdmin() {
  const { data: user } = useCurrentUser();
  return user?.role === "admin";
}
