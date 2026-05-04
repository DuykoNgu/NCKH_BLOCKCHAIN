import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { hmac } from "@noble/hashes/hmac.js";

// Cấu hình hàm hash cho thư viện secp256k1 (Yêu cầu bởi noble-secp256k1 v2+)
secp.hashes.sha256 = (msg: Uint8Array) => sha256(msg);
secp.hashes.hmacSha256 = (key: Uint8Array, msg: Uint8Array) => hmac(sha256, key, msg);

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
 * Returns hex signature (64 bytes compact format)
 */
export async function signData(data: string | Uint8Array, privateKey: Uint8Array | string): Promise<string> {
  return signDataDER(data, privateKey);
}

/**
 * Sign data using ECDSA (secp256k1)
 * Returns hex signature (DER format)
 */
export async function signDataDER(data: string | Uint8Array, privateKey: Uint8Array | string): Promise<string> {
  const privKey = typeof privateKey === 'string' ? hexToBytes(privateKey) : privateKey;
  const msgHash = calculateHash(data);
  
  // Ký hash của dữ liệu
  const sigBytes = secp.sign(msgHash, privKey, { prehash: false });
  
  // Manual DER encoding for ECDSA
  // Format: 0x30 + total_len + 0x02 + r_len + r + 0x02 + s_len + s
  const r = sigBytes.slice(0, 32);
  const s = sigBytes.slice(32, 64);
  
  const prepare = (bytes: Uint8Array) => {
    let hex = bytesToHex(bytes);
    // Remove leading zeros
    hex = hex.replace(/^0+/, '');
    if (hex === '') hex = '00';
    // If first bit is 1, prepend 00
    if (parseInt(hex[0], 16) >= 8) hex = '00' + hex;
    // Ensure even length
    if (hex.length % 2 !== 0) hex = '0' + hex;
    return hex;
  };
  
  const rHex = prepare(r);
  const sHex = prepare(s);
  
  const rLen = (rHex.length / 2).toString(16).padStart(2, '0');
  const sLen = (sHex.length / 2).toString(16).padStart(2, '0');
  
  const body = '02' + rLen + rHex + '02' + sLen + sHex;
  const totalLen = (body.length / 2).toString(16).padStart(2, '0');
  
  return '30' + totalLen + body;
}

/**
 * Verify ECDSA signature
 */
export async function verifySignature(data: string | Uint8Array, signature: string, publicKey: string | Uint8Array): Promise<boolean> {
  const pubKey = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey;
  const sigBytes = typeof signature === 'string' ? hexToBytes(signature) : signature;
  const msgHash = calculateHash(data);
  
  // Xác thực chữ ký với hash
  return secp.verify(sigBytes, msgHash, pubKey, { prehash: false });
}
