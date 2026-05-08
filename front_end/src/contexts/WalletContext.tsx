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
  clearWallet: () => void;
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
      const decryptedKey = await loginWalletFlow(password);

      if (decryptedKey) {
        setPrivateKey(decryptedKey);

        // Sync with AuthContext based on localStorage which loginWalletFlow updated
        login({
          user: {
            address: localStorage.getItem("address") || "",
            role: localStorage.getItem("role") || "client",
            full_name: localStorage.getItem("full_name") || "",
            is_active: localStorage.getItem("is_active") === "1" ? 1 : 0,
            public_key: localStorage.getItem("public_key") || ""
          },
          token: localStorage.getItem("access_token") || ""
        });

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

  const clearWallet = useCallback(() => {
    setPrivateKey(null);
    setAddress(null);
    setPublicKey(null);

    // Clear all wallet and session data
    const items = ["isLoggedIn", "role", "address", "public_key", "full_name", "is_active", "avatar_url", "vault", "accounts"];
    items.forEach(item => localStorage.removeItem(item));
    
    logout();
    console.log('[WalletContext] Wallet completely cleared from device');
  }, [logout]);

  return (
    <WalletContext.Provider value={{ privateKey, address, publicKey, isUnlocked, unlock, lock, clearWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
