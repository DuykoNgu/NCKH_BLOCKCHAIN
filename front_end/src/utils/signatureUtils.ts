import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { hmac } from "@noble/hashes/hmac.js";
import { bytesToHex } from "./walletGenerator";

secp.hashes.sha256 = (msg) => sha256(msg);
secp.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);

function encodeDER(r: Uint8Array, s: Uint8Array): Uint8Array {
  const trimmed = (arr: Uint8Array) => {
    let start = 0;
    while (start < arr.length - 1 && arr[start] === 0x00 && arr[start + 1] < 0x80) {
      start++;
    }
    return arr.slice(start);
  };

  const rTrimmed = trimmed(r);
  const sTrimmed = trimmed(s);

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

  const rDER = new Uint8Array(2 + rPadded.length);
  rDER[0] = 0x02;
  rDER[1] = rPadded.length;
  rDER.set(rPadded, 2);

  const sDER = new Uint8Array(2 + sPadded.length);
  sDER[0] = 0x02;
  sDER[1] = sPadded.length;
  sDER.set(sPadded, 2);

  const sequenceContent = new Uint8Array(rDER.length + sDER.length);
  sequenceContent.set(rDER);
  sequenceContent.set(sDER, rDER.length);

  const der = new Uint8Array(2 + sequenceContent.length);
  der[0] = 0x30;
  der[1] = sequenceContent.length;
  der.set(sequenceContent, 2);

  return der;
}

export function calculateHash(data: Uint8Array | string): string {
  const uint8Data = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash = sha256(uint8Data);
  return bytesToHex(hash);
}

export async function calculatePdfHash(pdfBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", pdfBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function createSigningData(metadata: {
  degree_type: string;
  pdf_url: string;
  pdf_hash: string;
  institution_address: string;
  issued_at: number;
}): string {
  const data = {
    degree_type: metadata.degree_type,
    institution_address: metadata.institution_address,
    issued_at: metadata.issued_at,
    pdf_hash: metadata.pdf_hash,
    pdf_url: metadata.pdf_url,
  };
  return JSON.stringify(data).replace(/:\s/g, ':').replace(/,\s/g, ',');
}

export function signData(data: string, privateKeyHex: string): string {
  try {
    const cleanKey = privateKeyHex.replace(/^0x/i, "").replace(/\s+/g, "");
    const privateKey = secp.etc.hexToBytes(cleanKey);

    const messageBytes = new TextEncoder().encode(data);
    const messageHash = sha256(messageBytes);

    const signatureBytes = secp.sign(messageHash, privateKey);

    const rBytes = new Uint8Array(signatureBytes.slice(0, 32));
    const sBytes = new Uint8Array(signatureBytes.slice(32, 64));

    const derSignature = encodeDER(rBytes, sBytes);

    return bytesToHex(derSignature);
  } catch (error) {
    console.error("Signing failed:", error);
    throw new Error(`Failed to sign data: ${error}`);
  }
}

export function signDataWithBytes(data: string, privateKeyBytes: Uint8Array): string {
  try {
    const messageBytes = new TextEncoder().encode(data);

    const signatureBytes = secp.sign(messageBytes, privateKeyBytes);

    const rBytes = new Uint8Array(signatureBytes.slice(0, 32));
    const sBytes = new Uint8Array(signatureBytes.slice(32, 64));

    const derSignature = encodeDER(rBytes, sBytes);

    return bytesToHex(derSignature);
  } catch (error) {
    console.error("Signing failed:", error);
    throw new Error(`Failed to sign data: ${error}`);
  }
}

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
