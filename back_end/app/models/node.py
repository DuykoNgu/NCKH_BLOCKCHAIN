from enum import Enum
from typing import Dict, Any
from app.utils.Utils import CryptoUtils


class NodeRole(Enum):
    """Vai trò của node trong mạng"""
    MOET = "moet" 
    VALIDATOR = "validator"  # Validator node
    OBSERVER = "observer"  # Observer node


class Node:
    """Model Node - Nút trong mạng blockchain"""

    def __init__(self, node_role: NodeRole, private_key_hex: str = None):
        """
        Tạo Node
        
        Args:
            node_role: Vai trò của node
            private_key_hex: Private key (optional, nếu là VALIDATOR)
        """
        self.node_role = node_role
        self.validator_private_key = private_key_hex
        
        # Sinh public key từ private key hoặc generate mới
        if private_key_hex:
            self.pubkey = CryptoUtils.get_public_key_from_private(private_key_hex)
        else:
            self.pubkey, self.validator_private_key = CryptoUtils.generate_key_pair()
        
        # Tạo address từ public key
        self.address = CryptoUtils.get_address_from_pubkey(self.pubkey)

    def to_dict(self) -> Dict[str, Any]:
        """Chuyển Node thành dict (không bao gồm private key)"""
        return {
            "node_role": self.node_role.value,
            "pubkey": self.pubkey,
            "address": self.address
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "Node":
        """Tạo Node từ dict"""
        role = NodeRole(data['node_role'])
        return Node(node_role=role)

    def sign_data(self, data: Any) -> str:
        """Ký dữ liệu"""
        if not self.validator_private_key:
            raise ValueError("Node không có private key")
        return CryptoUtils.sign_data(data, self.validator_private_key)

    def verify_data(self, data: Any, signature: str) -> bool:
        """Verify dữ liệu được ký bởi node này"""
        return CryptoUtils.verify_signature(data, signature, self.pubkey)
          