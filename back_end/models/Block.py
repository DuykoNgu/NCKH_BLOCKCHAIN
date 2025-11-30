import hashlib
import json
from typing import List, Dict, Any
from ecdsa import SigningKey, SECP256k1, VerifyingKey

from models.BlockHeader import BlockHeader


## TODO: CẦN PHÁT TRIỂN THÊM VÌ ĐÂY LÀ EM VIẾT THEO CORE DATABASE CỦA DỰ ÁN
##       Vì chưa viết gì về TRANSACTION NÊN KHI VIẾT tIẾP MỌI NGƯỜI CHÚ Ý PHẦN TRANSACTION TRONG TỪNG ĐOẠN THEO DTB NHÉ



class Block:
    def __init__(self, index: int, block_id: str, block_header: BlockHeader, transactions: List[dict]):
        self.block_id = block_id
        self.index = index
        self.block_header = block_header
        self.transactions = transactions
        self.block_hash: str = ""
        self.validator_signature: str = ""

    # Tính Merkle Root từ danh sách transactions
    def calculate_merkle_root(self) -> str:
        if not self.transactions:
            return ""

        tx_hashes = [
            hashlib.sha256(json.dumps(tx).encode()).hexdigest()
            for tx in self.transactions
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

    # Lấy data để ký block (không bao gồm signature)
    def get_signing_data(self) -> bytes:
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

    # Tính block_hash bằng SHA256
    def calculate_hash(self) -> str:
        content = self.get_signing_data()
        return hashlib.sha256(content).hexdigest()

    # Ký block bằng ECDSA SECP256k1
    def sign_block(self, private_key: SigningKey) -> str:
        message = self.get_signing_data()

        message_hash = hashlib.sha256(message).hexdigest()
        signature = private_key.sign(message_hash)
        self.validator_signature = signature.hex()

        return self.validator_signature

    def verify_block(self, public_key: VerifyingKey) -> bool:
        message = self.get_signing_data()
        message_hash = hashlib.sha256(message).hexdigest()

        try:
            signature_bytes = bytes.fromhex(self.validator_signature)
            return public_key.verify(message_hash, signature_bytes)
        except:
            return False

