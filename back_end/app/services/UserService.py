"""UserService - Business logic layer for User operations"""
from typing import Optional, List, Tuple
from app.repositories.UserRepository import UserRepository
from back_end.app.models.Account import Account
from app.utils.CryptoUtils import CryptoUtils
from app.models.Account import Account, Role
import datetime
class UserService:
    """Service for User business logic"""
    @staticmethod
    def register_account(address: str,public_key: str,role: Role = Role.CLIENT) -> Tuple[bool, Optional[Account], str]:
        try:
            existing = UserRepository.get_account_by_address(address)
            if existing:
                return False, None, "User already exits"
            
            now = datetime.now()
            account = Account(
                address= address,
                public_key= public_key,
                role = role,
                is_active=1,
                created_at=now.strftime("%d/%m/%Y %H:%M:%S")
            )

            success = UserRepository.create_account(account)
            if success:
                return True, account, "User registered successfully"
            else:
                return False, None, "Failed to save user to database"
            
        except Exception as e:
            return False, None,f"Regisration error:{str(e)}"
       
    @staticmethod
    def get_account_by_address(address: str) -> Optional[Account]:
        """Get user by address"""
        try:
            return UserRepository.get_account_by_address(address)
        except Exception as e:
            print(f"Error getting user by address: {e}")
            return None

    @staticmethod
    def get_all_account() -> List[Account]:
        """Get all accounts"""
        try:
            return UserRepository.get_all_accounts()
        except Exception as e:
            print(f"Error getting all account: {e}")
            return []


    @staticmethod
    def delete_account(address: str) -> Tuple[bool, str]:
        """Delete user"""
        try:
            user = UserRepository.get_account_by_address(address)
            if not user:
                return False, "Account not found"
            
            success = UserRepository.delete_account(address)
            if success:
                return True, "User deleted successfully"
            else:
                return False, "Failed to delete user"
        except Exception as e:
            return False, f"Error deleting user: {str(e)}"

    @staticmethod
    def verify_user_signature(address: str, message: str, signature: str) -> Tuple[bool, str]:
        """Verify a message signed by user"""
        try:
            user = UserRepository.get_account_by_address(address)
            if not user:
                return False, "User not found"
            
            # Verify signature
            is_valid = CryptoUtils.verify_signature(message, signature, user.public_key)
            if is_valid:
                return True, "Signature valid"
            else:
                return False, "Invalid signature"
        except Exception as e:
            return False, f"Verification error: {str(e)}"
