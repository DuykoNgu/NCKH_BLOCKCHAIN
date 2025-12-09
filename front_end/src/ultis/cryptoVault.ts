/**
 * Mã hóa private key bằng AES-GCM với password
 * @param privateKey - Private key cần mã hóa
 * @param password - Password để tạo key mã hóa
 * @returns Object chứa encrypted data và iv
 */
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
    privateKey.buffer as any
  );

  return { encrypted: new Uint8Array(encrypted), iv };
}

/**
 * Giải mã private key từ vault đã mã hóa
 * @param vault - Object chứa encrypted data và iv (dạng hex string)
 * @param password - Password để tạo key giải mã
 * @returns Private key đã giải mã
 */
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

  // Convert hex strings to Uint8Array
  const encrypted = hexToUint8Array(vault.encrypted);
  const iv = hexToUint8Array(vault.iv);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as any
    },
    key,
    encrypted as any
  );

  return new Uint8Array(decrypted);
}

/**
 * Chuyển đổi chuỗi hex thành Uint8Array
 * @param hex - Chuỗi hex cần chuyển đổi
 * @returns Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}