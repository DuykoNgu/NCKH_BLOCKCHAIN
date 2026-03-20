"""AccountService - Business logic layer for Account operations"""
from typing import Optional, List, Tuple
from app.repositories.AccountRepository import AccountRepository
from app.models.Account import Account, Role
from app.utils.CryptoUtils import CryptoUtils
from app.utils.logger import get_logger
import datetime

logger = get_logger(__name__)
class AccountService:
    """Service for Account business logic"""
    @staticmethod
    def register_account(address: str,public_key: str,role: Role = Role.CLIENT) -> Tuple[bool, Optional[Account], str]:
        address = address.lower()
        try:
            existing =  AccountRepository.get_account_by_address(address)
            if existing:
                return False, None, "Account already exists"
            
            now = datetime.datetime.now()
            account = Account(
                address= address,
                public_key= public_key,
                role = role,
                is_active=1,
                created_at=now.strftime("%d/%m/%Y %H:%M:%S")
            )

            success = AccountRepository.create_account(account)
            if success:
                return True, account, "Account registered successfully"
            else:
                return False, None, "Failed to save account to database"
            
        except Exception as e:
            return False, None,f"Regisration error:{str(e)}"
       
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
    def verify_user_signature(address: str, message: str, signature: str) -> Tuple[bool, str]:
        """Verify a message signed by account"""
        try:
            account = AccountRepository.get_account_by_address(address)
            if not account:
                return False, "account not found"
            
            # Verify signature
            is_valid = CryptoUtils.verify_signature(message, signature, account.public_key)
            if is_valid:
                return True, "Signature valid"
            else:
                return False, "Invalid signature"
        except Exception as e:
            return False, f"Verification error: {str(e)}"

    @staticmethod
    def update_profile(address: str, full_name: str = None, avatar_url: str = None) -> Tuple[bool, Optional[Account], str]:
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
                
            success = AccountRepository.update_account(account)
            if success:
                return True, account, "Profile updated successfully"
            else:
                return False, None, "Failed to update profile in database"
        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            return False, None, f"Update error: {str(e)}"
