"""
Account Model - Web3 + Backend API pattern

Nguyên tắc:
- address = identity duy nhất, KHÔNG cần public_key trong DB
- public_key được recover từ signature khi cần
- role lưu backend vì là business logic
- profile_tx_hash = anchor đến on-chain data (source of truth)
"""
from typing import Dict, Any, Optional
from enum import Enum


class Role(Enum):
    MOET = "moet"        # Bộ GD - cấp phép, approve
    VALIDATOR = "validator"  # Node xác thực block
    CLIENT = "client"     # Sinh viên / người nhận bằng


class Account:
    def __init__(
        self,
        address: str,
        role: Role,
        org_name: str = None,
        full_name: str = None,
        avatar_url: str = None,
        profile_tx_hash: str = None,   # ← hash của tx UPDATE_PROFILE on-chain
        is_active: int = 1,
        created_at: str = None,
        # public_key vẫn giữ optional — chỉ dùng khi cần verify off-chain nhanh
        # KHÔNG dùng làm identity, KHÔNG bắt buộc khi register
        public_key: str = None,
    ):
        self.address = address.lower()
        self.role = role
        self.org_name = org_name
        self.full_name = full_name
        self.avatar_url = avatar_url
        self.profile_tx_hash = profile_tx_hash
        self.is_active = is_active
        self.created_at = created_at
        self.public_key = public_key  # optional cache

    def to_dict(self) -> Dict[str, Any]:
        return {
            "address": self.address,
            "role": self.role.value if hasattr(self.role, 'value') else str(self.role),
            "org_name": self.org_name,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "profile_tx_hash": self.profile_tx_hash,  # client dùng để fetch on-chain
            "is_active": self.is_active,
            "created_at": self.created_at,
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "Account":
        role_val = data.get("role", "client")
        try:
            role = Role(role_val)
        except ValueError:
            role = Role.CLIENT
        return Account(
            address=data.get("address", ""),
            role=role,
            org_name=data.get("org_name"),
            full_name=data.get("full_name"),
            avatar_url=data.get("avatar_url"),
            profile_tx_hash=data.get("profile_tx_hash"),
            is_active=data.get("is_active", 1),
            created_at=data.get("created_at"),
            public_key=data.get("public_key"),
        )
