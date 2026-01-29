import hashlib
import json
from typing import List

from app.models.BlockHeader import BlockHeader
from app.models.Transaction import Transaction


class Block:
    def __init__(self, index: int, block_id: str, block_header: BlockHeader, transactions: List[Transaction]):
        self.block_id = block_id
        self.index = index
        self.block_header = block_header
        self.transactions = transactions
        self.block_size = len(transactions)  # Number of transactions in this block
        self.block_hash: str = ""
        self.validator_signature: str = ""
    
    def to_dict(self) -> dict:
        """Convert Block to dictionary for P2P transmission"""
        return {
            "block_id": self.block_id,
            "index": self.index,
            "block_header": {
                "index": self.block_header.index,
                "pre_hash": self.block_header.pre_hash,
                "merkle_root": self.block_header.merkle_root,
                "validator_pubkey": self.block_header.validator_pubkey,
                "timestamp": self.block_header.timestamp
            },
            "transactions": [tx.to_dict() for tx in self.transactions],
            "block_size": self.block_size,
            "block_hash": self.block_hash,
            "validator_signature": self.validator_signature
        }
    
    @staticmethod
    def from_dict(data: dict) -> 'Block':
        """Create Block from dictionary received from P2P network"""
        header_data = data.get("block_header", {})
        block_header = BlockHeader(
            index=header_data.get("index", 0),
            pre_hash=header_data.get("pre_hash", ""),
            merkle_root=header_data.get("merkle_root", ""),
            validator_pubkey=header_data.get("validator_pubkey", ""),
            timestamp=header_data.get("timestamp", 0)
        )
        
        transactions = [
            Transaction.from_dict(tx_data) 
            for tx_data in data.get("transactions", [])
        ]
        
        block = Block(
            index=data.get("index", 0),
            block_id=data.get("block_id", ""),
            block_header=block_header,
            transactions=transactions
        )
        block.block_size = data.get("block_size", len(transactions))
        block.block_hash = data.get("block_hash", "")
        block.validator_signature = data.get("validator_signature", "")
        
        return block

