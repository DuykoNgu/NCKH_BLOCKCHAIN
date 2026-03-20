"""
BlockChainService - tích hợp ChainIndexer

Thay đổi duy nhất so với code gốc:
- add_block() gọi ChainIndexer.index_block() sau khi block confirm
- Mọi logic mining/validation giữ nguyên
"""
from typing import Tuple
from ecdsa import SigningKey

from app.models.BlockChain import BlockChain
from app.models.Block import Block
from app.models.BlockHeader import BlockHeader
from app.models.Transaction import Transaction
from app.services.BlockService import BlockService
from app.services.TransactionService import TransactionService
from app.services.ChainIndexer import ChainIndexer
from app.utils.logger import get_logger

logger = get_logger(__name__)


class BlockChainService:

    @staticmethod
    def create_genesis_block(blockchain: BlockChain, pubkey_hex: str) -> Block:
        blockchain.super_validator_pubkey = pubkey_hex
        blockchain.authority_set.add(pubkey_hex)

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

        blockchain.chain.append(genesis_block)
        return genesis_block

    @staticmethod
    def add_transaction_to_mempool(blockchain: BlockChain, tx: Transaction) -> Tuple[bool, str]:
        """
        Thêm tx vào mempool sau khi verify signature.
        Trả về (success, message) thay vì bool đơn giản.
        """
        # Tx không có signature → chỉ chấp nhận từ server (internal)
        if not tx.signature:
            blockchain.mempool.append(tx)
            return True, "Added (internal tx)"

        is_valid, message = TransactionService.verify(tx)
        if is_valid:
            blockchain.mempool.append(tx)
            return True, "Added to mempool"

        logger.warning(f"[BlockChainService] Invalid tx rejected: {message}")
        return False, message

    @staticmethod
    def execute_transaction(blockchain: BlockChain, tx: Transaction) -> bool:
        payload = tx.payload
        if payload.get("op") == "set":
            blockchain.state_db[payload["key"]] = payload["value"]
            return True
        return False

    @staticmethod
    def is_valid_new_block(blockchain: BlockChain, new_block: Block, prev_block: Block) -> bool:
        if new_block.index != prev_block.index + 1:
            return False
        if new_block.block_header.pre_hash != prev_block.block_hash:
            return False
        if new_block.block_header.validator_pubkey not in blockchain.authority_set:
            return False
        return True

    @staticmethod
    def mine_block(blockchain: BlockChain, private_key: SigningKey,
                   public_key_hex: str, max_transactions: int = None) -> Block:
        if public_key_hex not in blockchain.authority_set:
            raise PermissionError("Validator không nằm trong uỷ quyền")

        prev_block = blockchain.get_last_block()

        if max_transactions is None:
            try:
                from network.config_loader import get_config
                config = get_config()
                consensus_config = config.get_consensus_config()
                max_transactions = consensus_config.get('max_transactions_per_block', 100)
            except Exception:
                max_transactions = 100

        transactions_to_include = blockchain.mempool[:max_transactions]
        merkle_root = BlockService.calculate_merkle_root(transactions_to_include)

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
            transactions=transactions_to_include
        )
        BlockService.sign_block(block, private_key)
        return block

    @staticmethod
    def add_block(blockchain: BlockChain, block: Block) -> bool:
        """
        Add block to chain + index tất cả tx vào DB.

        Flow:
        1. Validate block
        2. Execute transactions (state machine)
        3. *** ChainIndexer.index_block() → ghi DB ***
        4. Remove confirmed txs từ mempool
        5. Append block vào chain
        """
        if not BlockChainService.is_valid_new_block(
            blockchain, block, blockchain.get_last_block()
        ):
            raise ValueError("Invalid block")

        # 2. Execute state transitions
        for tx in block.transactions:
            BlockChainService.execute_transaction(blockchain, tx)

        # 3. Index block data vào DB ← đây là Web3+Backend API pattern
        index_result = ChainIndexer.index_block(block)
        logger.info(f"[BlockChainService] Block indexed: {index_result}")

        # 4. Remove confirmed txs từ mempool
        confirmed_hashes = {tx.tx_hash for tx in block.transactions}
        blockchain.mempool = [
            tx for tx in blockchain.mempool
            if tx.tx_hash not in confirmed_hashes
        ]

        # 5. Append
        blockchain.chain.append(block)
        return True
