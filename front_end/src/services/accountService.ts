import api from "@configs/axios.config";
import { AUTH_SERVER } from "../constants/api";

export interface AccountInfo {
  address: string;
  public_key: string;
  role: string;
  org_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string | null;
  tax_id?: string;
}

class AccountServiceClass {
  async getAllAccounts(): Promise<{
    success: boolean;
    total: number;
    accounts: AccountInfo[];
  }> {
    const response = await api.get(AUTH_SERVER.GET_ALL);
    return response.data;
  }
}

export const AccountService = new AccountServiceClass();
