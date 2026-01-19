from typing import Set, Dict, Any, List
from datetime import datetime
import uuid

from app.models.NFT import NFT


class SmartContract:
    """Model SmartContract - Quản lý state của NFT Contract"""
    
    def __init__(self, owner_pubkey: str, contract_id: str = None):
        self.contract_id = contract_id or self._generate_contract_id()
        self.owner_pubkey = owner_pubkey
        self.total_supply = 0
        self.token_balances: Dict[str, int] = {}  # address -> số lượng tokens
        self.token_registry: Dict[str, NFT] = {}  # token_id -> NFT object
        self.revoked_tokens: Set[str] = set()  # Set of revoked token IDs
        self.authorized_minters: Set[str] = {owner_pubkey}  # Danh sách được phép mint
        self.transfer_history: List[Dict[str, Any]] = []  # Lịch sử chuyển nhượng
        self.created_at = datetime.utcnow().isoformat()
    
    def _generate_contract_id(self) -> str:
        """Sinh contract ID unique"""
        return f"SC-{uuid.uuid4().hex[:16]}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize SmartContract thành dict"""
        return {
            "contract_id": self.contract_id,
            "owner_pubkey": self.owner_pubkey,
            "total_supply": self.total_supply,
            "token_balances": self.token_balances,
            "token_registry": {tid: nft.to_dict() for tid, nft in self.token_registry.items()},
            "revoked_tokens": list(self.revoked_tokens),
            "authorized_minters": list(self.authorized_minters),
            "transfer_history": self.transfer_history,
            "created_at": self.created_at
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "SmartContract":
        """Deserialize SmartContract từ dict"""
        contract = SmartContract(
            owner_pubkey=data["owner_pubkey"],
            contract_id=data.get("contract_id")
        )
        contract.total_supply = data.get("total_supply", 0)
        contract.token_balances = data.get("token_balances", {})
        contract.revoked_tokens = set(data.get("revoked_tokens", []))
        contract.authorized_minters = set(data.get("authorized_minters", [contract.owner_pubkey]))
        contract.transfer_history = data.get("transfer_history", [])
        contract.created_at = data.get("created_at", datetime.utcnow().isoformat())
        
        # Khôi phục token registry
        for tid, nft_data in data.get("token_registry", {}).items():
            # TODO: Implement NFT.from_dict() nếu chưa có
            # contract.token_registry[tid] = NFT.from_dict(nft_data)
            pass
        
        return contract