import time
from typing import Dict, Any, Optional


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
        tx_id: str = "",
        tx_hash: str = "",
        sender_pubkey: str = "",
        sender_address: Optional[str] = None,
        recipient_address: str = "",
        payload: Optional[Dict[str, Any]] = None,
        signature: str = "",
        timestamp: Optional[float] = None,
        block_id: str = "",
        tx_status: str = "PENDING",  # 'PENDING', 'COMMITTED', 'FAILED'
        error_reason: str = ""  # Error message if tx fails
    ) -> None:
        self.tx_id = tx_id
        self.tx_hash = tx_hash
        self.sender_pubkey = sender_pubkey
        self.sender_address = sender_address
        self.recipient_address = recipient_address
        self.payload = payload if payload is not None else {}
        self.signature = signature
        self.timestamp = timestamp if timestamp is not None else time.time()
        self.block_id = block_id
        self.tx_status = tx_status
        self.error_reason = error_reason



    def to_dict(self) -> Dict[str, Any]:
        """Chuyển transaction sang dictionary."""
        return {
            "tx_id": self.tx_id,
            "tx_hash": self.tx_hash,
            "sender_pubkey": self.sender_pubkey,
            "sender_address": self.sender_address,
            "recipient_address": self.recipient_address,
            "payload": self.payload,
            "signature": self.signature,
            "timestamp": self.timestamp,
            "block_id": self.block_id,
            "tx_status": self.tx_status,
            "error_reason": self.error_reason
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "Transaction":
        """Tạo đối tượng TRANSACTION từ dictionary."""
        return Transaction(
            tx_id=data.get("tx_id", ""),
            tx_hash=data.get("tx_hash", ""),
            sender_pubkey=data.get("sender_pubkey", ""),
            sender_address=data.get("sender_address"),  # Allow None for system transactions
            recipient_address=data.get("recipient_address", ""),
            payload=data.get("payload", {}),
            signature=data.get("signature", ""),
            timestamp=data.get("timestamp", time.time()),
            block_id=data.get("block_id", ""),
            tx_status=data.get("tx_status", "PENDING"),
            error_reason=data.get("error_reason", "")
        )
