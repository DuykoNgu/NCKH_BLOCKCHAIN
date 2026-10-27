export async function encryptPrivateKey(privateKey: Uint8Array, password: string): Promise<{ encrypted: Uint8Array; iv: Uint8Array }> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    'AES-GCM',
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    privateKey as unknown as ArrayBuffer
  );

  return { encrypted: new Uint8Array(encrypted), iv };
}

export async function decryptPrivateKey(vault: { encrypted: string; iv: string }, password: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    'AES-GCM',
    false,
    ['decrypt']
  );

  const encrypted = hexToUint8Array(vault.encrypted);
  const iv = hexToUint8Array(vault.iv);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as ArrayBuffer
    },
    key,
    encrypted as unknown as ArrayBuffer
  );

  return new Uint8Array(decrypted);
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}