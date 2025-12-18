import hashlib
import json
from typing import List, Dict, Any, Optional

from app.utils.HashUtils import HashUtils
from app.utils.CryptoUtils import CryptoUtils

from app.models.Block import Block
from app.models.BlockHeader import BlockHeader
from app.models.Transaction import Transaction


class BlockService:
    # =========================================================================
    # FACTORY METHODS - Tạo Block từ các nguồn khác nhau
    # =========================================================================
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> Block:
        """
        Tạo Block object từ dictionary data.
        
        Sử dụng khi:
        - Nhận block từ validator khác (VAL-06)
        - Deserialize block từ JSON request
        - Load block từ external source
        
        Args:
            data: Dictionary chứa thông tin block
                {
                    "block_id": str,
                    "index": int,
                    "pre_hash": str,
                    "merkle_root": str,
                    "validator_pubkey": str,
                    "block_hash": str,
                    "validator_signature": str,
                    "timestamp": float (optional),
                    "transactions": list (optional)
                }
        
        Returns:
            Block object đã được khởi tạo đầy đủ
        """
        # Tạo BlockHeader từ data
        block_header = BlockHeader(
            index=data['index'],
            pre_hash=data['pre_hash'],
            merkle_root=data['merkle_root'],
            validator_pubkey=data['validator_pubkey'],
            timestamp=data.get('timestamp')
        )
        
        # Tạo Block object
        block = Block(
            block_id=data['block_id'],
            index=data['index'],
            block_header=block_header,
            transactions=data.get('transactions', [])
        )
        
        # Set hash và signature nếu có
        if 'block_hash' in data:
            block.block_hash = data['block_hash']
        if 'validator_signature' in data:
            block.validator_signature = data['validator_signature']
        
        return block

    @staticmethod
    def to_dict(block: Block, level: str = 'full') -> Dict[str, Any]:
        """
        Chuyển Block object thành dictionary với các level khác nhau.
        
        Args:
            block: Block object cần chuyển đổi
            level: Mức độ chi tiết
                - 'summary': Chỉ thông tin cơ bản (block_id, index, hash)
                - 'standard': Thông tin thường dùng (+ validator, tx count)
                - 'full': Toàn bộ thông tin bao gồm transactions
            
        Returns:
            Dictionary chứa thông tin block theo level
        """
        # Summary - thông tin tối thiểu
        result = {
            "block_id": block.block_id,
            "index": block.index,
            "block_hash": block.block_hash
        }
        
        if level == 'summary':
            return result
        
        # Standard - thêm thông tin validator và số lượng tx
        result.update({
            "validator_pubkey": block.block_header.validator_pubkey,
            "validator_signature": block.validator_signature,
            "transactions_count": len(block.transactions)
        })
        
        if level == 'standard':
            return result
        
        # Full - toàn bộ thông tin
        result.update({
            "pre_hash": block.block_header.pre_hash,
            "merkle_root": block.block_header.merkle_root,
            "timestamp": block.block_header.timestamp,
            "transactions": [
                tx.to_dict() if hasattr(tx, 'to_dict') else tx 
                for tx in block.transactions
            ]
        })
        
        return result
    
    @staticmethod
    def success_response(block: Block, message: str = None, level: str = 'standard') -> Dict[str, Any]:
        """
        Tạo response dictionary chuẩn cho API.
        
        Args:
            block: Block object
            message: Message tùy chọn
            level: Mức độ chi tiết ('summary', 'standard', 'full')
            
        Returns:
            Dictionary response chuẩn {success: True, block: {...}, message: ...}
        """
        response = {
            "success": True,
            "block": BlockService.to_dict(block, level)
        }
        if message:
            response["message"] = message
        return response

    # =========================================================================
    # MERKLE ROOT - Tính toán Merkle Root từ transactions
    # =========================================================================
    
    # Tính Merkle Root từ danh sách transactions
    @staticmethod
    def calculate_merkle_root(transactions: List[Transaction]) -> str:
        if not transactions:
            return ""

        tx_hashes = [
            HashUtils.hash_sha256(json.dumps(tx.to_dict()).encode()).hexdigest()
            for tx in transactions
        ]

        while len(tx_hashes) > 1:
            temp = []

            for i in range(0, len(tx_hashes), 2):
                left = tx_hashes[i]
                right = tx_hashes[i] if i + 1 >= len(tx_hashes) else tx_hashes[i + 1]
                combined = left + right

                temp.append(HashUtils.hash_sha256(combined.encode()).hexdigest())

            tx_hashes = temp

        return tx_hashes[0]
    
    @staticmethod
    def get_signing_data(block: Block) -> bytes:
        """Lấy data để ký block (không bao gồm signature)"""
        # Convert transactions to serializable format
        tx_list = []
        for tx in block.transactions:
            if isinstance(tx, Transaction):
                tx_list.append({
                    "tx_id": tx.tx_id,
                    "sender_pubkey": tx.sender_pubkey,
                    "sender_address": tx.sender_address,
                    "recipient_address": tx.recipient_address,
                    "payload": tx.payload,
                    "timestamp": tx.timestamp,
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
        message = BlockService.get_signing_data(block)
        block.validator_signature = CryptoUtils.sign_data(message, private_key_hex)
        block.block_hash = BlockService.calculate_hash(block)
        return block.validator_signature

    # Xác thực chữ ký block
    @staticmethod
    def verify_block(block: Block, public_key_hex: str) -> bool:
        """Xác thực chữ ký block"""
        message = BlockService.get_signing_data(block)
        return CryptoUtils.verify_signature(message, block.validator_signature, public_key_hex)