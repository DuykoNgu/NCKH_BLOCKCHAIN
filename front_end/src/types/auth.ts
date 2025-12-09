export type UserRole = 'admin' | 'user' | 'guest';
export interface WalletLoginData {
  address: string;
  signature: string;
}
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  public_key: string;
  address: string;
  role: UserRole;
}

export interface UserCreateRequest {
  public_key: string;
  address: string;
  role: UserRole;
}

export interface UserRegisterData {
  user_id: string;        // ← Backend tự tạo
  public_key: string;
  address: string;
  role: UserRole;
}
export interface User {
  user_id: string;
  public_key: string;
  address: string;
  role: UserRole;
}
export interface AuthError {
  detail: string;
  code?: string;
}


export type FormFields = {
  password: string;
  confirmPassword: string;
  role: UserRole;
};
