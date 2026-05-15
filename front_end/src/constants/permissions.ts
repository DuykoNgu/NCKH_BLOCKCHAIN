import type { UserRole } from "@/types/auth";

/**
 * Định nghĩa quyền truy cập các Route chính
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/home": ["admin", "moet", "validator", "client"],
  "/admin": ["admin", "moet"],
  "/admin/degrees": ["admin", "moet"],
  "/admin/verify": ["admin", "moet"],
  "/admin/transactions": ["admin", "moet"],
  "/admin/students": ["admin", "moet"],
  "/admin/network": ["admin", "moet"],
  "/admin/contracts": ["admin", "moet"],
  "/admin/settings": ["admin", "moet"],
  "/admin/validators": ["admin", "moet"],
  
  // Validator Routes
  "/admin-validator": ["validator"],
  "/admin-validator/degrees": ["validator"],
  "/admin-validator/verify": ["validator"],
  "/admin-validator/transactions": ["validator"],
  "/admin-validator/students": ["validator"],
  "/admin-validator/settings": ["validator"],
  "/admin-validator/network": ["validator"],
};

/**
 * Định nghĩa quyền thực hiện các hành động (Action-based)
 */
export const ACTION_PERMISSIONS = {
  MINT_NFT: ["admin", "moet", "validator"],
  REVOKE_NFT: ["admin", "moet"],
  MANAGE_USERS: ["admin", "moet"],
  VIEW_NETWORK_STATS: ["admin", "moet"],
  REGISTER_VALIDATOR: ["admin", "moet"],
};

/**
 * Kiểm tra xem một Role có quyền truy cập Route hay không
 */
export const hasRoutePermission = (role: UserRole | null, path: string): boolean => {
  if (!role) return false;
  if (role === "admin" || role === "moet") return true; // Super admin

  const allowedRoles = ROUTE_PERMISSIONS[path];
  if (!allowedRoles) return true; // Mặc định cho phép nếu không khai báo

  return allowedRoles.map(r => r.toLowerCase()).includes(role.toLowerCase());
};

/**
 * Kiểm tra xem một Role có quyền thực hiện hành động hay không
 */
export const hasActionPermission = (role: UserRole | null, action: keyof typeof ACTION_PERMISSIONS): boolean => {
  if (!role) return false;
  if (role === "admin" || role === "moet") return true;

  const allowedRoles = ACTION_PERMISSIONS[action];
  return allowedRoles.includes(role);
};
