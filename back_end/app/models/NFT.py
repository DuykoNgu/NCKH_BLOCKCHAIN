from models.NFTmetadata import NFTmetadata
from models.User import User

from typing import Optional, Dict, Any
import hashlib
from datetime import datetime

class NFT:
     def __init__(self, issuer_pubkey: str, metadata: NFTmetadata,recipient_address:User):
          seed = f"{metadata.student_id}|{metadata.issued_at}|{recipient_address.address}"
          self.token_id = hashlib.sha256(seed.encode()).hexdigest()
          
          self.issuer_pubkey = issuer_pubkey
          self.metadata = metadata
          self.recipient_address = recipient_address
          self.issuer_signature: Optional[str] = None
          self.minted_at = datetime.utcnow().isoformat()
          self.is_valid = True
          self.revoked = None
 
     def to_dict(self) -> Dict[str, Any]:
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
     def from_dict(data: Dict[str,Any]):
          return NFT(**data)