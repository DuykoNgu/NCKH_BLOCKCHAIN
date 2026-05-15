import { useAuthContext } from "@/contexts/AuthContext";

export const useAuth = () => {
  const context = useAuthContext();

  return {
    ...context,
    isAdmin: context.role?.toLowerCase() === "admin" || context.role?.toLowerCase() === "moet",
    isValidator: context.role?.toLowerCase() === "validator",
    isUser: context.role?.toLowerCase() === "client",
    isPendingApproval: context.isPendingApproval,
  };
};
