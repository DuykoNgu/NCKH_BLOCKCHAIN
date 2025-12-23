import type { UserRole } from "@/types/auth";

export const useAuth = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const role = localStorage.getItem("role") as UserRole | null;

  return {
    isLoggedIn,
    role,
    isAdmin: role === "admin",
    isUser: role === "client",
  };
};
