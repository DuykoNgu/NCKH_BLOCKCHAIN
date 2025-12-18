"""UserService - Business logic layer for User operations"""
from typing import Optional, List, Tuple, Dict, Any
import bcrypt
from app.models.User import User, UserRole
from app.repositories.UserRepository import UserRepository

from app.utils.CryptoUtils import CryptoUtils
from app.utils.KeyUtils import KeyUtils


class UserService:
    """Service for User business logic"""

    # =========================================================================
    # HELPER METHODS - Serialize User object
    # =========================================================================
    
    @staticmethod
    def to_dict(user: User, level: str = 'standard') -> Dict[str, Any]:
        """
        Chuyển User object thành dictionary với các level khác nhau.
        
        Args:
            user: User object
            level: Mức độ chi tiết
                - 'summary': user_id, address
                - 'standard': + pubkey, role
                - 'full': + created_at (nếu có)
        """
        result = {
            "user_id": user.user_id,
            "address": user.address
        }
        
        if level == 'summary':
            return result
        
        result.update({
            "pubkey": user.pubkey,
            "role": user.role.value
        })
        
        if level == 'standard':
            return result
        
        # Full - thêm các thông tin bổ sung nếu có
        if hasattr(user, 'created_at') and user.created_at:
            result["created_at"] = user.created_at
        
        return result
    
    @staticmethod
    def success_response(user: User, message: str = None, level: str = 'standard') -> Dict[str, Any]:
        """Tạo response dictionary chuẩn cho API."""
        response = {
            "success": True,
            "user": UserService.to_dict(user, level)
        }
        if message:
            response["message"] = message
        return response

    @staticmethod
    def register_user(user_id: str, password: str, role: UserRole = UserRole.CLIENT) -> Tuple[bool, Optional[User], str, Optional[str]]:
        """
        Register new user with auto-generated keypair
        
        Returns: (success, user, message, private_key)
        - private_key chỉ trả về 1 LẦN DUY NHẤT khi register
        - Client PHẢI lưu lại private_key này
        - Server KHÔNG lưu private_key
        """
        try:
            # Check if user already exists
            existing = UserRepository.get_user_by_id(user_id)
            if existing:
                return False, None, "User already exists", None
            
            # Generate keypair
            public_key, private_key = KeyUtils.generate_key_pair()
            address = KeyUtils.get_address_from_pubkey(public_key)
            
            # Hash password with bcrypt
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Create user (KHÔNG lưu private_key vào DB)
            user = User(
                user_id=user_id,
                pubkey=public_key,
                address=address,
                role=role,
                password=password_hash
            )
            
            # Save to database
            success = UserRepository.create_user(user)
            if success:
                # Trả về private_key cho client (chỉ lần này!)
                return True, user, "User registered successfully", private_key
            else:
                return False, None, "Failed to save user to database", None
                
        except Exception as e:
            return False, None, f"Registration error: {str(e)}", None

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
            
            # Verify password with bcrypt
            if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
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
            
            # Verify old password with bcrypt
            if not bcrypt.checkpw(old_password.encode('utf-8'), user.password.encode('utf-8')):
                return False, "Invalid old password"
            
            # Hash new password and update
            user.password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
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
