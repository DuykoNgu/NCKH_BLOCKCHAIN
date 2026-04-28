from app.models.NFTmetadata import NFTmetadata


from app.utils.HashUtils import HashUtils

from typing import Optional, Dict, Any
import datetime
from app.models.Account import Account
class NFT:
    """Model NFT - Token không fungible"""

    def __init__(self, issuer_address: str, issuer_pubkey: str, metadata: NFTmetadata, owner_address: Account,issuer_signature: Optional[str] = None):
        # Gán metadata TRƯỚC khi sử dụng
        self.metadata = metadata
        self.issuer_address = issuer_address
        self.issuer_pubkey = issuer_pubkey
        self.owner_address = owner_address
        self.issuer_signature = issuer_signature
        
        # Sinh token_id từ metadata (sau khi đã gán)
        seed = f"{self.metadata.get_signing_data()}|{owner_address.address}"
        self.token_id = HashUtils.hash_sha256(seed)
        self.minted_at = datetime.datetime.utcnow().timestamp()
        self.is_valid = True


    def to_dict(self) -> Dict[str, Any]:
        """Chuyển NFT thành dict"""
        return {
            "token_id": self.token_id,
            "issuer_address": self.issuer_address,
            "issuer_pubkey": self.issuer_pubkey,
            "metadata": self.metadata.to_dict(),
            # Dữ liệu phẳng cho FE
            "recipient_address": self.owner_address.address if hasattr(self.owner_address, 'address') else self.owner_address,
            "recipient_name": getattr(self.owner_address, 'full_name', 'Unknown') if hasattr(self.owner_address, 'full_name') else "Unknown",
            "issuer_signature": self.issuer_signature,
            "is_valid": self.is_valid,
            "minted_at": self.minted_at,
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "NFT":
        """Tạo NFT từ dict"""
        return NFT(**data)