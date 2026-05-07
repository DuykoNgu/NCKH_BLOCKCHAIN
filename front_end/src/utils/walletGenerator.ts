import * as bip39 from "@scure/bip39";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { sha256 } from "@noble/hashes/sha2.js";
import * as secp from "@noble/secp256k1";
import { wordlist } from "@scure/bip39/wordlists/english.js";

/**
 * Uint8Array → Hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Tạo ví mới với seed phrase
 * @returns { mnemonic, privateKey, publicKey, address }
 */
export async function generateWallet() {
  // 1. Entropy ngẫu nhiên 128-bit (16 bytes) → 12 từ
  const entropy = crypto.getRandomValues(new Uint8Array(16));

  const mnemonic = bip39.entropyToMnemonic(entropy, wordlist);

  // 3. Mnemonic → Seed (512 bits)
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // 4. Seed → Private Key (SHA-256 của 32 bytes đầu)
  const hash = sha256(seed.slice(0, 32));
  const privateKey = new Uint8Array(hash);

  // 5. Private Key → Public Key (uncompressed 65 bytes)
  const publicKey = secp.getPublicKey(privateKey, false); // false = uncompressed

  // 6. Public Key → Address (Keccak-256, lấy 20 bytes cuối)
  // Public key uncompressed: byte đầu là 0x04, bỏ đi → lấy 64 bytes còn lại
  const address = "0x" + bytesToHex(keccak_256(publicKey.slice(1))).slice(-40);

  return { mnemonic, privateKey, publicKey, address };
}

/**
 * Khôi phục ví từ mnemonic
 * @param mnemonic - 12 từ seed phrase
 * @returns { mnemonic, privateKey, publicKey, address }
 */
export async function restoreWallet(mnemonic: string) {
  // Validate mnemonic
  if (!bip39.validateMnemonic(mnemonic, wordlist)) {
    throw new Error("Invalid mnemonic");
  }

  // Mnemonic → Seed → Private Key (giống generateWallet)
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hash = sha256(seed.slice(0, 32));
  const privateKey = new Uint8Array(hash);
  const publicKey = secp.getPublicKey(privateKey, false); // false = uncompressed
  const address = "0x" + bytesToHex(keccak_256(publicKey.slice(1))).slice(-40);

  return { mnemonic, privateKey, publicKey, address };
}

/**
 * Validate mnemonic
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic, wordlist);
}