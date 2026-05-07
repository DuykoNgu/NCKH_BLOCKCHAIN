import hashlib
import json
from ecdsa import SigningKey, VerifyingKey, SECP256k1
from ecdsa.util import sigencode_der, sigdecode_der
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
            str: Chữ ký dạng hex string (DER-encoded)
        """
        sk = SigningKey.from_string(bytes.fromhex(private_key), curve=SECP256k1)
        signing_data = TransactionService.get_signing_data(transaction)
        message_hash = hashlib.sha256(signing_data).digest()
        signature_bytes = sk.sign(message_hash, hashfunc=hashlib.sha256, sigencode=sigencode_der)
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
        tx_hash_short = transaction.tx_hash[:8] if transaction.tx_hash else "???"
        print(f"[is_valid] Starting validation for tx {tx_hash_short}")
        print(f"  - sender_address: {transaction.sender_address}")
        print(f"  - sender_pubkey: {transaction.sender_pubkey[:16] if transaction.sender_pubkey else '(empty)'}...")
        print(f"  - signature: {transaction.signature[:16] if transaction.signature else '(empty)'}...")
        print(f"  - payload type: {type(transaction.payload).__name__}")
        
        # Ensure payload is a dict (handle case where it might be a string)
        payload = transaction.payload
        if isinstance(payload, str):
            print(f"[is_valid] Parsing payload from JSON string...")
            try:
                import json
                payload = json.loads(payload)
                print(f"[is_valid] Payload parsed successfully")
            except Exception as e:
                print(f"[is_valid] ERROR parsing payload: {e}")
                payload = {}
        
        payload_op = payload.get("op") if isinstance(payload, dict) else None
        print(f"[is_valid] payload_op: {payload_op}")
        
        # ── NFT mint transactions ────────────────────────────────────────────────
        # NFT mint_nft signature is produced by the frontend over the
        # NFTmetadata (degree_type, pdf_url, pdf_hash, institution_address, issued_at).
        # It is NOT a tx-level signature, so we verify payload["issuer_signature"] instead.
        if payload_op == "mint_nft":
            print(f"[is_valid] Taking mint_nft path")
            nft_sig = payload.get("issuer_signature", "") if isinstance(payload, dict) else ""
            issuer_pubkey = (
                payload.get("issuer_pubkey", "") if isinstance(payload, dict) else ""
            ) or transaction.sender_pubkey or ""
            
            print(f"[is_valid] nft_sig: {nft_sig[:16] if nft_sig else '(empty)'}...")
            print(f"[is_valid] issuer_pubkey: {issuer_pubkey[:16] if issuer_pubkey else '(empty)'}...")
            
            if not nft_sig or not issuer_pubkey:
                print(f"✗ [is_valid] mint_nft: missing signature or pubkey for {tx_hash_short}")
                return False
            
            # Re-build the canonical NFT signing data that the frontend signed
            # Must match NFTmetadata.get_signing_data()
            import json
            try:
                nft_signing_obj = {
                    "degree_type": payload.get("degree_type"),
                    "pdf_url": payload.get("pdf_url"),
                    "pdf_hash": payload.get("pdf_hash"),
                    "institution_address": payload.get("institution_address"),
                    "issued_at": payload.get("issued_at"),
                }
                # Use SAME separators as NFTmetadata.get_signing_data()
                nft_canonical_data = json.dumps(nft_signing_obj, sort_keys=True, separators=(',', ':'))
                
                from app.utils.CryptoUtils import CryptoUtils
                result = CryptoUtils.verify_signature(nft_canonical_data, nft_sig, issuer_pubkey)
                if not result:
                    print(f"✗ [is_valid] mint_nft sig FAILED for {tx_hash_short}")
                    print(f"    - nft_signing_obj: {nft_signing_obj}")
                    print(f"    - nft_canonical_data: {nft_canonical_data}")
                return result
            except Exception as e:
                print(f"✗ [is_valid] mint_nft verify error for {tx_hash_short}: {e}")
                return False
        
        # ── Account operation transactions ───────────────────────────────────────
        # The account_register signature is produced by the frontend over the
        # canonical account data (address + public_key + role + timestamp).
        # It is NOT a tx-level signature, so we must verify it differently.
        if payload_op in ["account_register", "account_update"]:
            print(f"[is_valid] Taking account_op path for {payload_op}")
            account_sig  = payload.get("signature", "") if isinstance(payload, dict) else ""
            account_pubkey = (
                payload.get("public_key", "") if isinstance(payload, dict) else ""
            ) or transaction.sender_pubkey or ""

            print(f"[is_valid] account_sig: {account_sig[:16] if account_sig else '(empty)'}...")
            print(f"[is_valid] account_pubkey: {account_pubkey[:16] if account_pubkey else '(empty)'}...")
            
            # If no signature in payload → system-initiated tx (no user sig required)
            if not account_sig:
                print(f"[is_valid] ✅ No signature required, treating as system tx")
                return True

            if not account_pubkey:
                print(f"✗ [is_valid] account_op: missing pubkey for {tx_hash_short}")
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
                result = CryptoUtils.verify_signature(canonical_data, account_sig, account_pubkey)
                if not result:
                    print(f"✗ [is_valid] account_op sig FAILED for {tx_hash_short}")
                    print(f"    - payload_op: {payload_op}")
                    print(f"    - signing_obj: {signing_obj}")
                    print(f"    - canonical_data: {canonical_data[:100]}...")
                return result
            except Exception as e:
                print(f"✗ [is_valid] account_op verify error for {tx_hash_short}: {e}")
                return False

        
        # ── System transactions ──────────────────────────────────────────────────
        # sender_address is None or "system" AND no tx signature → trusted internally
        is_system_tx = transaction.sender_address is None or transaction.sender_address == "system"
        if is_system_tx and not transaction.signature:
            print(f"[is_valid] ✅ System transaction (sender={transaction.sender_address})")
            return True
        
        # ── Regular transactions ─────────────────────────────────────────────────
        print(f"[is_valid] Taking regular transaction path")
        if not transaction.sender_pubkey or not transaction.signature:
            print(f"✗ [is_valid] Missing sender_pubkey or signature for tx {tx_hash_short}")
            return False

        try:
            vk = VerifyingKey.from_string(bytes.fromhex(transaction.sender_pubkey), curve=SECP256k1)
            signing_data = TransactionService.get_signing_data(transaction)
            message_hash = hashlib.sha256(signing_data).digest()
            signature_bytes = bytes.fromhex(transaction.signature)
            result = vk.verify(signature_bytes, message_hash, hashfunc=hashlib.sha256, sigdecode=sigdecode_der)
            return result
        except Exception as e:
            print(f"✗ [is_valid] Signature verification failed for tx {tx_hash_short}: {e}")
            return False
