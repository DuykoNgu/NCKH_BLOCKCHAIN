import hashlib
from Crypto.Hash import keccak
from app.utils.utils import _to_bytes

class HashUtils:

    @staticmethod
    def hash_sha256(data) -> str:
        """
        Tính SHA256 hash của dữ liệu
        """
        data_bytes = _to_bytes(data)
        return hashlib.sha256(data_bytes).hexdigest()

    @staticmethod
    def hash_keccak256(data) -> str:
        """
        Tính Keccak256 hash của dữ liệu (Ethereum-style)
        """
        data_bytes = _to_bytes(data)
        try:
            k = keccak.new(digest_bits=256)
            k.update(data_bytes)
            return k.hexdigest()
        except ImportError:
            print("Keccak not available, falling back to SHA256")
            return HashUtils.hash_sha256(data)