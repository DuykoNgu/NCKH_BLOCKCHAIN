import hashlib
import json
from typing import List
from ecdsa import SigningKey, VerifyingKey

from app.models.Block import Block
from app.models.Transaction import Transaction


class BlockService:
    # Tính Merkle Root từ danh sách transactions
    @staticmethod
    def calculate_merkle_root(transactions: List[Transaction]) -> str:
        if not transactions:
            return ""

        tx_hashes = [
            hashlib.sha256(json.dumps(tx.to_dict()).encode()).hexdigest()
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
    
    # Lấy data để ký block (không bao gồm signature)
    @staticmethod
    def get_signing_data(block: Block) -> bytes:
        data = {
            "block_id": block.block_id,
            "index": block.index,
            "header": {
                "index": block.block_header.index,
                "pre_hash": block.block_header.pre_hash,
                "merkle_root": block.block_header.merkle_root,
                "validator_pubkey": block.block_header.validator_pubkey,
                "timestamp": block.block_header.timestamp,
            },
            "transactions": [tx.to_dict() for tx in block.transactions],
        }

        return json.dumps(data, sort_keys=True).encode()


    # Tính block_hash bằng SHA256
    @staticmethod
    def calculate_hash(block: Block) -> str:
        content = BlockService.get_signing_data(block)
        return hashlib.sha256(content).hexdigest()


    # Ký block bằng ECDSA SECP256k1
    @staticmethod
    def sign_block(block: Block, private_key: SigningKey) -> str:
        message = BlockService.get_signing_data(block)

        message_hash = hashlib.sha256(message).digest()
        signature = private_key.sign(message_hash)
        block.validator_signature = signature.hex()

        return block.validator_signature

    @staticmethod
    def verify_block(block: Block, public_key: VerifyingKey) -> bool:
        message = BlockService.get_signing_data(block)
        message_hash = hashlib.sha256(message).digest()

        try:
            signature_bytes = bytes.fromhex(block.validator_signature)
            return public_key.verify(signature_bytes, message_hash)
        except:
            return False