"""UserService - Business logic layer for User operations"""
from typing import Optional, List, Tuple
from app.repositories.UserRepository import UserRepository
from back_end.app.models.Account import Account
from app.utils.CryptoUtils import CryptoUtils


class UserService:
    """Service for User business logic"""

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
        """Get all users"""
        try:
            return UserRepository.get_all_clients()
        except Exception as e:
            print(f"Error getting all users: {e}")
            return []


    @staticmethod
    def delete_account(address: str) -> Tuple[bool, str]:
        """Delete user"""
        try:
            user = UserRepository.get_account_by_address(address)
            if not user:
                return False, "User not found"
            
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
