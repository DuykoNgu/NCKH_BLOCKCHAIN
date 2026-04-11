"""AccountService - Business logic layer for Account operations

Strategy for cross-node sync:
  Every mutating operation (register / update_profile) does TWO things:
  1. Writes to the LOCAL database immediately so the API call is fast.
  2. Creates a blockchain Transaction and submits it to the mempool so that
     validators will package it into a Block, broadcast via gossip, and
     OTHER nodes will apply it via BlockChainService.execute_transaction().
"""
import hashlib
import datetime
import json
from typing import Optional, List, Tuple

from app.repositories.AccountRepository import AccountRepository
from app.models.Account import Account, Role
from app.models.Transaction import Transaction
from app.utils.CryptoUtils import CryptoUtils
from app.utils.logger import get_logger
from app.blockchain_instance import get_blockchain_instance
from app.services.NetworkService import get_network_service

logger = get_logger(__name__)

# Sentinel address used for system-originated account transactions (no real sender)
SYSTEM_ADDRESS = "system"


def _build_account_tx(payload: dict, sender_address: str = SYSTEM_ADDRESS) -> Transaction:
    """Build and hash a system Transaction for an account operation."""
    data_to_hash = json.dumps(payload, sort_keys=True).encode()
    tx_hash = hashlib.sha256(data_to_hash).hexdigest()

    tx = Transaction(
        tx_id=tx_hash,
        tx_hash=tx_hash,
        sender_pubkey="",          # system-initiated, no user pubkey needed
        sender_address=sender_address,
        recipient_address=SYSTEM_ADDRESS,
        payload=payload,
        signature="",              # no signature for server-initiated txs
        timestamp=datetime.datetime.now().timestamp(),
    )
    return tx


def _submit_tx(tx: Transaction) -> None:
    """Push tx into mempool and broadcast to peers (best-effort)."""
    try:
        from app.services.BlockChainService import BlockChainService

        blockchain = get_blockchain_instance()
        # add_transaction_to_mempool accepts txs with empty signature as system txs
        BlockChainService.add_transaction_to_mempool(blockchain, tx)
        logger.info(f"[AccountService] TX added to mempool: {tx.tx_hash[:16]}... op={tx.payload.get('op')}")

        # Gossip to peers so they add it to their mempool too (reduces latency)
        try:
            net = get_network_service()
            net.broadcast_transaction(tx.to_dict())
        except Exception as net_err:
            logger.warning(f"[AccountService] broadcast_transaction failed (non-fatal): {net_err}")

    except Exception as e:
        logger.error(f"[AccountService] _submit_tx failed: {e}")


class AccountService:
    """Service for Account business logic"""

    @staticmethod
    def register_account(
        address: str, public_key: str, role: Role = Role.CLIENT
    ) -> Tuple[bool, Optional[Account], str]:
        address = address.lower()
        try:
            existing = AccountRepository.get_account_by_address(address)
            if existing:
                logger.warning(f"⚠ Account already exists: {address}")
                return False, None, "Account already exists"

            now = datetime.datetime.now()
            created_at = now.strftime("%d/%m/%Y %H:%M:%S")

            account = Account(
                address=address,
                public_key=public_key,
                role=role,
                is_active=1,
                created_at=created_at,
            )

            # 1. Write to local DB immediately (fast UX)
            logger.info(f"→ Registering account: {address} (role={role.value if hasattr(role, 'value') else role})")
            success = AccountRepository.create_account(account)
            if not success:
                logger.error(f"✗ Failed to save account to database: {address}")
                return False, None, "Failed to save account to database"

            logger.info(f"✓ Account registered successfully: {address}")

            # 2. Submit blockchain transaction so other nodes can sync
            role_str = role.value if hasattr(role, "value") else str(role)
            payload = {
                "op": "account_register",
                "address": address,
                "public_key": public_key,
                "role": role_str,
                "created_at": created_at,
            }
            tx = _build_account_tx(payload, sender_address=address)
            _submit_tx(tx)

            return True, account, "Account registered successfully"

        except Exception as e:
            logger.error(f"✗ Registration error: {str(e)}")
            return False, None, f"Registration error: {str(e)}"

    @staticmethod
    def get_account_by_address(address: str) -> Optional[Account]:
        """Get account by address"""
        address = address.lower()
        try:
            return AccountRepository.get_account_by_address(address)
        except Exception as e:
            logger.error(f"Error getting account by address: {e}")
            return None

    @staticmethod
    def get_all_account() -> List[Account]:
        """Get all accounts"""
        try:
            return AccountRepository.get_all_accounts()
        except Exception as e:
            logger.error(f"Error getting all accounts: {e}")
            return []

    @staticmethod
    def delete_account(address: str) -> Tuple[bool, str]:
        """Delete account"""
        address = address.lower()
        try:
            account = AccountRepository.get_account_by_address(address)
            if not account:
                return False, "Account not found"

            success = AccountRepository.delete_account(address)
            if success:
                return True, "Account deleted successfully"
            else:
                return False, "Failed to delete account"
        except Exception as e:
            return False, f"Error deleting account: {str(e)}"

    @staticmethod
    def verify_user_signature(
        address: str, message: str, signature: str
    ) -> Tuple[bool, str]:
        """Verify a message signed by account"""
        try:
            account = AccountRepository.get_account_by_address(address)
            if not account:
                return False, "account not found"

            is_valid = CryptoUtils.verify_signature(message, signature, account.public_key)
            if is_valid:
                return True, "Signature valid"
            else:
                return False, "Invalid signature"
        except Exception as e:
            return False, f"Verification error: {str(e)}"

    @staticmethod
    def update_profile(
        address: str, full_name: str = None, avatar_url: str = None
    ) -> Tuple[bool, Optional[Account], str]:
        """Update account profile (name and avatar)"""
        address = address.lower()
        logger.info(f"Updating profile for address: {address}")
        try:
            account = AccountRepository.get_account_by_address(address)
            if not account:
                logger.warning(f"Profile update failed: Account {address} not found")
                return False, None, "Account not found"

            logger.info(f"Found account: {account.address}. New name: {full_name}")

            if full_name is not None:
                account.full_name = full_name
            if avatar_url is not None:
                account.avatar_url = avatar_url

            # 1. Write to local DB immediately (fast UX)
            success = AccountRepository.update_account(account)
            if not success:
                return False, None, "Failed to update profile in database"

            # 2. Submit blockchain transaction so other nodes can sync
            payload = {"op": "account_update", "address": address}
            if full_name is not None:
                payload["full_name"] = full_name
            if avatar_url is not None:
                payload["avatar_url"] = avatar_url

            tx = _build_account_tx(payload, sender_address=address)
            _submit_tx(tx)

            return True, account, "Profile updated successfully"

        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            return False, None, f"Update error: {str(e)}"
