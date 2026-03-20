"""
AccountService - Web3 + Backend API pattern

Nguyên tắc:
- Không có register() — identity được tạo qua REGISTER_IDENTITY transaction
- verify_signature() recover từ tx, không lookup DB
- Backend chỉ index data từ chain đã confirm
- on_chain_* methods xử lý sau khi tx được confirm
"""
from typing import Optional, List, Tuple
import datetime

from app.repositories.AccountRepository import AccountRepository
from app.repositories.TransactionRepository import TransactionRepository
from app.services.TransactionService import TransactionService
from app.models.Account import Account, Role
from app.models.Transaction import Transaction, TxType
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AccountService:

    # ─────────────────────────────────────────────
    # AUTH — không cần register, verify từ tx
    # ─────────────────────────────────────────────

    @staticmethod
    def verify_login_signature(address: str, signature: str,
                                pubkey: str, nonce: str) -> Tuple[bool, str]:
        """
        Verify login signature.
        Tạo một tx giả (không lưu) để verify — không cần DB lookup.
        """
        import hashlib
        # Build tx giống như client đã build
        from app.models.Transaction import Transaction, TxType
        tx = Transaction(
            tx_type=TxType.REGISTER_IDENTITY,
            sender_address=address,
            sender_pubkey=pubkey,
            payload={"nonce": nonce},
            nonce=0,
        )
        tx.signature = signature

        is_valid, message = TransactionService.verify(tx)
        return is_valid, message

    @staticmethod
    def get_or_create(address: str, pubkey: str) -> Tuple[Account, bool]:
        """
        Lấy account nếu tồn tại, tạo mới nếu chưa có.
        Được gọi sau khi verify login signature thành công.
        created = True nếu là lần đầu login.
        """
        address = address.lower()
        existing = AccountRepository.get_by_address(address)
        if existing:
            return existing, False

        # Lần đầu login → tạo account với role CLIENT mặc định
        now = datetime.datetime.now()
        account = Account(
            address=address,
            role=Role.CLIENT,
            is_active=1,
            created_at=now.strftime("%d/%m/%Y %H:%M:%S"),
            public_key=pubkey,  # cache để verify nhanh
        )
        AccountRepository.create_account(account)
        logger.info(f"[AccountService] New account created: {address}")
        return account, True

    @staticmethod
    def get_by_address(address: str) -> Optional[Account]:
        return AccountRepository.get_by_address(address.lower())

    @staticmethod
    def get_all() -> List[Account]:
        return AccountRepository.get_all()

    # ─────────────────────────────────────────────
    # ON-CHAIN HANDLERS
    # Được gọi bởi ChainIndexer sau khi tx confirm
    # KHÔNG gọi trực tiếp từ API request
    # ─────────────────────────────────────────────

    @staticmethod
    def on_register_identity_confirmed(tx: Transaction) -> bool:
        """
        Xử lý sau khi REGISTER_IDENTITY tx được confirm vào block.
        Tạo hoặc update account trong DB index.
        """
        address = tx.sender_address
        role_str = tx.payload.get("role", "client")
        try:
            role = Role(role_str)
        except ValueError:
            role = Role.CLIENT

        existing = AccountRepository.get_by_address(address)
        if existing:
            logger.info(f"[AccountService] Identity re-confirmed: {address}")
            return True

        now = datetime.datetime.now()
        account = Account(
            address=address,
            role=role,
            is_active=1,
            created_at=now.strftime("%d/%m/%Y %H:%M:%S"),
            public_key=tx.sender_pubkey,
        )
        success = AccountRepository.create_account(account)
        logger.info(f"[AccountService] on_register_identity_confirmed: {address} → {success}")
        return success

    @staticmethod
    def on_update_profile_confirmed(tx: Transaction) -> bool:
        """
        Xử lý sau khi UPDATE_PROFILE tx confirm.
        Cache profile data vào DB, lưu tx_hash để client verify on-chain.
        """
        address = tx.sender_address
        full_name = tx.payload.get("full_name")
        avatar_url = tx.payload.get("avatar_url")
        tx_hash = tx.tx_hash

        success = AccountRepository.update_profile_tx_hash(
            address, tx_hash, full_name, avatar_url
        )
        logger.info(f"[AccountService] on_update_profile_confirmed: {address} tx={tx_hash}")
        return success

    @staticmethod
    def on_assign_role_confirmed(tx: Transaction) -> bool:
        """
        Xử lý sau khi ASSIGN_ROLE tx confirm.
        Chỉ MOET mới có thể gửi tx loại này — đã verify ở TransactionService.
        """
        target_address = tx.recipient_address
        new_role_str = tx.payload.get("role", "client")
        try:
            new_role = Role(new_role_str)
        except ValueError:
            logger.error(f"[AccountService] Invalid role in ASSIGN_ROLE tx: {new_role_str}")
            return False

        success = AccountRepository.update_role(target_address, new_role)
        logger.info(f"[AccountService] on_assign_role_confirmed: {target_address} → {new_role_str}")
        return success

    # ─────────────────────────────────────────────
    # ADMIN
    # ─────────────────────────────────────────────

    @staticmethod
    def revoke_access(address: str) -> Tuple[bool, str]:
        """
        Deactivate account — không xóa để giữ on-chain history.
        Chỉ MOET mới được gọi endpoint này.
        """
        try:
            success = AccountRepository.deactivate(address.lower())
            if success:
                return True, "Access revoked"
            return False, "Address not found"
        except Exception as e:
            return False, f"Error: {str(e)}"

    @staticmethod
    def get_transaction_history(address: str) -> List[Transaction]:
        """Lấy toàn bộ lịch sử tx của một address từ DB index."""
        sent = TransactionRepository.get_by_sender(address.lower())
        received = TransactionRepository.get_by_recipient(address.lower())

        # Merge + dedup + sort by timestamp
        all_txs = {tx.tx_hash: tx for tx in sent + received}
        return sorted(all_txs.values(), key=lambda t: t.timestamp, reverse=True)
