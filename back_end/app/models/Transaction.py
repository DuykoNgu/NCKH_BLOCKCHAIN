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
        sender_pubkey: str = "",
        sender_address: str = "",
        recipient_address: str = "",
        payload: Optional[Dict[str, Any]] = None,
        signature: str = "",
        timestamp: Optional[float] = None,
        tx_hash: str = "",
    ) -> None:
        self.tx_id = tx_id
        self.sender_pubkey = sender_pubkey
        self.sender_address = sender_address
        self.recipient_address = recipient_address
        self.payload = payload if payload is not None else {}
        self.signature = signature
        self.timestamp = timestamp if timestamp is not None else time.time()
        self.tx_hash = tx_hash



    def to_dict(self) -> Dict[str, Any]:
        """Chuyển transaction sang dictionary."""
        return {
            "tx_id": self.tx_id,
            "sender_pubkey": self.sender_pubkey,
            "sender_address": self.sender_address,
            "recipient_address": self.recipient_address,
            "payload": self.payload,
            "signature": self.signature,
            "timestamp": self.timestamp,
            "tx_hash": self.tx_hash,
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "Transaction":
        """Tạo đối tượng TRANSACTION từ dictionary."""
        return Transaction(
            tx_id=data.get("tx_id", ""),
            sender_pubkey=data.get("sender_pubkey", ""),
            sender_address=data.get("sender_address", ""),
            recipient_address=data.get("recipient_address", ""),
            payload=data.get("payload", {}),
            signature=data.get("signature", ""),
            timestamp=data.get("timestamp", time.time()),
            tx_hash=data.get("tx_hash", ""),
        )
