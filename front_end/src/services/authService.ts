import { decryptPrivateKey, encryptPrivateKey, uint8ArrayToHex } from "@/utils/cryptoVault";
import saveUserData from "@/utils/saveDataToStorage";
import { generateWallet, restoreWallet, validateMnemonic, bytesToHex } from "@/utils/walletGenerator";
import { savePasswordToSession, clearPasswordFromSession } from "@/hooks/usePassword";
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

export const clearOldSession = () => {
  const items = ["role", "address", "public_key", "full_name", "is_active", "avatar_url", "vault", "isLoggedIn", "accounts"];
  items.forEach(item => localStorage.removeItem(item));
  // Xóa password khỏi session storage
  clearPasswordFromSession();
  console.log('[authService] Local session cleared');
};

export const checkUniqueEmail = async (email: string): Promise<boolean> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.CHECK_UNIQUE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return !data.exists; // Returns true if unique (not exists)
  } catch (error) {
    console.error('Check unique email error:', error);
    return false;
  }
};

export const createWallet = async (password: string, email: string): Promise<CreateWalletResult> => {
  clearOldSession();

  // Check email uniqueness first
  const isUnique = await checkUniqueEmail(email);
  if (!isUnique) {
    throw new Error("Email hoặc tài khoản đã tồn tại trong hệ thống.");
  }

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
        role: "client",
        vault: JSON.stringify(vault)
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
  clearOldSession();

  // Check email uniqueness first
  const isUnique = await checkUniqueEmail(email);
  if (!isUnique) {
    throw new Error("Email hoặc tài khoản đã tồn tại trong hệ thống.");
  }

  // Tạo ví mới với seed phrase (BIP39)
  const { mnemonic, privateKey, publicKey, address } = await generateWallet();

  // Mã hóa private key bằng password
  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vault = { encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) };

  // Đăng ký với Backend
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.WALLET_REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: address.toLowerCase(),
        public_key: uint8ArrayToHex(publicKey),
        role: "validator",
        vault: JSON.stringify(vault)
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

  const userData: Record<string, unknown> = {
    user_id: Math.random().toString(36).substr(2, 9),
    public_key: uint8ArrayToHex(publicKey),
    address: address.toLowerCase(),
    vault,
    role: "validator",
    full_name: schoolName,
    is_active: "0",
  };

  saveUserData(userData);

  return { mnemonic, address };
};

export const importWallet = async (mnemonic: string, password: string): Promise<{ address: string }> => {
  // Validate mnemonic
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  // Restore wallet
  const { privateKey, publicKey, address } = await restoreWallet(mnemonic);

  // Encrypt and prepare vault
  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vault = { encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) };

  // Try to fetch existing profile first
  let profile: any = null;
  try {
    profile = await fetchProfile(address.toLowerCase());
  } catch (e) {
    // profile not found – will register later
  }

  if (!profile || !profile.user) {
    // Register wallet (ignore duplicate errors)
    try {
      await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.WALLET_REGISTER}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.toLowerCase(),
          public_key: uint8ArrayToHex(publicKey),
          role: "client",
          vault: JSON.stringify(vault)
        })
      });
    } catch (error) {
      console.warn('Wallet registration error (may be duplicate):', error);
    }
    // Fetch profile again after registration
    try {
      profile = await fetchProfile(address.toLowerCase());
    } catch (e) {
      console.warn('Could not fetch profile after registration:', e);
    }
  }

  if (profile && profile.user) {
    // Save full profile data (including role, full_name, etc.)
    saveUserData({
      ...profile.user,
      public_key: uint8ArrayToHex(publicKey),
      vault,
      is_active: String(profile.user.is_active)
    });
  } else {
    // Fallback: generic user data
    const userData = {
      user_id: Math.random().toString(36).substr(2, 9),
      public_key: uint8ArrayToHex(publicKey),
      address: address.toLowerCase(),
      vault,
      role: "client",
      is_active: "1",
    };
    saveUserData(userData);
  }

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
  if (!vault || !vault.encrypted || !vault.iv) {
    console.error('[LoginWallet] Invalid vault structure:', vault);
    throw new Error('Dữ liệu ví bị lỗi hoặc không hợp lệ. Vui lòng thử Import lại ví.');
  }
  console.log('[LoginWallet] Vault data parsed successfully');

  console.log('[LoginWallet] Decrypting private key');
  const privateKey = await decryptPrivateKey(vault, password);
  console.log('[LoginWallet] Private key decrypted successfully');

  // Cập nhật profile (bao gồm state is_active) từ backend để đảm bảo role/status mới nhất
  try {
    const profile = await fetchProfile(address);
    if (profile && profile.user) {
      // Chỉ đồng bộ vault nếu server có vault, nếu không thì giữ vault local hiện tại
      const updatedVault = profile.user.vault || vault;
      
      saveUserData({
        ...profile.user,
        full_name: profile.user.full_name || "",
        vault: updatedVault,
        is_active: String(profile.user.is_active)
      });
      console.log(`[authService] Sync success for address: ${address}`);
    }
  } catch (err) {
    console.warn("Could not fetch latest profile on login", err);
  }

  localStorage.setItem("isLoggedIn", "true");
  console.log('[LoginWallet] Wallet unlocked successfully');

  // Lưu password vào session storage để dùng cho signing
  savePasswordToSession(password);
  console.log('[authService] Password saved to session storage');

  return privateKey;
};

/**
 * Lần đầu: Nhập Private Key để xác thực với server, sau đó mã hoá và lưu vault cục bộ.
 * Những lần sau chỉ cần dùng adminUnlockVault() bằng mật khẩu.
 */
export const adminImportAndSaveVault = async (privateKeyHex: string, password: string) => {
  const cleanKey = privateKeyHex.replace(/^0x/i, '').replace(/\s+/g, '');
  if (cleanKey.length !== 64) {
    throw new Error(`Private key phải đúng 64 ký tự hex. Hiện có: ${cleanKey.length}`);
  }

  const privateKeyBytes = secp.etc.hexToBytes(cleanKey);
  const publicKeyBytes = secp.getPublicKey(privateKeyBytes, false);
  const { keccak_256 } = await import("@noble/hashes/sha3.js");
  const address = "0x" + bytesToHex(keccak_256(publicKeyBytes.slice(1))).slice(-40);

  // Xác thực với server (challenge-response)
  const nonceRes = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.WALLET_NONCE}?address=${address.toLowerCase()}`);
  if (!nonceRes.ok) throw new Error("Không lấy được nonce từ server");
  const { nonce } = await nonceRes.json();

  const encoder = new TextEncoder();
  const msgHash = sha256(encoder.encode(nonce));
  const msgHex = bytesToHex(msgHash);

  const signatureRaw = secp.sign(msgHash, privateKeyBytes, { prehash: false });
  const signatureHex = bytesToHex(signatureRaw);

  const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.WALLET_LOGIN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: address.toLowerCase(), msg_hash: msgHex, signature: signatureHex }),
  });

  if (!verifyRes.ok) {
    const errData = await verifyRes.json();
    throw new Error(errData.message || "Xác thực thất bại – địa chỉ không tồn tại hoặc sai khoá");
  }

  const verifyData = await verifyRes.json();
  if (verifyData.status !== "success" || !verifyData.user) {
    throw new Error("Tài khoản không hợp lệ");
  }

  // Kiểm tra quyền admin
  const role = verifyData.user.role;
  if (role !== 'moet' && role !== 'admin') {
    throw new Error("Tài khoản này không có quyền quản trị MOET");
  }

  // Mã hoá private key → lưu vault riêng cho admin
  const { encrypted, iv } = await encryptPrivateKey(privateKeyBytes, password);
  const adminVault = { encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) };
  localStorage.setItem('admin_vault', JSON.stringify(adminVault));
  localStorage.setItem('admin_address', address.toLowerCase());

  // Lưu thông tin phiên
  localStorage.setItem('isLoggedIn', 'true');
  saveUserData({
    ...verifyData.user,
    full_name: verifyData.user.full_name || 'MOET Admin',
    is_active: "1",
  });

  return true;
};

/**
 * Những lần sau: Mở khoá admin vault bằng mật khẩu cục bộ (không cần private key nữa).
 */
export const adminUnlockVault = async (password: string) => {
  const adminVaultRaw = localStorage.getItem('admin_vault');
  const adminAddress = localStorage.getItem('admin_address');

  if (!adminVaultRaw || !adminAddress) {
    throw new Error("Chưa thiết lập tài khoản admin trên thiết bị này");
  }

  const vault = JSON.parse(adminVaultRaw);
  // Thử giải mã – nếu sai mật khẩu sẽ throw (kết quả không cần dùng tiếp)
  await decryptPrivateKey(vault, password);

  // Lấy thông tin mới nhất từ server (đảm bảo vẫn còn quyền admin)
  try {
    const profile = await fetchProfile(adminAddress);
    if (profile && profile.user) {
      const role = profile.user.role;
      if (role !== 'moet' && role !== 'admin') {
        throw new Error("Tài khoản này không còn quyền quản trị");
      }
      saveUserData({ ...profile.user, is_active: "1" });
    }
  } catch (e: any) {
    if (e.message?.includes('quyền')) throw e;
    console.warn("[adminUnlockVault] Không thể lấy profile, dùng cache cục bộ:", e);
  }

  localStorage.setItem('isLoggedIn', 'true');
  return true;
};

/** Đăng xuất Admin – xoá phiên nhưng GIỮ vault để đăng nhập lại bằng mật khẩu */
export const adminLogout = (): void => {
  localStorage.removeItem('isLoggedIn');
  // Không xoá admin_vault và admin_address để lần sau dùng mật khẩu thôi
};

/** Xoá hoàn toàn Admin vault khỏi thiết bị (dùng khi muốn đổi tài khoản) */
export const adminClearVault = (): void => {
  localStorage.removeItem('admin_vault');
  localStorage.removeItem('admin_address');
  localStorage.removeItem('isLoggedIn');
};

/** @deprecated Dùng adminImportAndSaveVault thay thế */
export const adminLoginWithPrivateKey = adminImportAndSaveVault;

export const logoutUser = (): void => {
  localStorage.removeItem('isLoggedIn');
  // Xóa password khỏi session storage khi logout
  clearPasswordFromSession();
  console.log('[authService] User logged out, password cleared');
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

export const updateVault = async (address: string, vault: string) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${AUTH_SERVER.UPDATE_VAULT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: address.toLowerCase(), vault }),
  });
  return response.json();
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

  // Set as primary keys for flat access
  const items: Record<string, string> = {
    address: account.address,
    vault: account.vault,
    full_name: account.full_name || '',
    role: account.role || 'client',
    public_key: account.public_key || '',
    is_active: account.is_active || '1'
  };

  Object.entries(items).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });

  return true;
};
