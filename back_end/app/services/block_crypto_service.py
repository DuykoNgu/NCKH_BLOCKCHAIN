"""Block Cryptography Service - Xử lý hash, signing, verification"""
import hashlib
import json
from typing import List, Dict, Any
from ecdsa import SigningKey, VerifyingKey


class BlockCryptoService:
    """Service để xử lý các phép toán cryptographic của Block"""
    
    @staticmethod
    def calculate_merkle_root(transactions: List[dict]) -> str:
        """Tính Merkle Root từ danh sách transactions"""
        if not transactions:
            return ""

        tx_hashes = [
            hashlib.sha256(json.dumps(tx).encode()).hexdigest()
            for tx in transactions
        ]

        while len(tx_hashes) > 1:
            temp = []

            for i in range(0, len(tx_hashes), 2):
                left = tx_hashes[i]
                right = tx_hashes[i] if i + 1 >= len(tx_hashes) else tx_hashes[i + 1]
                combined = left + right

                temp.append(hashlib.sha256(combined.encode()).hexdigest())

            tx_hashes = temp

        return tx_hashes[0]

    @staticmethod
    def get_signing_data(block_id: str, index: int, block_header: Any, transactions: List[dict]) -> bytes:
        """Lấy data để ký block (không bao gồm signature)"""
        data = {
            "block_id": block_id,
            "index": index,
            "header": {
                "index": block_header.index,
                "pre_hash": block_header.pre_hash,
                "merkle_root": block_header.merkle_root,
                "validator_pubkey": block_header.validator_pubkey,
                "timestamp": block_header.timestamp,
            },
            "transactions": transactions,
        }

        return json.dumps(data, sort_keys=True).encode()

    @staticmethod
    def calculate_hash(signing_data: bytes) -> str:
        """Tính block_hash bằng SHA256"""
        return hashlib.sha256(signing_data).hexdigest()

    @staticmethod
    def sign_block(signing_data: bytes, private_key: SigningKey) -> str:
        """Ký block bằng ECDSA SECP256k1"""
        message_hash = hashlib.sha256(signing_data).digest()
        signature = private_key.sign_digest(message_hash, hashfunc=hashlib.sha256)
        return signature.hex()

    @staticmethod
    def verify_block(signing_data: bytes, validator_signature: str, public_key: VerifyingKey) -> bool:
        """Verify block signature"""
        message_hash = hashlib.sha256(signing_data).digest()

        try:
            signature_bytes = bytes.fromhex(validator_signature)
            return public_key.verify_digest(signature_bytes, message_hash)
        except Exception as e:
            print(f"Verification error: {str(e)}")
            return False
