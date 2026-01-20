from app.models.NFTmetadata import NFTmetadata


from app.utils.HashUtils import HashUtils

from typing import Optional, Dict, Any
from datetime import datetime
from app.models.Account import Account
class NFT:
    """Model NFT - Token không fungible"""

    def __init__(self, issuer_address: str,metadata: NFTmetadata, owner_address: Account):
        # Sinh token_id từ metadata
        seed = f"{metadata.student_id}|{metadata.issued_at}|{owner_address.address}"
        self.token_id = HashUtils.hash_sha256(seed)
        self.issuer_address = issuer_address
        self.metadata = metadata
        self.owner_address = owner_address
        self.issuer_signature: Optional[str] = None
        self.minted_at = datetime.utcnow().isoformat()
        self.is_valid = True
        self.status = None

    def to_dict(self) -> Dict[str, Any]:
        """Chuyển NFT thành dict"""
        return {
            "token_id": self.token_id,
            "issuer_address": self.issuer_address,
            "metadata": self.metadata.to_dict(),
            "owner_address": self.owner_address.to_dict(),
            "issuer_signature": self.issuer_signature,
            "is_valid": self.is_valid,
            "minted_at": self.minted_at,
            "status": self.status
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "NFT":
        """Tạo NFT từ dict"""
        return NFT(**data)