import * as bip39 from "@scure/bip39";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { sha256 } from "@noble/hashes/sha2.js";
import * as secp from "@noble/secp256k1";
import { wordlist } from "@scure/bip39/wordlists/english.js";

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateWallet() {
  const entropy = crypto.getRandomValues(new Uint8Array(16));

  const mnemonic = bip39.entropyToMnemonic(entropy, wordlist);

  const seed = await bip39.mnemonicToSeed(mnemonic);

  const hash = sha256(seed.slice(0, 32));
  const privateKey = new Uint8Array(hash);

  const publicKey = secp.getPublicKey(privateKey, false);

  const address = "0x" + bytesToHex(keccak_256(publicKey.slice(1))).slice(-40);

  return { mnemonic, privateKey, publicKey, address };
}

export async function restoreWallet(mnemonic: string) {
  if (!bip39.validateMnemonic(mnemonic, wordlist)) {
    throw new Error("Invalid mnemonic");
  }

  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hash = sha256(seed.slice(0, 32));
  const privateKey = new Uint8Array(hash);
  const publicKey = secp.getPublicKey(privateKey, false);
  const address = "0x" + bytesToHex(keccak_256(publicKey.slice(1))).slice(-40);

  return { mnemonic, privateKey, publicKey, address };
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic, wordlist);
}