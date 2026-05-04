import type { UserRole } from "@/types/auth";

export const useAuth = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const role = localStorage.getItem("role") as UserRole | null;
  const fullName = localStorage.getItem("full_name");
  const avatarUrl = localStorage.getItem("avatar_url");

  const address = localStorage.getItem("address");
  const isActive = localStorage.getItem("is_active") === "1";

  return {
    ...context,
    isAdmin: context.role === "admin" || context.role === "moet",
    isValidator: context.role === "validator",
    isUser: context.role === "client",
  };
};
