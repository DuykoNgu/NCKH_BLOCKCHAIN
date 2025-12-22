import hashlib
from ecdsa import SigningKey, VerifyingKey, SECP256k1
from ecdsa.util import sigencode_der, sigdecode_der
from typing import Tuple
from app.utils.utils import _to_bytes
from app.utils.HashUtils import HashUtils

     
class CryptoUtils:
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
            vk = VerifyingKey.from_string(bytes.fromhex(public_key_hex), curve=SECP256k1)
            vk.verify(bytes.fromhex(signature_hex), data_bytes,
                      hashfunc=hashlib.sha256, sigdecode=sigdecode_der)
            return True
        except Exception as e:
            print(f"Verification failed: {str(e)}")
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