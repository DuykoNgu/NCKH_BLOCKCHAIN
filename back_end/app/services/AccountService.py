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
    """Build and hash a system Transaction for an account operation.
    
    NOTE: tx.signature is intentionally left EMPTY for account_register /
    account_update transactions.  The user's proof-of-ownership signature is
    stored inside payload["signature"].  TransactionService.is_valid() knows
    how to verify that field separately.
    """
    data_to_hash = json.dumps(payload, sort_keys=True).encode()
    tx_hash = hashlib.sha256(data_to_hash).hexdigest()
    sender_pubkey = ""
    if sender_address != SYSTEM_ADDRESS:
        acc = AccountService.get_account_by_address(sender_address)
        sender_pubkey = acc.public_key if acc else ""

    tx = Transaction(
        tx_id=tx_hash,
        tx_hash=tx_hash,
        sender_pubkey=sender_pubkey,
        sender_address=sender_address,
        recipient_address=SYSTEM_ADDRESS,
        payload=payload,
        signature="",          # ← always empty; proof is in payload["signature"]
        timestamp=datetime.datetime.now().timestamp(),
    )
    return tx


def _submit_tx(tx: Transaction) -> None:
    """Push tx into mempool, save to database, and broadcast to peers (best-effort)."""
    try:
        from app.services.BlockChainService import BlockChainService
        from app.repositories.TransactionRepository import TransactionRepository

        blockchain = get_blockchain_instance()
        
        # Debug logging
        tx_op = tx.payload.get('op') if isinstance(tx.payload, dict) else 'unknown'
        logger.info(f"[AccountService] Submitting TX: hash={tx.tx_hash[:16]}... op={tx_op}")
        logger.info(f"  - payload type: {type(tx.payload)}")
        logger.info(f"  - signature (tx-level): {tx.signature[:16] if tx.signature else '(empty)'}")
        if isinstance(tx.payload, dict):
            logger.info(f"  - payload['signature']: {tx.payload.get('signature', '(missing)')[:16] if tx.payload.get('signature') else '(empty)'}")
            logger.info(f"  - payload['timestamp']: {tx.payload.get('timestamp')}")
        
        tx_hashes_in_mempool = {t.tx_hash for t in blockchain.mempool}
        if tx.tx_hash in tx_hashes_in_mempool:
            logger.info(f"[AccountService] TX already in mempool: {tx.tx_hash[:16]}... op={tx_op}")
        else:
            # add_transaction_to_mempool accepts txs with empty signature as system txs
            BlockChainService.add_transaction_to_mempool(blockchain, tx)
            logger.info(f"[AccountService] TX added to mempool: {tx.tx_hash[:16]}... op={tx_op}")


        if TransactionRepository.create_transaction(tx):
            logger.info(f"[AccountService] TX saved to database: {tx.tx_hash[:16]}... op={tx_op}")
        else:
            logger.warning(f"[AccountService] Failed to save TX to database: {tx.tx_hash[:16]}...")

        # Gossip to peers so they add it to their mempool too (reduces latency)
        try:
            net = get_network_service()
            peers_notified = net.broadcast_transaction(tx.to_dict())
            logger.info(f"[AccountService] TX broadcasted to {peers_notified} peers: {tx.tx_hash[:16]}...")
        except Exception as net_err:
            logger.warning(f"[AccountService] broadcast_transaction failed (non-fatal): {net_err}")

    except Exception as e:
        logger.error(f"[AccountService] _submit_tx failed: {e}")


class AccountService:
    """Service for Account business logic"""

    @staticmethod
    def register_account(
        address: str,
        public_key: str,
        role: Role = Role.CLIENT,
        vault: str = None,
        signature: str = None,
        reg_timestamp = None,
        full_name: str = None,
        tax_id: str = None,
        representative: str = None,
        email: str = None,
        phone: str = None,
    ) -> Tuple[bool, Optional[Account], str]:
        address = address.lower()
        try:
            existing = AccountRepository.get_account_by_address(address)
            if existing:
                logger.warning(f"⚠ Account already exists: {address}")
                return False, None, "Account already exists"

            now = datetime.datetime.now()
            created_at = now.strftime("%d/%m/%Y %H:%M:%S")

            # Default is_active=1 for CLIENT/MOET, is_active=0 for VALIDATOR (pending approval)
            is_active = 0 if role == Role.VALIDATOR else 1

            account = Account(
                address=address,
                public_key=public_key,
                role=role,
                vault=vault,
                is_active=is_active,
                created_at=created_at,
                full_name=full_name,
                tax_id=tax_id,
                representative=representative,
                email=email,
                phone=phone,
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
            if vault:
                payload["vault"] = vault
            if reg_timestamp is not None:
                payload["timestamp"] = reg_timestamp
            if full_name:
                payload["full_name"] = full_name
            if tax_id:
                payload["tax_id"] = tax_id
            if representative:
                payload["representative"] = representative
            if email:
                payload["email"] = email
            if phone:
                payload["phone"] = phone
            if signature:
                payload["signature"] = signature


            tx = _build_account_tx(payload, sender_address=address)
            _submit_tx(tx)

            return True, account, "Account registered successfully"

        except Exception as e:
            logger.error(f"✗ Registration error: {str(e)}")
            return False, None, f"Registration error: {str(e)}"

    @staticmethod
    def get_account_by_address(address_or_name: str) -> Optional[Account]:
        """Get account by address or name"""
        try:
            return AccountRepository.get_account_by_identifier(address_or_name)
        except Exception as e:
            logger.error(f"Error getting account by address/name: {e}")
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
    def update_profile(account: Account, address: str, full_name: str = None, avatar_url: str = None, tax_id: str = None, representative: str = None, email: str = None, phone: str = None) -> Tuple[bool, Optional[Account], str]:
        """Update account profile (name and avatar)"""
        address = address.lower()
        logger.info(f"Updating profile for address: {address}")
        try:
            if full_name is not None:
                account.full_name = full_name
            if avatar_url is not None:
                account.avatar_url = avatar_url
            if tax_id is not None:
                account.tax_id = tax_id
            if representative is not None:
                account.representative = representative
            if email is not None:
                account.email = email
            if phone is not None:
                account.phone = phone
                
            success = AccountRepository.update_account(account)
            if not success:
                return False, None, "Failed to update profile in database"

            # 2. Submit blockchain transaction so other nodes can sync
            payload = {"op": "account_update", "address": address}
            if full_name is not None:
                payload["full_name"] = full_name
            if avatar_url is not None:
                payload["avatar_url"] = avatar_url
            if tax_id is not None:
                payload["tax_id"] = tax_id
            if representative is not None:
                payload["representative"] = representative
            if email is not None:
                payload["email"] = email
            if phone is not None:
                payload["phone"] = phone

            tx = _build_account_tx(payload, sender_address=address)
            _submit_tx(tx)

            return True, account, "Profile updated successfully"

        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            return False, None, f"Update error: {str(e)}"

    @staticmethod
    def update_vault(address: str, vault: str) -> Tuple[bool, str]:
        """Update encrypted vault (on forgot password / recovery)"""
        address = address.lower()
        try:
            account = AccountRepository.get_account_by_address(address)
            if not account:
                return False, "Account not found"
            
            account.vault = vault
            success = AccountRepository.update_account(account)
            if success:
                return True, "Vault updated successfully"
            else:
                return False, "Failed to update vault in database"
        except Exception as e:
            logger.error(f"Error updating vault: {e}")
            return False, f"Update error: {str(e)}"
