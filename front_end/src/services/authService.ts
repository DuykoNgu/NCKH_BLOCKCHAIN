import api from "@configs/axios.config";
import { AUTH_SERVER } from "@/constants/api";
import type {
  WalletLoginData,
  UserRegisterData,
  AuthResponse,
  AuthError,
  UserRole,
} from "@/types/auth";

const handleApiError = (err: any, defaultMessage: string = "Request failed"): never => {
  const error: AuthError = err.response?.data || { detail: defaultMessage };
  throw new Error(error.detail || defaultMessage);
};

const saveAuthData = (data: AuthResponse) => {
  if (data.access_token) {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("address", data.address);
    localStorage.setItem("public_key", data.public_key);
    localStorage.setItem("role", data.role);
  }
};

export const postWalletLogin = async (
  data: WalletLoginData
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>(AUTH_SERVER.WALLET_LOGIN, data);
    saveAuthData(response.data);
    return response.data;
  } catch (err: any) {
    handleApiError(err, "Login failed");
    throw err;
  }
};

export const postWalletRegister = async (
  data: { public_key: string; address: string; role: UserRole }
): Promise<UserRegisterData> => {
  try {
    const res = await api.post(AUTH_SERVER.WALLET_REGISTER, data);
    return res.data;
  } catch (err: any) {
    handleApiError(err, "Registration failed");
    throw err;
  }
};

export const requestNonce = async (address: string) => {
  try {
    const res = await api.post(AUTH_SERVER.WALLET_NONCE, { address });
    return res.data.nonce;
  } catch (err) {
    handleApiError(err, "Failed to request nonce");
  }
};

export const verifySignatureLogin = async (
  data: { address: string; signature: string }
): Promise<AuthResponse> => {
  try {
    const res = await api.post(AUTH_SERVER.WALLET_LOGIN, data);
    saveAuthData(res.data);
    return res.data;
  } catch (err) {
    handleApiError(err, "Login failed");
    throw err;
  }
};


export const logoutUser = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('address');
  localStorage.removeItem('public_key');
  localStorage.removeItem('role');
  localStorage.removeItem('isLoggedIn');
}
