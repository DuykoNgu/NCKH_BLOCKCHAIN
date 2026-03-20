"""
Mọi thao tác đều là transaction on-chain:
- REGISTER_IDENTITY  : lần đầu login → ghi address lên chain
- UPDATE_PROFILE     : cập nhật thông tin → hash lưu on-chain
- ASSIGN_ROLE        : MOET gán role → on-chain, trustless
- MINT_NFT           : cấp bằng → NFT data on-chain
- REVOKE_NFT         : thu hồi bằng → on-chain audit trail
- VALIDATE_BLOCK     : validator ký block (internal)
"""

import hashlib
import json
import time
from enum import Enum
from typing import Any, Dict, Optional


class TxType(Enum):
    """Các loại transaction được hỗ trợ trong blockchain."""
    
    # Identity
    REGISTER_IDENTITY = "REGISTER_IDENTITY"
    UPDATE_PROFILE = "UPDATE_PROFILE"
    
    # Role (MOET only)
    ASSIGN_ROLE = "ASSIGN_ROLE"
    REVOKE_ROLE = "REVOKE_ROLE"
    
    # NFT / Degree
    MINT_NFT = "MINT_NFT"
    REVOKE_NFT = "REVOKE_NFT"
    
    # Internal
    VALIDATE_BLOCK = "VALIDATE_BLOCK"


class Transaction:
    """
    Class TRANSACTION cho blockchain
    
    Thuộc tính:
        - tx_id: str (Hash của giao dịch)
        - sender_pubkey: str
        - sender_address: str
        - recipient_address: str
        - payload: Dict[str, Any] (Dữ liệu NFT hoặc dữ liệu khác)
        - signature: str (Chữ ký của người gửi giao dịch)
        - timestamp: float
        - tx_hash: str
    """
    
    def __init__(
        self,
        tx_type: TxType,
        sender_address: str,
        sender_pubkey: str,
        payload: Dict[str, Any],
        recipient_address: str = "",
        nonce: int = 0,
        timestamp: Optional[float] = None,
        signature: str = "",
        tx_hash: str = "",
        tx_id: str = "",
        block_id: str = "",
    ):
        self.tx_type = tx_type
        self.sender_address = sender_address.lower()
        self.sender_pubkey = sender_pubkey  # dùng để verify sig, không phải identity
        self.recipient_address = recipient_address.lower() if recipient_address else ""
        self.payload = payload
        self.nonce = nonce
        self.timestamp = timestamp or time.time()
        self.signature = signature
        self.tx_hash = tx_hash
        self.tx_id = tx_id
        self.block_id = block_id
    
    def get_signing_data(self) -> bytes:
        """
        Data để ký — KHÔNG bao gồm signature, tx_hash, tx_id, block_id.
        Thêm tx_type + nonce so với model cũ.
        """
        data = {
            "tx_type": self.tx_type.value,
            "sender_address": self.sender_address,
            "sender_pubkey": self.sender_pubkey,
            "recipient_address": self.recipient_address,
            "payload": self.payload,
            "nonce": self.nonce,
            "timestamp": self.timestamp,
        }
        return json.dumps(data, sort_keys=True).encode()
    
    def compute_hash(self) -> str:
        """
        Tính hash của transaction.
        
        Returns:
            str: SHA-256 hash của signing data
        """
        return hashlib.sha256(self.get_signing_data()).hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Chuyển đổi transaction sang dictionary.
        
        Returns:
            Dict chứa tất cả các trường của transaction
        """
        return {
            "tx_type": self.tx_type.value,
            "tx_id": self.tx_id,
            "tx_hash": self.tx_hash,
            "sender_pubkey": self.sender_pubkey,
            "sender_address": self.sender_address,
            "recipient_address": self.recipient_address,
            "payload": self.payload,
            "nonce": self.nonce,
            "signature": self.signature,
            "timestamp": self.timestamp,
            "block_id": self.block_id,
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "Transaction":
        """
        Tạo Transaction từ dictionary.
        
        Args:
            data: Dictionary chứa các trường của transaction
            
        Returns:
            Transaction: Instance mới của Transaction
        """
        tx_type_val = data.get("tx_type", "REGISTER_IDENTITY")
        
        try:
            tx_type = TxType(tx_type_val)
        except ValueError:
            tx_type = TxType.REGISTER_IDENTITY
        
        return Transaction(
            tx_type=tx_type,
            sender_address=data.get("sender_address", ""),
            sender_pubkey=data.get("sender_pubkey", ""),
            recipient_address=data.get("recipient_address", ""),
            payload=data.get("payload", {}),
            nonce=data.get("nonce", 0),
            timestamp=data.get("timestamp", time.time()),
            signature=data.get("signature", ""),
            tx_hash=data.get("tx_hash", ""),
            tx_id=data.get("tx_id", ""),
            block_id=data.get("block_id", ""),
        )
