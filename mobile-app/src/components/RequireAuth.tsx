import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "@/lib/session";

const RequireAuth = () => {
  const user = getCurrentUser();

  if (!user || user.role !== "rider") {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
