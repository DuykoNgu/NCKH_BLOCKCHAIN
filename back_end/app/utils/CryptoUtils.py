import hashlib
from ecdsa import SigningKey, VerifyingKey, SECP256k1
from ecdsa.util import sigencode_der, sigdecode_der
from typing import Tuple
from app.utils.utils import _to_bytes
from app.utils.HashUtils import HashUtils

     
class CryptoUtils:
    @staticmethod
    def decompress_public_key(public_key_hex: str) -> str:
        """
        Decompress a compressed public key to uncompressed format (65 bytes)
        Compressed format: 02/03 + 32 bytes (33 bytes total)
        Uncompressed format: 04 + 32 bytes x + 32 bytes y (65 bytes total)
        """
        if len(public_key_hex) == 130:  # 65 bytes * 2 hex chars = 130
            # Already uncompressed
            return public_key_hex
        
        if len(public_key_hex) == 66:  # 33 bytes * 2 hex chars = 66
            # Compressed format
            try:
                pk_bytes = bytes.fromhex(public_key_hex)
                # Create VerifyingKey from compressed key
                vk = VerifyingKey.from_string(pk_bytes[1:], curve=SECP256k1)
                # Get uncompressed format (04 + x + y)
                return "04" + vk.to_string().hex()
            except Exception as e:
                print(f"Failed to decompress key: {e}")
                return public_key_hex
        
        return public_key_hex

    @staticmethod
    def sign_data(data, private_key_hex: str) -> str:
        """
        Ký dữ liệu bằng private key
        """
        data_bytes = _to_bytes(data)
        
        sk = SigningKey.from_string(bytes.fromhex(private_key_hex), curve=SECP256k1)
        signature = sk.sign(data_bytes, hashfunc= hashlib.sha256, sigencode=sigencode_der)
        
        return signature.hex()

    @staticmethod
    def verify_signature(data, signature_hex: str, public_key_hex: str) -> bool:
        """
        Xác minh chữ ký dữ liệu
        """
        # Chuyển data thành bytes
        data_bytes = _to_bytes(data)

        try:
            # Decompress public key if needed
            pub_key_hex = CryptoUtils.decompress_public_key(public_key_hex)
            
            # Extract the key bytes (skip '04' prefix if present)
            if pub_key_hex.startswith('04'):
                # Uncompressed: 04 + x (32 bytes) + y (32 bytes) = 65 bytes hex = 130 chars
                # After removing '04', we have 64 bytes = 128 chars
                key_bytes = bytes.fromhex(pub_key_hex[2:])  # 64 bytes
            else:
                # Assume 64 bytes already
                key_bytes = bytes.fromhex(pub_key_hex)
            
            if len(key_bytes) != 64:
                raise ValueError(f"Invalid public key length: {len(key_bytes)}, expected 64 bytes")
            
            vk = VerifyingKey.from_string(key_bytes, curve=SECP256k1)
            
            from ecdsa.util import sigdecode_der, sigdecode_string
            
            sig_bytes = bytes.fromhex(signature_hex)
            print(f"Signature length: {len(sig_bytes)} bytes")
            
            # Detection: If data is a 64-char hex string, it's likely a pre-computed hash
            is_prehashed = False
            if isinstance(data, str) and len(data) == 64:
                try:
                    bytes.fromhex(data)
                    is_prehashed = True
                except ValueError:
                    pass

            try:
                if is_prehashed:
                    print(f"DEBUG - [verify_signature] Data is pre-hashed. Using verify_digest (DER).")
                    vk.verify_digest(sig_bytes, bytes.fromhex(data), sigdecode=sigdecode_der)
                else:
                    print(f"DEBUG - [verify_signature] Data is raw. Hashing with SHA256 (DER).")
                    vk.verify(sig_bytes, data_bytes, hashfunc=hashlib.sha256, sigdecode=sigdecode_der)
            except Exception as der_err:
                # If DER fails, try raw 64-byte format if the length is 64
                if len(sig_bytes) == 64:
                    print(f"DEBUG - [verify_signature] DER failed, trying raw 64-byte format...")
                    if is_prehashed:
                        vk.verify_digest(sig_bytes, bytes.fromhex(data), sigdecode=sigdecode_string)
                    else:
                        vk.verify(sig_bytes, data_bytes, hashfunc=hashlib.sha256, sigdecode=sigdecode_string)
                else:
                    raise der_err
                
            print(f"✓ Signature verification PASSED")
            return True
        except Exception as e:
            print(f"✗ Verification failed: {str(e)}")
            return False

    # Key management methods
    @staticmethod
    def generate_key_pair() -> Tuple[str, str]:
        sk = SigningKey.generate(curve=SECP256k1)
        vk = sk.get_verifying_key()

        public_key_hex = vk.to_string().hex()
        private_key_hex = sk.to_string().hex()

        return public_key_hex, private_key_hex

    @staticmethod
    def get_public_key_from_private(private_key_hex: str) -> str:
        sk = SigningKey.from_string(bytes.fromhex(private_key_hex), curve=SECP256k1)
        vk = sk.get_verifying_key()

        return vk.to_string().hex()

    @staticmethod
    def get_address_from_pubkey(public_key_hex: str) -> str:
        try:
            keccak_hash = HashUtils.hash_keccak256(bytes.fromhex(public_key_hex))
            address = "0x" + bytes.fromhex(keccak_hash)[-20:].hex()
            return address
        except ImportError:
            # Fallback: use sha256 if keccak not available
            sha256_hash = hashlib.sha256(bytes.fromhex(public_key_hex)).digest()
            address = "0x" + sha256_hash[-20:].hex()
            return address