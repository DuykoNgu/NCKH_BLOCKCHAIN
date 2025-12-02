import json
import hashlib
from ecdsa import SigningKey, VerifyingKey, SECP256k1
from ecdsa.util import sigencode_der, sigdecode_der
from Crypto.Hash import keccak

from typing import Tuple


class CryptoUtils:
    @staticmethod
    def _to_bytes(data) -> bytes:
        """Helper để convert data thành bytes"""
        if isinstance(data, dict):
            return json.dumps(data, sort_keys=True).encode('utf-8')
        elif isinstance(data, str):
            return data.encode('utf-8')
        elif isinstance(data, bytes):
            return data
        else:
            raise TypeError(f"Unsupported data type: {type(data)}")

    #Đẻ khoá đôi
    @staticmethod
    def generate_key_pair() -> Tuple[str, str]:
        sk = SigningKey.generate(curve=SECP256k1)
        vk = sk.get_verifying_key()

        public_key_hex = vk.to_string().hex()
        private_key_hex = sk.to_string().hex()

        return public_key_hex, private_key_hex

     # Lấy public key từ private key
    @staticmethod
    def get_public_key_from_private(private_key_hex: str) -> str:
        sk = SigningKey.from_string(bytes.fromhex(private_key_hex), curve=SECP256k1)
        vk = sk.get_verifying_key()

        return vk.to_string().hex()
     
     #lấy địa chỉ từ public key
    @staticmethod
    def get_address_from_pubkey(public_key_hex: str) -> str:        
         try:
              k = keccak.new(digest_bits=256)
              k.update(bytes.fromhex(public_key_hex))
              address = "0x" + k.digest()[-20:].hex()
              return address
         except ImportError:
              #FallBack: dùng sha256 không có keccak   
              sha256_hash = hashlib.sha256(bytes.fromhex(public_key_hex)).digest()
              address = "0x" + sha256_hash[-20:].hex()
              return address
              
    @staticmethod
    def hash_sha256(data) -> str:
        """
        Tính SHA256 hash của dữ liệu
        """
        data_bytes = CryptoUtils._to_bytes(data)
        return hashlib.sha256(data_bytes).hexdigest()

    @staticmethod
    def hash_keccak256(data) -> str:
        """
        Tính Keccak256 hash của dữ liệu (Ethereum-style)
        """
        data_bytes = CryptoUtils._to_bytes(data)
        try:
            k = keccak.new(digest_bits=256)
            k.update(data_bytes)
            return k.hexdigest()
        except ImportError:
            print("Keccak not available, falling back to SHA256")
            return CryptoUtils.hash_sha256(data)

       # ==================== SIGNING & VERIFICATION ====================
    
    @staticmethod
    def sign_data(data, private_key_hex: str) -> str:
        """
        Ký dữ liệu bằng private key
        """
        data_bytes = CryptoUtils._to_bytes(data)
        
        sk = SigningKey.from_string(bytes.fromhex(private_key_hex), curve=SECP256k1)
        signature = sk.sign(data_bytes, hashfunc=hashlib.sha256, sigencode=sigencode_der)
        
        return signature.hex()

    @staticmethod
    def verify_signature(data, signature_hex: str, public_key_hex: str) -> bool:
        """
        Xác minh chữ ký dữ liệu
        """
        # Chuyển data thành bytes
        data_bytes = CryptoUtils._to_bytes(data)

        try:
            vk = VerifyingKey.from_string(bytes.fromhex(public_key_hex), curve=SECP256k1)
            vk.verify(bytes.fromhex(signature_hex), data_bytes,
                      hashfunc=hashlib.sha256, sigdecode=sigdecode_der)
            return True
        except Exception as e:
            print(f"Verification failed: {str(e)}")
            return False