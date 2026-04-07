import { decryptPrivateKey, encryptPrivateKey, uint8ArrayToHex } from "@/utils/cryptoVault";
import saveUserData from "@/utils/saveDataToStorage";
import { generateWallet, restoreWallet, validateMnemonic, bytesToHex } from "@/utils/walletGenerator";
import { AUTH_SERVER } from "@/constants/api";
import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { hmac } from "@noble/hashes/hmac.js";
secp.hashes.sha256 = (msg) => sha256(msg);
secp.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);
export interface CreateWalletResult {
  mnemonic: string;
  address: string;
}

export const createWallet = async (password: string): Promise<CreateWalletResult> => {
  // Tạo ví mới với seed phrase (BIP39)
  const { mnemonic, privateKey, publicKey, address } = await generateWallet();

  // Mã hóa private key bằng password
  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vault = { encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) };

  const userData = {
    user_id: Math.random().toString(36).substr(2, 9),
    public_key: uint8ArrayToHex(publicKey),
    address: address.toLowerCase(),
    vault,
    role: "client",
    is_active: "1",
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

export const registerSchool = async (
  password: string, 
  schoolName: string,
  taxId: string,
  representative: string,
  email: string,
  phone: string
): Promise<CreateWalletResult> => {
  // Tạo ví mới với seed phrase (BIP39)
  const { mnemonic, privateKey, publicKey, address } = await generateWallet();

  // Mã hóa private key bằng password
  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vault = { encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) };

  const userData: Record<string, any> = {
    user_id: Math.random().toString(36).substr(2, 9),
    public_key: uint8ArrayToHex(publicKey),
    address: address.toLowerCase(),
    vault,
    role: "validator",
    is_active: "0",
  };

  // Đăng ký với Backend
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.WALLET_REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: address.toLowerCase(),
        public_key: uint8ArrayToHex(publicKey),
        role: "validator"
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend school registration failed:', errorData);
    } else {
      // Đăng ký thành công thì cập nhật tên trường + KYC
      await updateProfile(address, schoolName, undefined, taxId, representative, email, phone);
    }
  } catch (error) {
    console.error('Network error during school registration:', error);
  }

  userData["full_name"] = schoolName;
  saveUserData(userData);

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
    is_active: "1",
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

  // Cập nhật profile (bao gồm state is_active) từ backend để đảm bảo role/status mới nhất
  try {
    const profile = await fetchProfile(address);
    if (profile && profile.user) {
      localStorage.setItem("role", profile.user.role || "client");
      localStorage.setItem("is_active", String(profile.user.is_active ?? 1));
      localStorage.setItem("full_name", profile.user.full_name || "");
    }
  } catch (err) {
    console.warn("Could not fetch latest profile on login", err);
  }

  localStorage.setItem("isLoggedIn", "true");
  console.log('[LoginWallet] Wallet unlocked successfully');
  
  return privateKey;
};

export const adminLoginWithPrivateKey = async (privateKeyHex: string) => {
  try {
    // Lấy Public Key từ Private Key
    const cleanKey = privateKeyHex.replace(/^0x/i, '').replace(/\s+/g, '');
    if (cleanKey.length !== 64) {
      throw new Error(`Private key hex length must be exactly 64 characters. Got length: ${cleanKey.length}`);
    }
    const privateKey = secp.etc.hexToBytes(cleanKey);
    const publicKeyBytes = secp.getPublicKey(privateKey, false);
    
    // Tạo địa chỉ
    // Note: this assumes walletGenerator produces Ethereum-style keccak addresses. 
    // Mượn logic tương tự trong utils
    const { keccak_256 } = await import("@noble/hashes/sha3.js");
    const address = "0x" + bytesToHex(keccak_256(publicKeyBytes.slice(1))).slice(-40);

    // Get Nonce
    const nonceRes = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.WALLET_NONCE}?address=${address.toLowerCase()}`);
    if (!nonceRes.ok) throw new Error("Failed to fetch nonce");
    const { nonce } = await nonceRes.json();

    // Chuẩn bị msg_hash
    const encoder = new TextEncoder();
    const msgHashRaw = await crypto.subtle.digest("SHA-256", encoder.encode(nonce));
    const msgHash = new Uint8Array(msgHashRaw);
    const msgHex = bytesToHex(msgHash);

    // Ký msg (với prehash: false vì chúng ta đã tự hash bằng WebCrypto)
    const signatureRaw = secp.sign(msgHash, privateKey, { prehash: false });
    const signatureHex = bytesToHex(signatureRaw);

    // Verify
    const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.WALLET_LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: address.toLowerCase(),
        msg_hash: msgHex,
        signature: signatureHex
      }),
    });

    if (!verifyRes.ok) {
      const errorData = await verifyRes.json();
      throw new Error(errorData.message || "Invalid credentials");
    }

    const verifyData = await verifyRes.json();
    if (verifyData.status === "success" && verifyData.user) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('address', verifyData.user.address);
      localStorage.setItem('role', verifyData.user.role || 'moet');
      localStorage.setItem('full_name', verifyData.user.full_name || 'MOET Admin');
      return true;
    }
  } catch (error) {
    console.error("Admin login failed:", error);
    throw error;
  }
};

export const logoutUser = (): void => {
  localStorage.removeItem('isLoggedIn');
};

export const updateProfile = async (
  address: string, 
  fullName: string, 
  avatarUrl?: string,
  taxId?: string,
  representative?: string,
  email?: string,
  phone?: string
) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.PROFILE_UPDATE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      address: address.toLowerCase(), 
      full_name: fullName, 
      avatar_url: avatarUrl,
      tax_id: taxId,
      representative: representative,
      email: email,
      phone: phone
    }),
  });

  const result = await response.json();
  if (result.user) {
    localStorage.setItem('full_name', result.user.full_name || '');
    localStorage.setItem('avatar_url', result.user.avatar_url || '');
  }
  return result;
};

export const fetchProfile = async (address: string) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.GET_PROFILE.replace(':address', address)}`);
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
};

export const getPendingValidators = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.GET_PENDING_VALIDATORS}`);
  if (!response.ok) throw new Error("Failed to fetch pending validators");
  const data = await response.json();
  return data.data || [];
};

export const approveValidator = async (address: string) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.APPROVE_VALIDATOR}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: address.toLowerCase() })
  });
  if (!response.ok) throw new Error("Failed to approve validator");
  return response.json();
};
