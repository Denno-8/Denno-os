import { Navigate, Outlet } from "react-router-dom";

export default function AdminProtectedRoute() {
  const token = sessionStorage.getItem("denno_access_token");
  if (!token) return <Navigate to="/login" replace />;

  // Decode JWT payload (no verify — server guards the actual data)
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload?.role !== "admin") {
      return <Navigate to="/applications" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
