import hashlib
import json
from typing import List

from flask import request, jsonify

from app.utils.HashUtils import HashUtils
from app.utils.CryptoUtils import CryptoUtils

from app.models.Block import Block
from app.models.BlockHeader import BlockHeader
from app.models.Transaction import Transaction
from app.repositories.BlockRepository import BlockRepository


class BlockService:
    # Tính Merkle Root từ danh sách transactions
    @staticmethod
    def calculate_merkle_root(transactions: List[Transaction]) -> str:
        if not transactions:
            return ""

        tx_hashes = []
        for tx in transactions:
            # CRITICAL FIX: Only hash the "transaction core" fields
            # Exclude: block_id, tx_status, error_reason (these are metadata added after creation)
            # This ensures merkle root stays consistent whether calculated at creation or at sync
            tx_core = {
                "tx_id": tx.tx_id,
                "tx_hash": tx.tx_hash,
                "sender_pubkey": tx.sender_pubkey,
                "sender_address": tx.sender_address if tx.sender_address is not None else "system",
                "recipient_address": tx.recipient_address,
                "payload": tx.payload,
                "signature": tx.signature,
                "timestamp": tx.timestamp
            }
                
            # Chuẩn hoá dữ liệu để luôn đảm bảo tính nhất quán (Canonical JSON)
            # Loại bỏ các khoảng trắng mặc định, sắp xếp keys theo thứ tự Alphabet
            canonical_json = json.dumps(tx_core, sort_keys=True, separators=(',', ':'))
            tx_hashes.append(HashUtils.hash_sha256(canonical_json.encode()))

        while len(tx_hashes) > 1:
            temp = []

            for i in range(0, len(tx_hashes), 2):
                left = tx_hashes[i]
                right = tx_hashes[i] if i + 1 >= len(tx_hashes) else tx_hashes[i + 1]
                combined = left + right

                temp.append(HashUtils.hash_sha256(combined.encode()))

            tx_hashes = temp

        return tx_hashes[0]
    
    @staticmethod
    def get_signing_data(block: Block) -> bytes:
        """Lấy data để ký block (không bao gồm signature)
        
        CRITICAL: Must use SAME transaction fields as calculate_merkle_root()
        to ensure block_hash is consistent across nodes.
        Excludes: block_id, tx_status, error_reason (metadata added after creation)
        """
        # Convert transactions to serializable format using CORE fields only
        tx_list = []
        for tx in block.transactions:
            if isinstance(tx, Transaction):
                # ✅ Must match calculate_merkle_root() - use core fields only
                tx_list.append({
                    "tx_id": tx.tx_id,
                    "tx_hash": tx.tx_hash,
                    "sender_pubkey": tx.sender_pubkey,
                    "sender_address": tx.sender_address if tx.sender_address is not None else "system",
                    "recipient_address": tx.recipient_address,
                    "payload": tx.payload,
                    "signature": tx.signature,
                    "timestamp": tx.timestamp
                    # ✅ EXCLUDED: block_id, tx_status, error_reason
                })
            else:
                tx_list.append(tx)
        
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
            "transactions": tx_list,
        }
        return json.dumps(data, sort_keys=True).encode()

    # Tính block_hash bằng SHA256
    @staticmethod
    def calculate_hash(block: Block) -> str:
        content = BlockService.get_signing_data(block)
        return HashUtils.hash_sha256(content)


    # Ký block bằng ECDSA SECP256k1
    @staticmethod
    def sign_block(block: Block, private_key_hex: str) -> str:
        """Ký block bằng ECDSA SECP256k1"""
        print("SIGN BLOCK", block.to_dict())
        print("PRIVATE KEY", private_key_hex)
        message = BlockService.get_signing_data(block)
        block.validator_signature = CryptoUtils.sign_data(message, private_key_hex)
        block.block_hash = BlockService.calculate_hash(block)
        
        return block.validator_signature

    # Xác thực chữ ký block
    @staticmethod
    def verify_block(block: Block, public_key_hex: str) -> bool:
        """Xác thực chữ ký block"""
        if block.index == 0 and block.validator_signature == "GENESIS":
            return True
            
        message = BlockService.get_signing_data(block)
        return CryptoUtils.verify_signature(message, block.validator_signature, public_key_hex)

    # Tạo block mới
    @staticmethod
    def create_block(index: int, block_id: str, pre_hash: str, merkle_root: str,
                     validator_pubkey: str, private_key: str, 
                     transactions: List[Transaction] = None) -> Block:
        """
        Create a new block
        
        Args:
            index (int): Block index
            block_id (str): Block ID
            pre_hash (str): Previous block hash
            merkle_root (str): Merkle root of transactions
            validator_pubkey (str): Validator's public key
            private_key (str): Validator's private key for signing
            transactions (List[Transaction]): List of transactions in the block
            
        Returns:
            Block: The created block object
            
        Raises:
            ValueError: If required parameters are missing
        """
        try:
            if transactions is None:
                transactions = []
            
            # Create block header
            block_header = BlockHeader(
                index=index,
                pre_hash=pre_hash,
                merkle_root=merkle_root,
                validator_pubkey=validator_pubkey
            )
            
            # Create block
            block = Block(
                index=index,
                block_id=block_id,
                block_header=block_header,
                transactions=transactions
            )
            
            # Calculate hash and sign block
            block.block_hash = BlockService.calculate_hash(block)
            BlockService.sign_block(block, private_key)
            
            return block
                
        except Exception as e:
            raise Exception(f"Error creating block: {str(e)}")