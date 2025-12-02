from app.models.NFTmetadata import NFTmetadata
from app.models.User import User
from app.utils.Utils import CryptoUtils

from typing import Optional, Dict, Any
from datetime import datetime


class NFT:
    """Model NFT - Token không fungible"""

    def __init__(self, issuer_pubkey: str, metadata: NFTmetadata, recipient_address: User):
        # Sinh token_id từ metadata
        seed = f"{metadata.student_id}|{metadata.issued_at}|{recipient_address.address}"
        self.token_id = CryptoUtils.hash_sha256(seed)
        
        self.issuer_pubkey = issuer_pubkey
        self.metadata = metadata
        self.recipient_address = recipient_address
        self.issuer_signature: Optional[str] = None
        self.minted_at = datetime.utcnow().isoformat()
        self.is_valid = True
        self.revoked = None

    def to_dict(self) -> Dict[str, Any]:
        """Chuyển NFT thành dict"""
        return {
            "token_id": self.token_id,
            "issuer_pubkey": self.issuer_pubkey,
            "metadata": self.metadata.to_dict(),
            "recipient_address": self.recipient_address.to_dict(),
            "issuer_signature": self.issuer_signature,
            "is_valid": self.is_valid,
            "minted_at": self.minted_at,
            "revoked": self.revoked
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "NFT":
        """Tạo NFT từ dict"""
        return NFT(**data)

    def sign_nft(self, private_key_hex: str) -> str:
        """Ký NFT bằng private key của issuer"""
        nft_data = {
            "token_id": self.token_id,
            "metadata": self.metadata.to_dict(),
            "recipient_address": self.recipient_address.address
        }
        self.issuer_signature = CryptoUtils.sign_data(nft_data, private_key_hex)
        return self.issuer_signature

    def verify_nft(self) -> bool:
        """Verify NFT signature"""
        if not self.issuer_signature:
            return False
        
        nft_data = {
            "token_id": self.token_id,
            "metadata": self.metadata.to_dict(),
            "recipient_address": self.recipient_address.address
        }
        return CryptoUtils.verify_signature(nft_data, self.issuer_signature, self.issuer_pubkey)