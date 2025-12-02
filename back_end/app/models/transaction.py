import hashlib
import json
import time
from typing import Dict, Any, Optional
from ecdsa import SigningKey, VerifyingKey, SECP256k1


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

    def get_signing_data(self) -> bytes:
        """
        Dữ liệu thô cần ký (không bao gồm signature, tx_id, tx_hash).
        Chỉ bao gồm: sender_pubkey, sender_address, recipient_address, payload, timestamp.
        """
        data = {
            "sender_pubkey": self.sender_pubkey,
            "sender_address": self.sender_address,
            "recipient_address": self.recipient_address,
            "payload": self.payload,
            "timestamp": self.timestamp,
        }
        return json.dumps(data, sort_keys=True).encode()

    def calculate_hash(self) -> str:
        """
        Tính hash của giao dịch (SHA256).
        Hash được tính từ signing_data (không bao gồm signature).
        """
        signing_data = self.get_signing_data()
        return hashlib.sha256(signing_data).hexdigest()

    def sign(self, private_key: str) -> str:
        """
        Ký transaction bằng private key (ECDSA SECP256k1).
        
        Args:
            private_key: Private key dạng hex string (SECP256k1)
            
        Returns:
            str: Chữ ký dạng hex string
        """
        sk = SigningKey.from_string(bytes.fromhex(private_key), curve=SECP256k1)
        signing_data = self.get_signing_data()
        message_hash = hashlib.sha256(signing_data).digest()
        signature_bytes = sk.sign(message_hash)
        self.signature = signature_bytes.hex()
        
        # Tạo tx_id nếu chưa có (hash của signing_data + signature)
        if not self.tx_id:
            combined = signing_data + signature_bytes
            self.tx_id = hashlib.sha256(combined).hexdigest()
        
        # Cập nhật tx_hash
        self.tx_hash = self.calculate_hash()
        
        return self.signature

    def is_valid(self) -> bool:
        """
        Kiểm tra chữ ký người gửi có khớp với payload không.
        """
        if not self.sender_pubkey or not self.signature:
            return False
        
        try:
            vk = VerifyingKey.from_string(bytes.fromhex(self.sender_pubkey), curve=SECP256k1)
            signing_data = self.get_signing_data()
            message_hash = hashlib.sha256(signing_data).digest()
            signature_bytes = bytes.fromhex(self.signature)
            return vk.verify(signature_bytes, message_hash)
        except Exception:
            return False

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
