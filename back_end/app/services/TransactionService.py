import hashlib
import json
from typing import Dict, Any
from ecdsa import SigningKey, VerifyingKey, SECP256k1
from ..models.Transaction import Transaction


class TransactionService:
    # =========================================================================
    # FACTORY METHODS - Tạo Transaction từ các nguồn khác nhau
    # =========================================================================
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> Transaction:
        """
        Tạo Transaction object từ dictionary data.
        
        Sử dụng khi:
        - Nhận transaction từ request API
        - Deserialize transaction từ JSON
        
        Args:
            data: Dictionary chứa thông tin transaction
                {
                    "sender_pubkey": str,
                    "sender_address": str,
                    "recipient_address": str,
                    "payload": dict (optional),
                    "tx_id": str (optional),
                    "signature": str (optional),
                    "timestamp": float (optional),
                    "tx_hash": str (optional)
                }
        
        Returns:
            Transaction object đã được khởi tạo
        """
        tx = Transaction(
            sender_pubkey=data.get('sender_pubkey', ''),
            sender_address=data.get('sender_address', ''),
            recipient_address=data.get('recipient_address', ''),
            payload=data.get('payload', {})
        )
        
        # Set optional fields nếu có
        if 'tx_id' in data:
            tx.tx_id = data['tx_id']
        if 'signature' in data:
            tx.signature = data['signature']
        if 'timestamp' in data:
            tx.timestamp = data['timestamp']
        if 'tx_hash' in data:
            tx.tx_hash = data['tx_hash']
        
        return tx

    @staticmethod
    def to_dict(tx: Transaction, level: str = 'full') -> Dict[str, Any]:
        """
        Chuyển Transaction object thành dictionary với các level khác nhau.
        
        Args:
            tx: Transaction object
            level: Mức độ chi tiết
                - 'summary': tx_id, sender, recipient, timestamp
                - 'standard': + tx_hash
                - 'full': + payload, signature, sender_pubkey
        """
        result = {
            "tx_id": tx.tx_id,
            "sender_address": tx.sender_address,
            "recipient_address": tx.recipient_address,
            "timestamp": tx.timestamp
        }
        
        if level == 'summary':
            return result
        
        result["tx_hash"] = tx.tx_hash
        
        if level == 'standard':
            return result
        
        # Full
        result.update({
            "sender_pubkey": tx.sender_pubkey,
            "payload": tx.payload,
            "signature": tx.signature
        })
        return result
    
    @staticmethod
    def success_response(tx: Transaction, message: str = None, level: str = 'standard') -> Dict[str, Any]:
        """Tạo response dictionary chuẩn cho API."""
        response = {
            "success": True,
            "transaction": TransactionService.to_dict(tx, level)
        }
        if message:
            response["message"] = message
        return response

    # =========================================================================
    # SIGNING DATA - Lấy dữ liệu để ký
    # =========================================================================
    
    # Lấy dữ liệu cần ký cho transaction
    @staticmethod
    def get_signing_data(transaction: Transaction) -> bytes:
        """
        Dữ liệu thô cần ký (không bao gồm signature, tx_id, tx_hash).
        Chỉ bao gồm: sender_pubkey, sender_address, recipient_address, payload, timestamp.
        """
        data = {
            "sender_pubkey": transaction.sender_pubkey,
            "sender_address": transaction.sender_address,
            "recipient_address": transaction.recipient_address,
            "payload": transaction.payload,
            "timestamp": transaction.timestamp,
        }
        return json.dumps(data, sort_keys=True).encode()

    # Tính hash của transaction
    @staticmethod
    def calculate_hash(transaction: Transaction) -> str:
        """
        Tính hash của giao dịch (SHA256).
        Hash được tính từ signing_data (không bao gồm signature).
        """
        signing_data = TransactionService.get_signing_data(transaction)
        return hashlib.sha256(signing_data).hexdigest()

    # Ký transaction bằng private key
    @staticmethod
    def sign(transaction: Transaction, private_key: str) -> str:
        """
        Ký transaction bằng private key (ECDSA SECP256k1).

        Args:
            private_key: Private key dạng hex string (SECP256k1)

        Returns:
            str: Chữ ký dạng hex string
        """
        sk = SigningKey.from_string(bytes.fromhex(private_key), curve=SECP256k1)
        signing_data = TransactionService.get_signing_data(transaction)
        message_hash = hashlib.sha256(signing_data).digest()
        signature_bytes = sk.sign(message_hash)
        transaction.signature = signature_bytes.hex()

        # Tạo tx_id nếu chưa có (hash của signing_data + signature)
        if not transaction.tx_id:
            combined = signing_data + signature_bytes
            transaction.tx_id = hashlib.sha256(combined).hexdigest()

        # Cập nhật tx_hash
        transaction.tx_hash = TransactionService.calculate_hash(transaction)

        return transaction.signature

    # Kiểm tra tính hợp lệ của transaction
    @staticmethod
    def is_valid(transaction: Transaction) -> bool:
        """
        Kiểm tra chữ ký người gửi có khớp với payload không.
        """
        if not transaction.sender_pubkey or not transaction.signature:
            return False

        try:
            vk = VerifyingKey.from_string(bytes.fromhex(transaction.sender_pubkey), curve=SECP256k1)
            signing_data = TransactionService.get_signing_data(transaction)
            message_hash = hashlib.sha256(signing_data).digest()
            signature_bytes = bytes.fromhex(transaction.signature)
            return vk.verify(signature_bytes, message_hash)
        except Exception:
            return False
    
    # Alias for is_valid (for compatibility)
    @staticmethod
    def verify(transaction: Transaction) -> bool:
        """Verify transaction signature (alias for is_valid)"""
        return TransactionService.is_valid(transaction)