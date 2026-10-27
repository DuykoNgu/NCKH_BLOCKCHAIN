import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { hmac } from "@noble/hashes/hmac.js";

secp.hashes.sha256 = (msg: Uint8Array) => sha256(msg);
secp.hashes.hmacSha256 = (key: Uint8Array, msg: Uint8Array) => hmac(sha256, key, msg);

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function calculateHash(data: string | Uint8Array): Uint8Array {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return sha256(bytes);
}

export function calculateHashHex(data: string | Uint8Array): string {
  return bytesToHex(calculateHash(data));
}

export async function signData(data: string | Uint8Array, privateKey: Uint8Array | string): Promise<string> {
  return signDataDER(data, privateKey);
}

export async function signDataDER(data: string | Uint8Array, privateKey: Uint8Array | string): Promise<string> {
  const privKey = typeof privateKey === 'string' ? hexToBytes(privateKey) : privateKey;
  const msgHash = calculateHash(data);
  
  const sigBytes = secp.sign(msgHash, privKey, { prehash: false });
  
  const r = sigBytes.slice(0, 32);
  const s = sigBytes.slice(32, 64);
  
  const prepare = (bytes: Uint8Array) => {
    let i = 0;
    while (i < bytes.length - 1 && bytes[i] === 0) i++;
    const slice = bytes.slice(i);
    
    let hex = bytesToHex(slice);
    if (slice[0] >= 128) {
      hex = '00' + hex;
    }
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

export async function verifySignature(data: string | Uint8Array, signature: string, publicKey: string | Uint8Array): Promise<boolean> {
  const pubKey = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey;
  const sigBytes = typeof signature === 'string' ? hexToBytes(signature) : signature;
  const msgHash = calculateHash(data);
  
  return secp.verify(sigBytes, msgHash, pubKey, { prehash: false });
}
