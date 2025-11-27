import api from '@configs/axios.config';
import { AUTH_SERVER } from '@/constants/api';
import type { LoginData, RegisterData, AuthResponse } from '@/types/auth';

export const postLogin = async (data: LoginData): Promise<AuthResponse> => {
  // TODO: Đang chờ API backend /auth/login
  const response = await api.post(AUTH_SERVER.LOGIN, data);
  return response.data;
};

export const postRegister = async (data: RegisterData): Promise<any> => {
  // TODO: Đang chờ API backend /auth/register
  const response = await api.post(AUTH_SERVER.REGISTER, data);
  return response.data;
};