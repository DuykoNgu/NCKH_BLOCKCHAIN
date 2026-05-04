import { useAuthContext } from "@/contexts/AuthContext";

export const useAuth = () => {
  const context = useAuthContext();

  return {
    ...context,
    isAdmin: context.role === "admin" || context.role === "moet",
    isValidator: context.role === "validator",
    isUser: context.role === "client",
  };
};
