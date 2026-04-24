import React, { createContext, useState, useCallback, type ReactNode } from 'react';
import { loginWallet } from '@/services/authService';

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
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null);
  const [address, setAddress] = useState<string | null>(localStorage.getItem("address"));
  const [publicKey, setPublicKey] = useState<string | null>(localStorage.getItem("public_key"));

  const isUnlocked = !!privateKey;

  const unlock = useCallback(async (password: string) => {
    try {
      const decryptedKey = await loginWallet(password);
      if (decryptedKey) {
        setPrivateKey(decryptedKey);
        // Refresh address and public key from storage if they were missing
        setAddress(localStorage.getItem("address"));
        setPublicKey(localStorage.getItem("public_key"));
      }
    } catch (error) {
      console.error("Failed to unlock wallet:", error);
      throw error;
    }
  }, []);

  const lock = useCallback(() => {
    setPrivateKey(null);
    localStorage.removeItem("isLoggedIn");
    console.log('[WalletContext] User logged out, session cleared');
  }, []);

  const clearWallet = useCallback(() => {
    setPrivateKey(null);
    setAddress(null);
    setPublicKey(null);
    
    // Clear all wallet and session data
    const items = ["isLoggedIn", "role", "address", "public_key", "full_name", "is_active", "avatar_url", "vault", "accounts"];
    items.forEach(item => localStorage.removeItem(item));
    
    console.log('[WalletContext] Wallet completely cleared from device');
  }, []);

  return (
    <WalletContext.Provider value={{ privateKey, address, publicKey, isUnlocked, unlock, lock, clearWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

