import json
from typing import List
from ecdsa import SigningKey, SECP256k1, VerifyingKey

from app.models.BlockHeader import BlockHeader
from app.models.Transaction import Transaction

## TODO: CẦN PHÁT TRIỂN THÊM VÌ ĐÂY LÀ EM VIẾT THEO CORE DATABASE CỦA DỰ ÁN
##       Vì chưa viết gì về TRANSACTION NÊN KHI VIẾT tIẾP MỌI NGƯỜI CHÚ Ý PHẦN TRANSACTION TRONG TỪNG ĐOẠN THEO DTB NHÉ

from app.utils.Utils import CryptoUtils


class Block:
    def __init__(self, index: int, block_id: str, block_header: BlockHeader, transactions: List[Transaction]):
        self.block_id = block_id
        self.index = index
        self.block_header = block_header
        self.transactions = transactions
        self.block_hash: str = ""
        self.validator_signature: str = ""

    def calculate_merkle_root(self) -> str:
        """Tính Merkle Root từ danh sách transactions"""
        if not self.transactions:
            return ""
        
        return CryptoUtils.hash_sha256(json.dumps(self.transactions, sort_keys=True))

    def get_signing_data(self) -> bytes:
        """Lấy data để ký block (không bao gồm signature)"""
        data = {
            "block_id": self.block_id,
            "index": self.index,
            "header": {
                "index": self.block_header.index,
                "pre_hash": self.block_header.pre_hash,
                "merkle_root": self.block_header.merkle_root,
                "validator_pubkey": self.block_header.validator_pubkey,
                "timestamp": self.block_header.timestamp,
            },
            "transactions": self.transactions,
        }
        return json.dumps(data, sort_keys=True).encode()

    def calculate_hash(self) -> str:
        """Tính block_hash bằng SHA256"""
        signing_data = self.get_signing_data()
        return CryptoUtils.hash_sha256(signing_data)

    def sign_block(self, private_key_hex: str) -> str:
        """Ký block bằng ECDSA SECP256k1"""
        signing_data = self.get_signing_data()
        self.validator_signature = CryptoUtils.sign_data(signing_data, private_key_hex)
        self.block_hash = self.calculate_hash()
        return self.validator_signature

    def verify_block(self, public_key_hex: str) -> bool:
        """Verify block signature"""
        signing_data = self.get_signing_data()
        return CryptoUtils.verify_signature(signing_data, self.validator_signature, public_key_hex)

