import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";

/**
 * Uint8Array to Hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Calculate SHA-256 hash of a string or Uint8Array
 */
export function calculateHash(data: string | Uint8Array): Uint8Array {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return sha256(bytes);
}

/**
 * Calculate SHA-256 hash and return as hex
 */
export function calculateHashHex(data: string | Uint8Array): string {
  return bytesToHex(calculateHash(data));
}

/**
 * Sign data using ECDSA (secp256k1)
 * Returns hex signature
 */
export async function signData(data: string | Uint8Array, privateKey: Uint8Array | string): Promise<string> {
  const privKey = typeof privateKey === 'string' ? hexToBytes(privateKey) : privateKey;
  const msgHash = calculateHash(data);
  
  // Sign using noble-secp256k1
  const signature = await secp.sign(msgHash, privKey);
  return bytesToHex(signature);
}

/**
 * Verify ECDSA signature
 */
export async function verifySignature(data: string | Uint8Array, signature: string, publicKey: string | Uint8Array): Promise<boolean> {
  const pubKey = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey;
  const sig = hexToBytes(signature);
  const msgHash = calculateHash(data);
  
  return secp.verify(sig, msgHash, pubKey);
}
