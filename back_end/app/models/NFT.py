from models.NFTmetadata import NFTmetadata
from models.Client import client

from typing import Optional, Dict, Any
import hashlib


class NFT:
     def __init__(self, isssuer_pubkey: str, metadata: NFTmetadata,recipient_address:client):
          seed = f"{self.isssuer_pubkey}{metadata.student_id}|{metadata.issued_at}|{recipient_address.address}"
          self.token_id = hashlib.sha256(seed.encode()).hexdigest()
          
          self.isssuer_pubkey = isssuer_pubkey
          self.metadata = metadata
          self.recipient_address = recipient_address
          self.issuer_signature: Optional[str] = None
          self.is_valid = True
          self.revoked = None
          self.minted_at = None