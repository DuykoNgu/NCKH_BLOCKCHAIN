"""UserService - Business logic layer for User operations"""
from typing import Optional, List, Tuple
from app.models.User import User, UserRole
from app.repositories.UserRepository import UserRepository

from app.utils.CryptoUtils import CryptoUtils


class UserService:
    """Service for User business logic"""

    @staticmethod
    def register_user(user_id: str, password: str, role: UserRole = UserRole.CLIENT) -> Tuple[bool, Optional[User], str]:
        """
        Register new user with auto-generated keypair
        
        Returns: (success, user, message)
        """
        try:
            # Check if user already exists
            existing = UserRepository.get_user_by_id(user_id)
            if existing:
                return False, None, "User already exists"
            
            # Generate keypair
            public_key, private_key = CryptoUtils.generate_key_pair()
            address = CryptoUtils.get_address_from_pubkey(public_key)
            
            # Create user
            user = User(
                user_id=user_id,
                pubkey=public_key,
                address=address,
                role=role,
                password=password
            )
            
            # Save to database
            success = UserRepository.create_user(user)
            if success:
                return True, user, "User registered successfully"
            else:
                return False, None, "Failed to save user to database"
                
        except Exception as e:
            return False, None, f"Registration error: {str(e)}"

    @staticmethod
    def register_user_with_keys(user_id: str, private_key: str, password: str, 
                               role: UserRole = UserRole.CLIENT) -> Tuple[bool, Optional[User], str]:
        """
        Register user with provided private key
        
        Returns: (success, user, message)
        """
        try:
            # Check if user already exists
            existing = UserRepository.get_user_by_id(user_id)
            if existing:
                return False, None, "User already exists"
            
            # Validate and derive keys
            public_key = CryptoUtils.get_public_key_from_private(private_key)
            address = CryptoUtils.get_address_from_pubkey(public_key)
            
            # Create user
            user = User(
                user_id=user_id,
                pubkey=public_key,
                address=address,
                role=role,
                password=password
            )
            
            # Save to database
            success = UserRepository.create_user(user)
            if success:
                return True, user, "User registered successfully"
            else:
                return False, None, "Failed to save user to database"
                
        except Exception as e:
            return False, None, f"Registration error: {str(e)}"

    @staticmethod
    def authenticate_user(user_id: str, password: str) -> Tuple[bool, Optional[User], str]:
        """
        Authenticate user with user_id and password
        
        Returns: (success, user, message)
        """
        try:
            user = UserRepository.get_user_by_id(user_id)
            if not user:
                return False, None, "User not found"
            
            # Simple password check (in production, use hashed passwords)
            if user.password != password:
                return False, None, "Invalid password"
            
            return True, user, "Authentication successful"
        except Exception as e:
            return False, None, f"Authentication error: {str(e)}"

    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[User]:
        """Get user by user_id"""
        try:
            return UserRepository.get_user_by_id(user_id)
        except Exception as e:
            print(f"Error getting user: {e}")
            return None


    @staticmethod
    def get_user_by_address(address: str) -> Optional[User]:
        """Get user by address"""
        try:
            return UserRepository.get_user_by_address(address)
        except Exception as e:
            print(f"Error getting user by address: {e}")
            return None

    @staticmethod
    def get_all_users() -> List[User]:
        """Get all users"""
        try:
            return UserRepository.get_all_users()
        except Exception as e:
            print(f"Error getting all users: {e}")
            return []

    @staticmethod
    def update_user_role(user_id: str, new_role: UserRole) -> Tuple[bool, str]:
        """Update user role"""
        try:
            user = UserRepository.get_user_by_id(user_id)
            if not user:
                return False, "User not found"
            
            user.role = new_role
            success = UserRepository.update_user(user)
            if success:
                return True, "User role updated"
            else:
                return False, "Failed to update user"
        except Exception as e:
            return False, f"Error updating user: {str(e)}"

    @staticmethod
    def change_password(user_id: str, old_password: str, new_password: str) -> Tuple[bool, str]:
        """Change user password"""
        try:
            user = UserRepository.get_user_by_id(user_id)
            if not user:
                return False, "User not found"
            
            # Verify old password
            if user.password != old_password:
                return False, "Invalid old password"
            
            # Update password
            user.password = new_password
            success = UserRepository.update_user(user)
            if success:
                return True, "Password changed successfully"
            else:
                return False, "Failed to change password"
        except Exception as e:
            return False, f"Error changing password: {str(e)}"

    @staticmethod
    def delete_user(user_id: str) -> Tuple[bool, str]:
        """Delete user"""
        try:
            user = UserRepository.get_user_by_id(user_id)
            if not user:
                return False, "User not found"
            
            success = UserRepository.delete_user(user_id)
            if success:
                return True, "User deleted successfully"
            else:
                return False, "Failed to delete user"
        except Exception as e:
            return False, f"Error deleting user: {str(e)}"

    @staticmethod
    def verify_user_signature(user_id: str, message: str, signature: str) -> Tuple[bool, str]:
        """Verify a message signed by user"""
        try:
            user = UserRepository.get_user_by_id(user_id)
            if not user:
                return False, "User not found"
            
            # Verify signature
            is_valid = CryptoUtils.verify_signature(message, signature, user.pubkey)
            if is_valid:
                return True, "Signature valid"
            else:
                return False, "Invalid signature"
        except Exception as e:
            return False, f"Verification error: {str(e)}"
