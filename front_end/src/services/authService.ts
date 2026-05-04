import { decryptPrivateKey, encryptPrivateKey, uint8ArrayToHex } from "@/utils/cryptoVault";
import saveUserData from "@/utils/saveDataToStorage";
import { generateWallet, restoreWallet, validateMnemonic } from "@/utils/walletGenerator";
import { AUTH_SERVER } from "@/constants/api";
import { calculateHashHex, signData } from "@/utils/cryptoUtils";
import api from "@configs/axios.config";

export interface CreateWalletResult {
  mnemonic: string;
  address: string;
}

export const createWallet = async (password: string): Promise<CreateWalletResult> => {
  const { mnemonic, privateKey, publicKey, address } = await generateWallet();
  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vault = { encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) };

  const userData = {
    user_id: Math.random().toString(36).substr(2, 9),
    public_key: uint8ArrayToHex(publicKey),
    address: address.toLowerCase(),
    vault,
    role: "client",
  };

  try {
    await api.post(AUTH_SERVER.WALLET_REGISTER, {
      address: address.toLowerCase(),
      public_key: uint8ArrayToHex(publicKey),
      role: "client"
    });
  } catch (error) {
    console.error('Backend registration failed:', error);
  }

  saveUserData(userData);
  return { mnemonic, address };
};

export const importWallet = async (mnemonic: string, password: string): Promise<{ address: string }> => {
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase");
  }

  const { privateKey, publicKey, address } = await restoreWallet(mnemonic);
  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vault = { encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) };

  const userData = {
    user_id: Math.random().toString(36).substr(2, 9),
    public_key: uint8ArrayToHex(publicKey),
    address: address.toLowerCase(),
    vault,
    role: "client",
  };

  try {
    await api.post(AUTH_SERVER.WALLET_REGISTER, {
      address: address.toLowerCase(),
      public_key: uint8ArrayToHex(publicKey),
      role: "client"
    });
  } catch (error) {
    console.error('Backend registration failed:', error);
  }

  saveUserData(userData);
  localStorage.setItem('isLoggedIn', 'true');

  return { address };
};

export const getNonce = async (address: string): Promise<string> => {
  const response = await api.get(AUTH_SERVER.WALLET_NONCE, {
    params: { address: address.toLowerCase() }
  });
  return response.data.nonce;
};

export const verifyWithBackend = async (address: string, signature: string, msgHash: string) => {
  const response = await api.post(AUTH_SERVER.WALLET_LOGIN, {
    address: address.toLowerCase(),
    signature,
    msg_hash: msgHash
  });
  return response.data;
};

/**
 * Đăng nhập ví: Giải mã và xác thực với BE
 */
export const loginWalletFlow = async (password: string): Promise<{ privateKey: Uint8Array, authData: any }> => {
  const address = localStorage.getItem("address");
  const vaultData = localStorage.getItem("vault");

  if (!address || !vaultData) {
    throw new Error('No wallet found. Please create a wallet first.');
  }

  const vault = JSON.parse(vaultData);
  const privateKey = await decryptPrivateKey(vault, password);
  
  const nonce = await getNonce(address);
  const msgHash = calculateHashHex(nonce);
  const signature = await signData(nonce, privateKey);
  const authData = await verifyWithBackend(address, signature, msgHash);
  
  return { privateKey, authData };
};

export const logoutUser = (): void => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('access_token');
  localStorage.removeItem('role');
};

export const updateProfile = async (address: string, fullName: string, avatarUrl?: string) => {
  const response = await api.post(AUTH_SERVER.PROFILE_UPDATE, { 
    address: address.toLowerCase(), 
    full_name: fullName, 
    avatar_url: avatarUrl 
  });

  const result = response.data;
  return result;
};
