import hashlib
import json
from ecdsa import SigningKey, VerifyingKey, SECP256k1
from models.Transaction import Transaction


class TransactionService:
    # Lấy dữ liệu cần ký cho transaction
    @staticmethod
    def get_signing_data(transaction: Transaction) -> bytes:
        """
        Dữ liệu thô cần ký (không bao gồm signature, tx_id, tx_hash).
        Chỉ bao gồm: sender_pubkey, sender_address, recipient_address, payload, timestamp.
        """
        data = {
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
        Kiểm tra tính hợp lệ của transaction.
        
        Special cases:
        - account_register / account_update: verify payload["signature"] against
          the canonical account signing data (NOT the tx-level signing data).
          This matches the signature produced by the frontend / AccountController.
        - System transactions (sender_address=None or "system" with empty signature)
        - Regular transactions: verify tx.signature against tx signing data
        """
        # Ensure payload is a dict (handle case where it might be a string)
        payload = transaction.payload
        if isinstance(payload, str):
            try:
                import json
                payload = json.loads(payload)
            except:
                payload = {}
        
        payload_op = payload.get("op") if isinstance(payload, dict) else None
        
        # ── Account operation transactions ───────────────────────────────────────
        # The account_register signature is produced by the frontend over the
        # canonical account data (address + public_key + role + timestamp).
        # It is NOT a tx-level signature, so we must verify it differently.
        if payload_op in ["account_register", "account_update"]:
            account_sig  = payload.get("signature", "") if isinstance(payload, dict) else ""
            account_pubkey = (
                payload.get("public_key", "") if isinstance(payload, dict) else ""
            ) or transaction.sender_pubkey or ""

            # If no signature in payload → system-initiated tx (no user sig required)
            if not account_sig:
                return True

            if not account_pubkey:
                return False

            # Re-build the canonical signing data that the frontend signed.
            # Must mirror TransactionAcount.get_signing_data() / TransactionUpdateAccount.get_signing_data()
            import json
            try:
                if payload_op == "account_register":
                    # mirrors TransactionAcount.get_signing_data():
                    # { address, public_key, role, timestamp } — NO "op" field
                    signing_obj = {
                        "address":    payload.get("address"),
                        "public_key": payload.get("public_key"),
                        "role":       payload.get("role"),
                        "timestamp":  payload.get("timestamp"),
                    }
                else:  # account_update
                    # mirrors TransactionUpdateAccount.get_signing_data()
                    signing_obj = {
                        "address":        payload.get("address"),
                        "avatar_url":     payload.get("avatar_url"),
                        "email":          payload.get("email"),
                        "full_name":      payload.get("full_name"),
                        "phone":          payload.get("phone"),
                        "representative": payload.get("representative"),
                        "tax_id":         payload.get("tax_id"),
                        "timestamp":      payload.get("timestamp"),
                    }

                # Remove None values (frontend may omit missing keys)
                signing_obj = {k: v for k, v in signing_obj.items() if v is not None}
                # Use SAME separators as Account.get_signing_data()
                canonical_data = json.dumps(signing_obj, sort_keys=True, separators=(',', ':'))

                from app.utils.CryptoUtils import CryptoUtils
                return CryptoUtils.verify_signature(canonical_data, account_sig, account_pubkey)
            except Exception as e:
                print(f"✗ [is_valid] account_op verify error: {e}")
                return False

        
        # ── System transactions ──────────────────────────────────────────────────
        # sender_address is None or "system" AND no tx signature → trusted internally
        is_system_tx = transaction.sender_address is None or transaction.sender_address == "system"
        if is_system_tx and not transaction.signature:
            return True
        
        # ── Regular transactions ─────────────────────────────────────────────────
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