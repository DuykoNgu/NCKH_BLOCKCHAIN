from ecdsa import SigningKey

from app.models.BlockChain import BlockChain
from app.models.Block import Block
from app.models.BlockHeader import BlockHeader
from app.models.Transaction import Transaction
from app.services.BlockService import BlockService
from app.services.TransactionService import TransactionService
from app.repositories.BlockRepository import BlockRepository

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
    def mine_block(blockchain: BlockChain, private_key: SigningKey, public_key_hex: str) -> Block:
        if public_key_hex not in blockchain.authority_set:
            raise PermissionError("Validator ko năm trong uỷ quyền")

        prev_block = blockchain.get_last_block()

        merkle_root = BlockService.calculate_merkle_root(blockchain.mempool)

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
            transactions=blockchain.mempool.copy()
        )

        BlockService.sign_block(block, private_key)

        return block

    @staticmethod
    def add_block(blockchain: BlockChain, block: Block) -> bool:
        if not BlockChainService.is_valid_new_block(blockchain, block, blockchain.get_last_block()):
            raise ValueError("invalid block")

        for tx in block.transactions:
            BlockChainService.execute_transaction(blockchain, tx)

        blockchain.mempool.clear()
        blockchain.chain.append(block)
        return True



    @staticmethod
    def receive_and_validate_block(blockchain: BlockChain, block_data: dict) -> dict:
        """
        VAL-06: Nhận block từ validator khác
        1. Parse block data
        2. Kiểm tra trùng lặp
        3. Verify chữ ký (VAL-02)
        4. Validate block structure
        5. Thêm vào chain nếu hợp lệ
        """


        # 1. Parse block từ data
        block_header = BlockHeader(
            index=block_data['index'],
            pre_hash=block_data['pre_hash'],
            merkle_root=block_data['merkle_root'],
            validator_pubkey=block_data['validator_pubkey'],
            timestamp=block_data.get('timestamp')
        )

        block = Block(
            block_id=block_data['block_id'],
            index=block_data['index'],
            block_header=block_header,
            transactions=block_data.get('transactions', [])
        )
        block.block_hash = block_data['block_hash']
        block.validator_signature = block_data['validator_signature']

        # 2. Chống xử lý trùng block
        if BlockRepository.block_exists(block_id=block.block_id):
            return {"success": False, "error": "Block ID already exists", "code": "DUPLICATE_ID"}

        if BlockRepository.block_exists(block_hash=block.block_hash):
            return {"success": False, "error": "Block hash already exists", "code": "DUPLICATE_HASH"}

        # 3. Verify chữ ký block (VAL-02)
        is_signature_valid = BlockService.verify_block(block, block.block_header.validator_pubkey)
        if not is_signature_valid:
            return {"success": False, "error": "Invalid block signature", "code": "INVALID_SIGNATURE"}

        # 4. Validate block structure
        prev_block = blockchain.get_last_block() if blockchain.chain else None
        if prev_block:
            if not BlockChainService.is_valid_new_block(blockchain, block, prev_block):
                return {"success": False, "error": "Invalid block structure", "code": "INVALID_STRUCTURE"}

        # 5. Lưu vào database
        success = BlockRepository.create_block(block)
        if not success:
            return {"success": False, "error": "Failed to save block", "code": "DB_ERROR"}

        # 6. Thêm vào chain in-memory
        blockchain.chain.append(block)

        return {
            "success": True,
            "message": "Block received and validated successfully",
            "block_id": block.block_id,
            "block_hash": block.block_hash
        }