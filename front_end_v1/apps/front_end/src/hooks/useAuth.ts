import type { UserRole } from "@/types/auth";

export const useAuth = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const role = localStorage.getItem("role") as UserRole | null;
  const fullName = localStorage.getItem("full_name");
  const avatarUrl = localStorage.getItem("avatar_url");

  const address = localStorage.getItem("address");

  return {
    isLoggedIn,
    role,
    fullName,
    avatarUrl,
    address,
    isAdmin: role === "admin" || role === "moet",
    isValidator: role === "validator",
    isUser: role === "client",
  };
};
