from typing import Set, Dict, Any

from models.NFT import NFT

class SmartContract:
     def __init__(self, owner_pubkey:str):
          self.owner_pubkey = owner_pubkey
          self.total_supply = 0
          self.token_balances: Dict[str, int] = {}  # Dict[str, int] mapping address to balance
          self.token_registry: Dict[str, NFT] = {}  # Dict[str, str] mapping token_id to owner address
          self.revoked_tokens: Set[str] = set()  # Set of revoked token IDs
          
     def to_dict(self) -> Dict[str, Any]:
          return {
               "owner_pubkey": self.owner_pubkey,
               "total_supply": self.total_supply,
               "token_balances": self.token_balances,
               "token_registry": {tid:nft.to_dict() for tid, nft in self.token_registry.items()},
               "revoked_tokens": list(self.revoked_tokens)
          }