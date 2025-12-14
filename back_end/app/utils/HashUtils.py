import json
import hashlib
from Crypto.Hash import keccak

class HashUtils:
    
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

    @staticmethod
    def hash_sha256(data) -> str:
        """
        Tính SHA256 hash của dữ liệu
        """
        data_bytes = HashUtils._to_bytes(data)
        return hashlib.sha256(data_bytes).hexdigest()

    @staticmethod
    def hash_keccak256(data) -> str:
        """
        Tính Keccak256 hash của dữ liệu (Ethereum-style)
        """
        data_bytes = HashUtils._to_bytes(data)
        try:
            k = keccak.new(digest_bits=256)
            k.update(data_bytes)
            return k.hexdigest()
        except ImportError:
            print("Keccak not available, falling back to SHA256")
            return HashUtils.hash_sha256(data)