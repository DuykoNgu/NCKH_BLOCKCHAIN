from typing import Dict, Any
from enum import Enum
from app.utils.Utils import CryptoUtils


class UserRole(Enum):
    ADMIN = "admin"
    CLIENT = "client"
    VALIDATOR = "validator"


class User:
    """Model User - Lưu thông tin người dùng"""

    def __init__(self, user_id: str, pubkey: str, address: str, role: UserRole, password: str):
        self.user_id = user_id
        self.pubkey = pubkey
        self.address = address
        self.role = role
        self.password = password

    def to_dict(self) -> Dict[str, str]:
        """Chuyển User thành dict"""
        return {
            "user_id": self.user_id,
            "pubkey": self.pubkey,
            "address": self.address,
            "role": self.role.value,
            "password": self.password
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "User":
        """Tạo User từ dict"""
        if isinstance(data.get('role'), str):
            data['role'] = UserRole(data['role'])
        return User(**data)

    @staticmethod
    def create_from_private_key(user_id: str, private_key_hex: str, role: UserRole, password: str) -> "User":
        """Tạo User từ private key - tự động generate public key và address"""
        pub = CryptoUtils.get_public_key_from_private(private_key_hex)
        addr = CryptoUtils.get_address_from_pubkey(pub)
        return User(user_id=user_id, pubkey=pub, address=addr, role=role, password=password)

