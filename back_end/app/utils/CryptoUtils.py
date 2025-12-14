import hashlib
from ecdsa import SigningKey, VerifyingKey, SECP256k1
from ecdsa.util import sigencode_der, sigdecode_der

     
class CryptoUtils:
    @staticmethod
    def _to_bytes(data):
        """Convert data to bytes"""
        if isinstance(data, bytes):
            return data
        elif isinstance(data, str):
            return data.encode()
        else:
            return str(data).encode()
    
    @staticmethod
    def sign_data(data, private_key_hex: str) -> str:
        """
        Ký dữ liệu bằng private key
        """
        data_bytes = CryptoUtils._to_bytes(data)
        
        sk = SigningKey.from_string(bytes.fromhex(private_key_hex), curve=SECP256k1)
        signature = sk.sign(data_bytes, hashfunc= hashlib.sha256, sigencode=sigencode_der)
        
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