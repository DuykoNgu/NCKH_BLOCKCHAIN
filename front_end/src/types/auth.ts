export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: string;
  university: string;
  hometown: string;
}

export interface AuthResponse {
  access_token: string;
  // Add other fields as needed
}