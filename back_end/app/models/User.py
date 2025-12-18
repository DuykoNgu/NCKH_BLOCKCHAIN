from typing import Dict, Any
from enum import Enum


class UserRole(Enum):
    ADMIN = "admin"
    CLIENT = "client"
    VALIDATOR = "validator"

class User:
    """Model User - Lưu thông tin người dùng (chỉ chứa data, không chứa logic)"""

    def __init__(self, user_id: str, pubkey: str, address: str, role: UserRole, password: str):
        self.user_id = user_id
        self.pubkey = pubkey
        self.address = address
        self.role = role
        self.password = password

    def to_dict(self) -> Dict[str, str]:
        """Chuyển User thành dict - KHÔNG bao gồm password để bảo mật"""
        return {
            "user_id": self.user_id,
            "pubkey": self.pubkey,
            "address": self.address,
            "role": self.role.value
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "User":
        """Tạo User từ dict"""
        if isinstance(data.get('role'), str):
            data['role'] = UserRole(data['role'])
        return User(**data)

