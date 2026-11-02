
import { Navigate, Outlet } from "react-router-dom";

export function PublicOnlyRoute() {
  const adminToken = localStorage.getItem("adminToken");
  const lawyerToken = localStorage.getItem("lawyerToken");
  const customerToken = localStorage.getItem("customerToken");

  if (adminToken) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (lawyerToken) {
    return <Navigate to="/lawyer/dashboard" replace />;
  }

  if (customerToken) {
    return <Navigate to="/customer/dashboard" replace />;
  }

  return <Outlet />;
}

export function ProtectedRoleRoute({ role }) {
  const token = localStorage.getItem(`${role}Token`);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
