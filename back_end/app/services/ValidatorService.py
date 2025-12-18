"""ValidatorService - Business logic for Validator operations"""
from typing import List, Tuple
from app.models.User import User, UserRole
from app.repositories.UserRepository import UserRepository


class ValidatorService:
    """Service for Validator business logic (POA - Proof of Authority)"""
    
    @staticmethod
    def is_validator(user_id: str) -> bool:
        """
        Kiểm tra user có phải validator được phép không.
        
        Args:
            user_id: ID của user cần kiểm tra
            
        Returns:
            True nếu user có role VALIDATOR, False nếu không
        """
        try:
            user = UserRepository.get_user_by_id(user_id)
            if not user:
                return False
            
            return user.role == UserRole.VALIDATOR
        except Exception as e:
            print(f"Error checking validator: {e}")
            return False
    
    @staticmethod
    def get_all_validators() -> List[User]:
        """
        Lấy tất cả validators trong hệ thống.
        
        Returns:
            List of User objects với role VALIDATOR
        """
        try:
            return UserRepository.get_users_by_role(UserRole.VALIDATOR)
        except Exception as e:
            print(f"Error getting validators: {e}")
            return []
    
    @staticmethod
    def get_validator_count() -> int:
        """Lấy số lượng validator trong hệ thống"""
        try:
            validators = ValidatorService.get_all_validators()
            return len(validators)
        except Exception as e:
            print(f"Error counting validators: {e}")
            return 0
    
    @staticmethod
    def get_validator_pubkeys() -> List[str]:
        """
        Lấy danh sách public keys của tất cả validators.
        Dùng cho verification.
        
        Returns:
            List of public key hex strings
        """
        try:
            validators = ValidatorService.get_all_validators()
            return [v.pubkey for v in validators]
        except Exception as e:
            print(f"Error getting validator pubkeys: {e}")
            return []
