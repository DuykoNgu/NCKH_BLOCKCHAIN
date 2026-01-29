from ecdsa import SigningKey

from app.models.BlockChain import BlockChain
from app.models.Block import Block
from app.models.BlockHeader import BlockHeader
from app.models.Transaction import Transaction
from app.services.BlockService import BlockService
from app.services.TransactionService import TransactionService


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
    def add_transaction_to_mempool(blockchain: BlockChain, tx: Transaction) -> bool:
        if TransactionService.is_valid(tx):
            blockchain.mempool.append(tx)
            return True
        return False

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
    def mine_block(blockchain: BlockChain, private_key: SigningKey, public_key_hex: str, 
                   max_transactions: int = None) -> Block:
        """
        Mine a new block with transactions from mempool
        
        Args:
            blockchain: The blockchain instance
            private_key: Private key for signing
            public_key_hex: Public key of the validator
            max_transactions: Maximum number of transactions to include (optional)
        
        Returns:
            Block: The newly mined block
        """
        if public_key_hex not in blockchain.authority_set:
            raise PermissionError("Validator ko năm trong uỷ quyền")

        prev_block = blockchain.get_last_block()
        
        # Get transactions from mempool with size limit
        if max_transactions is None:
            # Try to get from config
            try:
                from network.config_loader import get_config
                config = get_config()
                consensus_config = config.get_consensus_config()
                max_transactions = consensus_config.get('max_transactions_per_block', 100)
            except:
                max_transactions = 100  # Default fallback
        
        # Take only up to max_transactions from mempool
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
        Add block to blockchain and remove included transactions from mempool
        
        Args:
            blockchain: The blockchain instance
            block: The block to add
            
        Returns:
            bool: True if successful
        """
        if not BlockChainService.is_valid_new_block(blockchain, block, blockchain.get_last_block()):
            raise ValueError("invalid block")

        # Execute transactions
        for tx in block.transactions:
            BlockChainService.execute_transaction(blockchain, tx)

        # Remove only the transactions that were included in this block
        # This allows remaining transactions to stay in mempool for next block
        included_tx_hashes = {tx.tx_hash for tx in block.transactions}
        blockchain.mempool = [tx for tx in blockchain.mempool if tx.tx_hash not in included_tx_hashes]
        
        blockchain.chain.append(block)
        return True