import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserRole, User } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  role: UserRole | null;
  address: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  login: (userData: any) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Khởi tạo trạng thái từ localStorage
    const savedIsLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const savedAddress = localStorage.getItem("address");
    const savedRole = localStorage.getItem("role") as UserRole | null;
    const savedFullName = localStorage.getItem("full_name");
    const savedAvatarUrl = localStorage.getItem("avatar_url");
    const savedPublicKey = localStorage.getItem("public_key");

    if (savedIsLoggedIn && savedAddress) {
      setIsLoggedIn(true);
      setAddress(savedAddress);
      setRole(savedRole);
      setFullName(savedFullName);
      setAvatarUrl(savedAvatarUrl);
      
      if (savedPublicKey) {
        setUser({
          user_id: "", // ID có thể lấy từ BE nếu cần, tạm thời để trống
          address: savedAddress,
          role: savedRole || 'client',
          public_key: savedPublicKey
        });
      }
    }
    setIsLoading(false);
  }, []);

  const login = (authData: any) => {
    const { user: userData, token } = authData;
    
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("access_token", token);
    localStorage.setItem("address", userData.address);
    localStorage.setItem("role", userData.role);
    localStorage.setItem("full_name", userData.full_name || "");
    localStorage.setItem("avatar_url", userData.avatar_url || "");
    localStorage.setItem("public_key", userData.public_key);

    setIsLoggedIn(true);
    setAddress(userData.address);
    setRole(userData.role);
    setFullName(userData.full_name || "");
    setAvatarUrl(userData.avatar_url || "");
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear(); // Xóa tất cả cho an toàn
    setIsLoggedIn(false);
    setAddress(null);
    setRole(null);
    setFullName(null);
    setAvatarUrl(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoggedIn, 
      role, 
      address, 
      fullName, 
      avatarUrl, 
      login, 
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
