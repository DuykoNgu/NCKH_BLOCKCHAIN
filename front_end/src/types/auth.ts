export interface WalletLoginData {
  private_key?: string;
  address?: string;
}

export interface WalletRegisterData {
  client_id: string;
  public_key: string;
  address: string;
}

export interface WalletCreateRequest {
  // Empty for now, backend generates everything
}

export interface AuthResponse {
  access_token: string;
  // Add other fields as needed
}