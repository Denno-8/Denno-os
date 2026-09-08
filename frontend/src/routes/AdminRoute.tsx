import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";

/**
 * AdminRoute — wraps routes that require role="admin".
 * Reads the current user from the /auth/me endpoint (cached by React Query).
 * - If still loading: renders nothing (avoids flash redirect on first load).
 * - If role !== "admin": redirects to /applications.
 * - Otherwise: renders the nested routes via <Outlet />.
 */
export default function AdminRoute() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    // Don't redirect yet — wait for the user profile to arrive
    return null;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/applications" replace />;
  }

  return <Outlet />;
}
