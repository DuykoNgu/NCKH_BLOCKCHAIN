import hashlib
import json
from typing import List, Dict, Any

from ecdsa import SigningKey

from Block import Block
from models.BlockHeader import BlockHeader


class BlockChain:
    def __init__(self):
        self.chain: List[Block] = []
        #TODO: Thêm model Transaction
        self.mempool: List[dict] = []
        self.super_validator_pubkey: str = ""
        self.authority_set: set[str] = set()
        self.state_db: Dict[str, Any] = {}


    def create_genesis_block(self, pubkey_hex: str):
        self.super_validator_pubkey = pubkey_hex
        self.authority_set.add(pubkey_hex)

        header = BlockHeader(
            index=0,
            pre_hash="0" * 64,
            merkle_root="",
            validator_pubkey=pubkey_hex,
        )

        genesis_block = Block(
            block_id="GENESIS",
            index=0,
            block_header=header,
            transactions=[]
        )

        self.chain.append(genesis_block)
        return genesis_block


    def get_last_block(self) -> Block:
        return self.chain[-1]

    def add_transaction_to_mempool(self, tx: dict):
        self.mempool.append(tx)
        return True

    def execute_transaction(self, tx: Dict) -> bool:
        if tx["op"] == "set":
            self.state_db[tx["key"]] = tx["value"]
            return True

        return False


    def is_valid_new_block(self, new_block: Block, prev_block: Block) -> bool:
        if new_block.index != prev_block.index + 1:
            return False

        if new_block.block_header.pre_hash != prev_block.block_hash:
            return False

        if new_block.block_header.validator_pubkey not in self.authority_set:
            return False

        return True

    def mine_block(self, private_key: SigningKey, public_key_hex: str) -> Block:
        if public_key_hex not in self.authority_set:
            raise PermissionError("Validator ko năm trong uỷ quyền")

        prev_block = self.get_last_block()

        merkle_root = hashlib.sha256(json.dumps(self.mempool).encode()).hexdigest()

        header = BlockHeader(
            index=prev_block.index + 1,
            pre_hash=prev_block.block_hash,
            merkle_root=merkle_root,
            validator_pubkey=public_key_hex,
        )

        block = Block(
            block_id=f"BLOCK_{header.index}",
            index=header.index,
            block_header=header,
            transactions=self.mempool.copy()
        )

        block.sign_block(private_key)

        return block



    def add_block(self, block: Block):
        if not self.is_valid_new_block(block, self.get_last_block()):
            raise ValueError("invalid block")

        for tx in block.transactions:
            self.execute_transaction(tx)

        self.mempool.clear()
        self.chain.append(block)
        return True

