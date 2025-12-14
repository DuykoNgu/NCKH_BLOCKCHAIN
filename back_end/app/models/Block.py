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
        self.block_hash: str = ""
        self.validator_signature: str = ""




