import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "@/lib/session";

export const ProtectedRoute = ({
  allowedRoles,
}: {
  allowedRoles?: Array<"admin" | "rider">;
}) => {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/rider/dashboard"} replace />;
  }

  return <Outlet />;
};

export const DashboardRedirect = () => {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/rider/dashboard"} replace />;
};
