import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { hmac } from "@noble/hashes/hmac.js";
import { bytesToHex } from "./walletGenerator";

secp.hashes.sha256 = (msg) => sha256(msg);
secp.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);

/**
 * Calculate SHA256 hash of data
 * @param data - Data to hash (Uint8Array or string)
 * @returns Hash as hex string
 */
export function calculateHash(data: Uint8Array | string): string {
  const uint8Data = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash = sha256(uint8Data);
  return bytesToHex(hash);
}

/**
 * Calculate PDF hash from ArrayBuffer
 * @param pdfBuffer - PDF file as ArrayBuffer
 * @returns PDF hash as hex string
 */
export async function calculatePdfHash(pdfBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", pdfBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create signing data in same format as backend
 * @param metadata - NFT metadata fields
 * @returns JSON string with sorted keys
 */
export function createSigningData(metadata: {
  degree_type: string;
  pdf_url: string;
  pdf_hash: string;
  institution_address: string;
  issued_at: number;
}): string {
  // Create object with sorted keys (same as Python's sort_keys=True)
  const data = {
    degree_type: metadata.degree_type,
    institution_address: metadata.institution_address,
    issued_at: metadata.issued_at,
    pdf_hash: metadata.pdf_hash,
    pdf_url: metadata.pdf_url,
  };
  return JSON.stringify(data, null, 0).replace(/\s/g, "");
}

/**
 * Sign data with private key
 * @param data - Data to sign (string)
 * @param privateKeyHex - Private key as hex string
 * @returns Signature as hex string
 */
export function signData(data: string, privateKeyHex: string): string {
  try {
    // Convert hex string to bytes
    const cleanKey = privateKeyHex.replace(/^0x/i, "").replace(/\s+/g, "");
    const privateKey = secp.etc.hexToBytes(cleanKey);

    // Hash the data
    const messageHash = sha256(new TextEncoder().encode(data));

    // Sign with private key (prehash: false because we already have the hash)
    const signatureBytes = secp.sign(messageHash, privateKey, { prehash: false });

    // Return signature as hex string
    return bytesToHex(signatureBytes);
  } catch (error) {
    console.error("Signing failed:", error);
    throw new Error(`Failed to sign data: ${error}`);
  }
}

/**
 * Sign data with private key bytes
 * @param data - Data to sign (string)
 * @param privateKeyBytes - Private key as Uint8Array
 * @returns Signature as hex string
 */
export function signDataWithBytes(data: string, privateKeyBytes: Uint8Array): string {
  try {
    // Hash the data
    const messageHash = sha256(new TextEncoder().encode(data));

    // Sign with private key
    const signatureBytes = secp.sign(messageHash, privateKeyBytes, { prehash: false });

    // Return signature as hex string
    return bytesToHex(signatureBytes);
  } catch (error) {
    console.error("Signing failed:", error);
    throw new Error(`Failed to sign data: ${error}`);
  }
}

/**
 * Get private key hex from localStorage vault
 * Requires password to decrypt
 * @param password - Password to decrypt the vault
 * @returns Private key as hex string
 */
export async function getPrivateKeyFromVault(password: string): Promise<string> {
  try {
    const vaultData = localStorage.getItem("vault");
    if (!vaultData) {
      throw new Error("No wallet vault found in localStorage");
    }

    const vault = JSON.parse(vaultData);
    const { decryptPrivateKey } = await import("./cryptoVault");
    const privateKeyBytes = await decryptPrivateKey(vault, password);

    return bytesToHex(privateKeyBytes);
  } catch (error) {
    console.error("Failed to get private key from vault:", error);
    throw new Error(`Failed to retrieve private key: ${error}`);
  }
}
