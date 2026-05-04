import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { hmac } from "@noble/hashes/hmac.js";

// Cung cấp sha256 cho noble-secp256k1 v2+
secp.hashes.sha256 = (msg: Uint8Array) => sha256(msg);
secp.hashes.hmacSha256 = (key: Uint8Array, msg: Uint8Array) => hmac(sha256, key, msg);

export default secp;