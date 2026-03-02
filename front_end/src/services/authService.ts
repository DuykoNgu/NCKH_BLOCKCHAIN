import { decryptPrivateKey, encryptPrivateKey, uint8ArrayToHex } from "@/ultis/cryptoVault";
import saveUserData from "@/ultis/saveDataToStorage";
import { generateWallet, restoreWallet, validateMnemonic } from "@/ultis/walletGenerator";

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
    address: address,
    vault,
    role: "client",
  };

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
    address: address,
    vault,
    role: "client",
  };

  saveUserData(userData);
  return { address };
};

export const loginWallet = async (password: string) => {
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
  await decryptPrivateKey(vault, password);
  console.log('[LoginWallet] Private key decrypted successfully');

  localStorage.setItem("isLoggedIn", "true");
  console.log('[LoginWallet] Wallet unlocked successfully');
};

export const logoutUser = (): void => {
  localStorage.removeItem('isLoggedIn');
};