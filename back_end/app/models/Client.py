from typing import Dict, Any

class client:
     def __init__(self, pubkey: str, address: str, client_id: str):
          self.pubkey = pubkey
          self.address = address
          self.client_id = client_id
     
     def to_dict(self) -> Dict[str, str]:
          return {
               "pubkey": self.pubkey,
               "address": self.address,
               "client_id": self.client_id
          }
     @staticmethod
     def from_dict(data: Dict[str,Any]):
          return client(**data)
     