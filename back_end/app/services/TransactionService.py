"""
TransactionService - Web3 pattern

Thay đổi quan trọng nhất:
- verify() recover address từ signature → không cần DB lookup
- Thêm nonce vào signing data → chống replay attack
- Thêm build_*() helpers để tạo từng loại tx chuẩn
"""
import hashlib
import json
from ecdsa import SigningKey, VerifyingKey, SECP256k1
from typing import Tuple

from app.models.Transaction import Transaction, TxType
from app.utils.logger import get_logger

logger = get_logger(__name__)


class TransactionService:
    @staticmethod
    def sign(tx: Transaction, private_key_hex: str) -> str:
        """
        Ký transaction bằng private key.
        Gọi từ CLIENT — backend không bao giờ ký thay client.
        """
        sk = SigningKey.from_string(bytes.fromhex(private_key_hex), curve=SECP256k1)
        signing_data = tx.get_signing_data()
        msg_hash = hashlib.sha256(signing_data).digest()
        sig_bytes = sk.sign(msg_hash)

        tx.signature = sig_bytes.hex()
        tx.tx_hash = TransactionService.calculate_hash(tx)

        # tx_id = hash(signing_data + signature) — unique per tx
        combined = signing_data + sig_bytes
        tx.tx_id = hashlib.sha256(combined).hexdigest()

        return tx.signature

    @staticmethod
    def verify(tx: Transaction) -> Tuple[bool, str]:
        """
        Web3 pattern: verify bằng sender_pubkey có trong tx.
        Sau đó kiểm tra sender_pubkey derive ra đúng sender_address không.

        Không cần DB lookup — tx tự chứa đủ thông tin để verify.
        """
        if not tx.sender_pubkey or not tx.signature:
            return False, "Missing pubkey or signature"

        try:
            # 1. Verify signature khớp với sender_pubkey
            vk = VerifyingKey.from_string(bytes.fromhex(tx.sender_pubkey), curve=SECP256k1)
            signing_data = tx.get_signing_data()
            msg_hash = hashlib.sha256(signing_data).digest()
            vk.verify(bytes.fromhex(tx.signature), msg_hash)

            # 2. Verify sender_pubkey derive ra đúng sender_address
            derived_address = TransactionService._pubkey_to_address(tx.sender_pubkey)
            if derived_address != tx.sender_address.lower():
                return False, f"Pubkey mismatch: derived {derived_address} != {tx.sender_address}"

            return True, "Valid"

        except Exception as e:
            logger.warning(f"[TxService] verify failed: {e}")
            return False, "Invalid signature"

    @staticmethod
    def calculate_hash(tx: Transaction) -> str:
        return hashlib.sha256(tx.get_signing_data()).hexdigest()

    @staticmethod
    def build_register_identity(sender_address: str, sender_pubkey: str,
                                 nonce: int, role: str = "client") -> Transaction:
        """
        Tx đầu tiên khi user login lần đầu.
        Ghi identity lên chain — thay thế /register endpoint.
        """
        return Transaction(
            tx_type=TxType.REGISTER_IDENTITY,
            sender_address=sender_address,
            sender_pubkey=sender_pubkey,
            payload={"role": role},
            nonce=nonce,
        )

    @staticmethod
    def build_update_profile(sender_address: str, sender_pubkey: str,
                              full_name: str, avatar_url: str,
                              nonce: int) -> Transaction:
        """
        Profile data hash lưu on-chain.
        Backend cache full_name/avatar_url để query nhanh.
        """
        # Hash profile data — source of truth on-chain
        profile_data = json.dumps(
            {"full_name": full_name, "avatar_url": avatar_url},
            sort_keys=True
        )
        profile_hash = hashlib.sha256(profile_data.encode()).hexdigest()

        return Transaction(
            tx_type=TxType.UPDATE_PROFILE,
            sender_address=sender_address,
            sender_pubkey=sender_pubkey,
            payload={
                "profile_hash": profile_hash,
                # Raw data cũng lưu để backend index — nhưng hash là authoritative
                "full_name": full_name,
                "avatar_url": avatar_url,
            },
            nonce=nonce,
        )

    @staticmethod
    def build_assign_role(sender_address: str, sender_pubkey: str,
                           target_address: str, new_role: str,
                           nonce: int) -> Transaction:
        """
        MOET gán role cho address khác.
        Trustless vì lưu on-chain + có signature của MOET.
        """
        return Transaction(
            tx_type=TxType.ASSIGN_ROLE,
            sender_address=sender_address,
            sender_pubkey=sender_pubkey,
            recipient_address=target_address,
            payload={"role": new_role},
            nonce=nonce,
        )

    @staticmethod
    def build_mint_nft(sender_address: str, sender_pubkey: str,
                        recipient_address: str, metadata: dict,
                        nonce: int) -> Transaction:
        """
        Cấp bằng tốt nghiệp dưới dạng NFT.
        metadata chứa: degree_type, pdf_hash, institution_address, issued_at
        """
        # Hash metadata — pdf_hash bên trong đã là hash của file PDF
        meta_hash = hashlib.sha256(
            json.dumps(metadata, sort_keys=True).encode()
        ).hexdigest()

        return Transaction(
            tx_type=TxType.MINT_NFT,
            sender_address=sender_address,
            sender_pubkey=sender_pubkey,
            recipient_address=recipient_address,
            payload={
                "metadata": metadata,
                "metadata_hash": meta_hash,  # on-chain fingerprint
            },
            nonce=nonce,
        )

    @staticmethod
    def build_revoke_nft(sender_address: str, sender_pubkey: str,
                          token_id: str, reason: str,
                          nonce: int) -> Transaction:
        """
        Thu hồi bằng (NFT).
        """
        return Transaction(
            tx_type=TxType.REVOKE_NFT,
            sender_address=sender_address,
            sender_pubkey=sender_pubkey,
            payload={"token_id": token_id, "reason": reason},
            nonce=nonce,
        )

    @staticmethod
    def _pubkey_to_address(pubkey_hex: str) -> str:
        """
        Derive address từ public key.
        address = sha256(pubkey_bytes)[-40:] — consistent với walletGenerator ở frontend.
        """
        pub_bytes = bytes.fromhex(pubkey_hex)
        return hashlib.sha256(pub_bytes).hexdigest()[-40:]
