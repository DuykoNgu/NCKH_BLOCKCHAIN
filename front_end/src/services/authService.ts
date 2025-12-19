import { decryptPrivateKey, encryptPrivateKey, uint8ArrayToHex } from "@/ultis/cryptoVault";
import secp from "@configs/secp256k1.config";
import saveUserData from "@/ultis/saveDataToStorage";

export const createWallet = async (password: string, role: string) => {
  const privateKey = secp.utils.randomSecretKey();
  const publicKey = secp.getPublicKey(privateKey);
  const addressHash = await crypto.subtle.digest("SHA-256", publicKey as any);
  const address = uint8ArrayToHex(new Uint8Array(addressHash)).slice(0, 40);

  const { encrypted, iv } = await encryptPrivateKey(privateKey, password);
  const vault = { encrypted: uint8ArrayToHex(encrypted), iv: uint8ArrayToHex(iv) };

  const userData = {
    user_id: Math.random().toString(36).substr(2, 9),
    public_key: uint8ArrayToHex(publicKey),
    address: "0x" + address,
    vault,
    role,
  };

  saveUserData(userData);
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