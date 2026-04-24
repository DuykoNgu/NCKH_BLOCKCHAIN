import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { hmac } from "@noble/hashes/hmac.js";
import { bytesToHex } from "./walletGenerator";

secp.hashes.sha256 = (msg) => sha256(msg);
secp.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);

/**
 * Convert raw signature (r + s) to DER format
 * DER format: SEQUENCE { INTEGER r, INTEGER s }
 * @param r - r value as Uint8Array (32 bytes)
 * @param s - s value as Uint8Array (32 bytes)
 * @returns DER encoded signature as Uint8Array
 */
function encodeDER(r: Uint8Array, s: Uint8Array): Uint8Array {
  // Remove leading zero byte if present (except if MSB is 1, then we need it for positive number)
  const trimmed = (arr: Uint8Array) => {
    let start = 0;
    while (start < arr.length - 1 && arr[start] === 0x00 && arr[start + 1] < 0x80) {
      start++;
    }
    return arr.slice(start);
  };

  const rTrimmed = trimmed(r);
  const sTrimmed = trimmed(s);

  // Add 0x00 prefix if MSB is set (to keep it positive)
  const addPadding = (arr: Uint8Array) => {
    if (arr[0] >= 0x80) {
      const padded = new Uint8Array(arr.length + 1);
      padded[0] = 0x00;
      padded.set(arr, 1);
      return padded;
    }
    return arr;
  };

  const rPadded = addPadding(rTrimmed);
  const sPadded = addPadding(sTrimmed);

  // Build DER structure
  const rDER = new Uint8Array(2 + rPadded.length);
  rDER[0] = 0x02; // INTEGER tag
  rDER[1] = rPadded.length;
  rDER.set(rPadded, 2);

  const sDER = new Uint8Array(2 + sPadded.length);
  sDER[0] = 0x02; // INTEGER tag
  sDER[1] = sPadded.length;
  sDER.set(sPadded, 2);

  const sequenceContent = new Uint8Array(rDER.length + sDER.length);
  sequenceContent.set(rDER);
  sequenceContent.set(sDER, rDER.length);

  const der = new Uint8Array(2 + sequenceContent.length);
  der[0] = 0x30; // SEQUENCE tag
  der[1] = sequenceContent.length;
  der.set(sequenceContent, 2);

  return der;
}

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
 * Sign data with private key - Returns DER format signature
 * @param data - Data to sign (string)
 * @param privateKeyHex - Private key as hex string
 * @returns Signature as DER-encoded hex string
 */
export function signData(data: string, privateKeyHex: string): string {
  try {
    // Convert hex string to bytes
    const cleanKey = privateKeyHex.replace(/^0x/i, "").replace(/\s+/g, "");
    const privateKey = secp.etc.hexToBytes(cleanKey);

    // Hash the data with SHA256 (same as backend)
    const messageBytes = new TextEncoder().encode(data);
    const messageHash = sha256(messageBytes);

    // Sign with private key - returns Bytes (Uint8Array with r+s concatenated, 64 bytes)
    const signatureBytes = secp.sign(messageHash, privateKey);

    // Extract r and s (each 32 bytes)
    const rBytes = new Uint8Array(signatureBytes.slice(0, 32));
    const sBytes = new Uint8Array(signatureBytes.slice(32, 64));

    // Encode to DER format
    const derSignature = encodeDER(rBytes, sBytes);

    // Return signature as hex string
    return bytesToHex(derSignature);
  } catch (error) {
    console.error("Signing failed:", error);
    throw new Error(`Failed to sign data: ${error}`);
  }
}

/**
 * Sign data with private key bytes - Returns DER format signature
 * @param data - Data to sign (string)
 * @param privateKeyBytes - Private key as Uint8Array (32 bytes)
 * @returns Signature as DER-encoded hex string
 */
export function signDataWithBytes(data: string, privateKeyBytes: Uint8Array): string {
  try {
    // Hash the data with SHA256 (same as backend)
    const messageBytes = new TextEncoder().encode(data);
    const messageHash = sha256(messageBytes);

    // Sign with private key - returns Bytes (Uint8Array with r+s concatenated, 64 bytes)
    const signatureBytes = secp.sign(messageHash, privateKeyBytes);

    // Extract r and s (each 32 bytes)
    const rBytes = new Uint8Array(signatureBytes.slice(0, 32));
    const sBytes = new Uint8Array(signatureBytes.slice(32, 64));

    // Encode to DER format
    const derSignature = encodeDER(rBytes, sBytes);

    // Return as hex string
    return bytesToHex(derSignature);
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
