import hashlib
import json
from ecdsa import SigningKey, VerifyingKey, SECP256k1
from ..models.Transaction import Transaction


class TransactionService:
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