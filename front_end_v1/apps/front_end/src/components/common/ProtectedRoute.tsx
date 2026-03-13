import { Navigate, useNavigate} from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/auth";
import { useEffect } from "react";

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

  const navigate = useNavigate()

  const { isLoggedIn, role } = useAuth();

  useEffect(() => {
    if (!isLoggedIn || !role) {
      navigate(redirectTo, { replace: true });
    }
  }, [isLoggedIn, role, navigate ,redirectTo]);

  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />; // Tạo trang unauthorized nếu cần
  }

  return <>{children}</>;
};

export default ProtectedRoute;
