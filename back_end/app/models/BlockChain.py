from typing import List, Dict, Any

from app.models.Block import Block
from app.models.Transaction import Transaction


class BlockChain:
    def __init__(self):
        self.chain: List[Block] = []
        #TODO: Thêm model Transaction
        self.mempool: List[Transaction] = []
        self.super_validator_pubkey: str = ""
        self.authority_set: set[str] = set()
        self.state_db: Dict[str, Any] = {}

    def get_last_block(self) -> Block:
        return self.chain[-1]

