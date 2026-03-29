import { decryptPrivateKey, encryptPrivateKey, uint8ArrayToHex } from "@/ultis/cryptoVault";
import saveUserData from "@/ultis/saveDataToStorage";
import { generateWallet, restoreWallet, validateMnemonic, bytesToHex } from "@/ultis/walletGenerator";
import { AUTH_SERVER } from "@/constants/api";

export interface CreateWalletResult {
  mnemonic: string;
  address: string;
}

export const createWallet = async (password: string): Promise<CreateWalletResult> => {
  // Tạo ví mới với seed phrase (BIP39)
  const { mnemonic, privateKey, publicKey, address } = await generateWallet();

  console.log("mnemonic -",mnemonic);

  console.log("privatekey -",bytesToHex(privateKey));

  console.log("Adress- ",address);

  // Mã hóa private key bằng password
  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vault = { encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) };

  const userData = {
    user_id: Math.random().toString(36).substr(2, 9),
    public_key: uint8ArrayToHex(publicKey),
    address: address.toLowerCase(),
    vault,
    role: "client",
  };

  // Đăng ký với Backend
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.WALLET_REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: address.toLowerCase(),
        public_key: uint8ArrayToHex(publicKey),
        role: "client"
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend registration failed:', errorData);
    }
  } catch (error) {
    console.error('Network error during registration:', error);
  }

  saveUserData(userData);

  // Trả về mnemonic để hiển thị cho user backup
  return { mnemonic, address };
};

export const importWallet = async (mnemonic: string, password: string): Promise<{ address: string }> => {
  // Validate mnemonic
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase");
  }

  // Khôi phục ví từ mnemonic
  const { privateKey, publicKey, address } = await restoreWallet(mnemonic);

  // Mã hóa và lưu
  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vault = { encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) };

  const userData = {
    user_id: Math.random().toString(36).substr(2, 9),
    public_key: uint8ArrayToHex(publicKey),
    address: address.toLowerCase(),
    vault,
    role: "client",
  };

  // Đăng ký với Backend
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.WALLET_REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: address.toLowerCase(),
        public_key: uint8ArrayToHex(publicKey),
        role: "client"
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend registration failed:', errorData);
    }
  } catch (error) {
    console.error('Network error during registration:', error);
  }

  saveUserData(userData);

  // Set login state so user can access home
  localStorage.setItem('isLoggedIn', 'true');

  return { address };
};

export const loginWallet = async (password: string): Promise<Uint8Array> => {
  console.log('[LoginWallet] Retrieving wallet data from localStorage');
  const address = localStorage.getItem("address");
  const vaultData = localStorage.getItem("vault");

  if (!address || !vaultData) {
    console.warn('[LoginWallet] Wallet not found in localStorage');
    throw new Error('No wallet found. Please create a wallet first.');
  }

  console.log(`[LoginWallet] Wallet address: ${address}`);
  const vault = JSON.parse(vaultData);
  console.log('[LoginWallet] Vault data parsed successfully');

  console.log('[LoginWallet] Decrypting private key');
  const privateKey = await decryptPrivateKey(vault, password);
  console.log('[LoginWallet] Private key decrypted successfully');

  localStorage.setItem("isLoggedIn", "true");
  console.log('[LoginWallet] Wallet unlocked successfully');
  
  return privateKey;
};

export const logoutUser = (): void => {
  localStorage.removeItem('isLoggedIn');
};

export const updateProfile = async (address: string, fullName: string, avatarUrl?: string) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.PROFILE_UPDATE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      address: address.toLowerCase(), 
      full_name: fullName, 
      avatar_url: avatarUrl 
    }),
  });

  const result = await response.json();
  if (result.user) {
    localStorage.setItem('full_name', result.user.full_name || '');
    localStorage.setItem('avatar_url', result.user.avatar_url || '');
  }
  return result;
};
