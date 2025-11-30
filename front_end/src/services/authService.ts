import api from '@configs/axios.config';
import { AUTH_SERVER } from '@/constants/api';
import type {WalletLoginData, WalletRegisterData, WalletCreateRequest, AuthResponse } from '@/types/auth';

export const postWalletLogin = async (data: WalletLoginData): Promise<AuthResponse> => {
  // TODO: Đang chờ API backend /auth/wallet/login
  const response = await api.post(AUTH_SERVER.WALLET_LOGIN, data);
  return response.data;
};

export const postWalletRegister = async (data: WalletCreateRequest): Promise<WalletRegisterData> => {
  // TODO: Đang chờ API backend /auth/wallet/register
  const response = await api.post(AUTH_SERVER.WALLET_REGISTER, data);
  return response.data;
};