import { Navigate, Outlet } from "react-router-dom";
import { authService } from "../services/auth.service";

export default function ProtectedRoute() {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
