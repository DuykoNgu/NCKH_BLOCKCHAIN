import React, { createContext, useState, useCallback, type ReactNode } from 'react';
import { loginWalletFlow } from '@/services/authService';
import { useAuthContext } from '@/contexts/AuthContext';

interface WalletContextType {
  privateKey: Uint8Array | null;
  address: string | null;
  publicKey: string | null;
  isUnlocked: boolean;
  unlock: (password: string) => Promise<void>;
  lock: () => void;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { login, logout } = useAuthContext();
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null);
  const [address, setAddress] = useState<string | null>(localStorage.getItem("address"));
  const [publicKey, setPublicKey] = useState<string | null>(localStorage.getItem("public_key"));

  const isUnlocked = !!privateKey;

  const unlock = useCallback(async (password: string) => {
    try {
      const { privateKey: decryptedKey, authData } = await loginWalletFlow(password);
      
      if (decryptedKey) {
        setPrivateKey(decryptedKey);
        
        // Cập nhật AuthContext với dữ liệu từ Backend
        login(authData);
        
        // Refresh local state
        setAddress(localStorage.getItem("address"));
        setPublicKey(localStorage.getItem("public_key"));
      }
    } catch (error) {
      console.error("Failed to unlock wallet:", error);
      throw error;
    }
  }, [login]);

  const lock = useCallback(() => {
    setPrivateKey(null);
    logout();
  }, [logout]);

  return (
    <WalletContext.Provider value={{ privateKey, address, publicKey, isUnlocked, unlock, lock }}>
      {children}
    </WalletContext.Provider>
  );
};
