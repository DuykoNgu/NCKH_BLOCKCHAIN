import { decryptPrivateKey, encryptPrivateKey, uint8ArrayToHex } from "@/utils/cryptoVault";
import { generateWallet, restoreWallet, validateMnemonic } from "@/utils/walletGenerator";
import { savePasswordToSession, clearPasswordFromSession } from "@/hooks/usePassword";
import { AUTH_SERVER } from "@/constants/api";
import { calculateHashHex, signDataDER, bytesToHex } from "@/utils/cryptoUtils";
import api from "@configs/axios.config";
import * as secp from "@noble/secp256k1";
import saveUserData from "@/utils/saveDataToStorage";

export interface CreateWalletResult {
  mnemonic: string;
  address: string;
}

export const clearOldSession = () => {
  const items = ["role", "address", "public_key", "full_name", "is_active", "avatar_url", "vault", "isLoggedIn", "accounts"];
  items.forEach(item => localStorage.removeItem(item));
  // Xóa password khỏi session storage
  clearPasswordFromSession();
  console.log('[authService] Local session cleared');
};

/**
 * Đăng ký tài khoản (Register) với Backend kèm chữ ký số
 */
export const registerWithBE = async (
  address: string,
  publicKey: string,
  role: string,
  privateKey: Uint8Array,
  fullName?: string,
  taxId?: string,
  representative?: string,
  email?: string,
  phone?: string,
  vault?: string
) => {
  const timestamp = Date.now() / 1000;
  
  // Tạo data để ký (phải khớp với Backend TransactionAcount.get_signing_data)
  const signDataObj = {
    address: address.toLowerCase(),
    public_key: publicKey,
    role: role.toLowerCase(),
    timestamp: timestamp
  };
  const message = JSON.stringify(signDataObj).replace(/ /g, '');
  const signature = await signDataDER(message, privateKey);

  const response = await api.post(AUTH_SERVER.WALLET_REGISTER, {
    address: address.toLowerCase(),
    public_key: publicKey,
    role: role.toLowerCase(),
    signature,
    timestamp,
    full_name: fullName,
    tax_id: taxId,
    representative: representative,
    email: email,
    phone: phone,
    vault: vault // Gửi vault (đã mã hóa) lên server để backup
  });

  return response.data;
};

export const createWallet = async (password: string, email?: string): Promise<CreateWalletResult> => {
  clearOldSession();
  // Tạo ví mới với seed phrase (BIP39)
  const { mnemonic, privateKey, publicKey, address } = await generateWallet();
  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vaultStr = JSON.stringify({ encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) });

  const publicKeyHex = uint8ArrayToHex(publicKey);

  // Đăng ký với Backend kèm signature
  try {
    await registerWithBE(address, publicKeyHex, "client", privateKey, undefined, undefined, undefined, email, undefined, vaultStr);
  } catch (error) {
    console.error('Backend registration failed:', error);
    // Vẫn cho phép tiếp tục lưu local nếu BE lỗi (chế độ offline-first)
  }

  const userData = {
    user_id: Math.random().toString(36).substr(2, 9),
    public_key: publicKeyHex,
    address: address.toLowerCase(),
    vault: JSON.parse(vaultStr),
    role: "client",
    is_active: "1",
    email: email
  };

  saveUserData(userData);
  savePasswordToSession(password);
  
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
  clearOldSession();
  const { mnemonic, privateKey, publicKey, address } = await generateWallet();
  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vaultStr = JSON.stringify({ encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) });
  const publicKeyHex = uint8ArrayToHex(publicKey);

  // Đăng ký trường học với Backend
  try {
    await registerWithBE(
      address, 
      publicKeyHex, 
      "validator", 
      privateKey, 
      schoolName, 
      taxId, 
      representative, 
      email, 
      phone, 
      vaultStr
    );
  } catch (error) {
    console.error('Backend school registration failed:', error);
  }

  const userData = {
    user_id: Math.random().toString(36).substr(2, 9),
    public_key: publicKeyHex,
    address: address.toLowerCase(),
    vault: JSON.parse(vaultStr),
    role: "validator",
    full_name: schoolName,
    is_active: "0", // Chờ MOET duyệt
  };

  saveUserData(userData);
  savePasswordToSession(password);

  return { mnemonic, address };
};

export const importWallet = async (mnemonic: string, password: string): Promise<{ address: string }> => {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  const { privateKey, publicKey, address } = await restoreWallet(mnemonic);
  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vaultStr = JSON.stringify({ encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) });
  const publicKeyHex = uint8ArrayToHex(publicKey);

  // Thử đăng ký lại (hoặc cập nhật vault) với BE
  try {
    await registerWithBE(address, publicKeyHex, "client", privateKey, undefined, undefined, undefined, undefined, undefined, vaultStr);
  } catch (error) {
    console.warn('Sync with backend failed during import, continuing with local data');
  }

  const userData = {
    user_id: Math.random().toString(36).substr(2, 9),
    public_key: publicKeyHex,
    address: address.toLowerCase(),
    vault: JSON.parse(vaultStr),
    role: "client",
    is_active: "1",
  };

  saveUserData(userData);
  localStorage.setItem('isLoggedIn', 'true');
  savePasswordToSession(password);

  return { address };
};

export const loginWalletFlow = async (password: string): Promise<Uint8Array> => {
  const address = localStorage.getItem("address");
  const vaultData = localStorage.getItem("vault");

  if (!address || !vaultData) {
    throw new Error('No wallet found. Please create a wallet first.');
  }

  const vault = JSON.parse(vaultData);
  const privateKey = await decryptPrivateKey(vault, password);

  // Sync profile from backend
  try {
    const profile = await fetchProfile(address);
    if (profile && profile.user) {
      saveUserData({
        ...profile.user,
        is_active: String(profile.user.is_active)
      });
    }
  } catch (err) {
    console.warn("Could not fetch latest profile on login", err);
  }

  localStorage.setItem("isLoggedIn", "true");
  savePasswordToSession(password);

  return privateKey;
};

export const adminLoginWithPrivateKey = async (privateKeyHex: string) => {
  const cleanKey = privateKeyHex.replace(/^0x/i, '').replace(/\s+/g, '');
  if (cleanKey.length !== 64) {
    throw new Error(`Private key hex length must be 64 characters.`);
  }
  const privateKey = secp.etc.hexToBytes(cleanKey);
  const publicKeyBytes = secp.getPublicKey(privateKey, false);

  // Generate address (standard keccak256 hash of public key without 0x04 prefix)
  const { keccak_256 } = await import("@noble/hashes/sha3.js");
  const address = "0x" + bytesToHex(keccak_256(publicKeyBytes.slice(1))).slice(-40);

  // Get Nonce
  const nonce = await getNonce(address);

  // Ký nonce
  const signature = await signDataDER(nonce, privateKey);

  // Verify
  const verifyRes = await api.post(AUTH_SERVER.WALLET_LOGIN, {
    address: address.toLowerCase(),
    signature,
    msg_hash: calculateHashHex(nonce) // BE có thể mong đợi hash hoặc nonce gốc tùy thiết kế
  });

  const verifyData = verifyRes.data;
  if (verifyData.status === "success" && verifyData.user) {
    localStorage.setItem('isLoggedIn', 'true');
    saveUserData({
      ...verifyData.user,
      full_name: verifyData.user.full_name || 'MOET Admin',
      is_active: "1"
    });
    return true;
  }
  return false;
};

export const adminLogout = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('role');
  localStorage.removeItem('full_name');
  clearPasswordFromSession();
};

export const adminUnlockVault = async (password: string) => {
  const vaultData = localStorage.getItem('admin_vault');
  const address = localStorage.getItem('admin_address');
  if (!vaultData || !address) throw new Error("Không tìm thấy két sắt Admin trên thiết bị này.");

  const vault = JSON.parse(vaultData);
  const privateKey = await decryptPrivateKey(vault, password);
  
  // Sau khi giải mã thành công, thực hiện login bằng private key
  const privateKeyHex = uint8ArrayToHex(privateKey);
  await adminLoginWithPrivateKey(privateKeyHex);
  
  savePasswordToSession(password);
  return true;
};

export const adminImportAndSaveVault = async (privateKeyHex: string, password: string) => {
  // 1. Thực hiện login trước để kiểm tra Private Key hợp lệ
  await adminLoginWithPrivateKey(privateKeyHex);

  // 2. Nếu login thành công, tiến hành lưu vault cục bộ
  const cleanKey = privateKeyHex.replace(/^0x/i, '').replace(/\s+/g, '');
  const privateKey = secp.etc.hexToBytes(cleanKey);
  
  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vaultStr = JSON.stringify({ 
    encrypted: uint8ArrayToHex(encrypted), 
    iv: uint8ArrayToHex(iv) 
  });
  
  // Tính address admin
  const publicKeyBytes = secp.getPublicKey(privateKey, false);
  const { keccak_256 } = await import("@noble/hashes/sha3.js");
  const address = "0x" + bytesToHex(keccak_256(publicKeyBytes.slice(1))).slice(-40);

  localStorage.setItem('admin_vault', vaultStr);
  localStorage.setItem('admin_address', address);
  localStorage.setItem('role', 'admin');
  savePasswordToSession(password);
};

export const adminClearVault = () => {
  localStorage.removeItem('admin_vault');
  localStorage.removeItem('admin_address');
};

export const getNonce = async (address: string): Promise<string> => {
  const response = await api.get(AUTH_SERVER.WALLET_NONCE, {
    params: { address: address.toLowerCase() }
  });
  return response.data.nonce;
};

export const fetchProfile = async (address: string) => {
  const response = await api.get(AUTH_SERVER.GET_PROFILE.replace(':address', address.toLowerCase()));
  return response.data;
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
  const response = await api.post(AUTH_SERVER.PROFILE_UPDATE, {
    address: address.toLowerCase(),
    full_name: fullName,
    avatar_url: avatarUrl,
    tax_id: taxId,
    representative: representative,
    email: email,
    phone: phone
  });
  return response.data;
};

export const updateVault = async (address: string, vault: string) => {
  const response = await api.post(AUTH_SERVER.UPDATE_VAULT, { 
    address: address.toLowerCase(), 
    vault 
  });
  return response.data;
};

export const fetchVault = async (address: string): Promise<string | null> => {
  try {
    const profile = await fetchProfile(address);
    return profile?.user?.vault || null;
  } catch (err) {
    console.error('[authService] Failed to fetch vault:', err);
    return null;
  }
};

export const getPendingValidators = async () => {
  const response = await api.get(AUTH_SERVER.GET_PENDING_VALIDATORS);
  return response.data.data || [];
};

export const approveValidator = async (address: string) => {
  const response = await api.post(AUTH_SERVER.APPROVE_VALIDATOR, { address: address.toLowerCase() });
  return response.data;
};

export const getRecentAccounts = (): any[] => {
  try {
    const accountsRaw = localStorage.getItem('accounts');
    return accountsRaw ? JSON.parse(accountsRaw) : [];
  } catch (err) {
    console.error('[authService] Failed to parse accounts:', err);
    return [];
  }
};

export const switchAccount = (address: string): boolean => {
  const accounts = getRecentAccounts();
  const account = accounts.find((a: any) => a.address.toLowerCase() === address.toLowerCase());
  if (!account) return false;

  saveUserData(account);
  return true;
};
