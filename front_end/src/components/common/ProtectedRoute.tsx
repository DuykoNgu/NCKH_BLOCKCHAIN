import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  redirectTo = "/login",
}) => {
  const { isLoggedIn, role, isLoading } = useAuth();

  // Đợi cho đến khi AuthContext nạp xong dữ liệu từ localStorage
  if (isLoading) {
    return null; // Hoặc một cái Spinner/Skeleton nếu muốn
  }

  if (!isLoggedIn || !role) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.map(r => r.toLowerCase()).includes(role.toLowerCase() as any)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
