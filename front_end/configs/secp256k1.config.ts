import * as secp from "@noble/secp256k1";

// Cung cấp sha256 cho noble-secp256k1
(secp.utils as any).sha256 = async (message: Uint8Array): Promise<Uint8Array> => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", message as any);
  return new Uint8Array(hashBuffer);
};

export default secp;