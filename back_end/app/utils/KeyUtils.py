 
import hashlib
from ecdsa import SigningKey, VerifyingKey, SECP256k1
from ecdsa.util import sigencode_der, sigdecode_der 
from typing import Tuple

from Crypto.Hash import keccak

class KeyUtils:
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
 