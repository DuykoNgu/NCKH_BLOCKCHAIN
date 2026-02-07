from typing import Dict, Any
from enum import Enum

class Role(Enum):
     MOET = "moet"
     VALIDATOR = "validator"
     CLIENT = "client"

class Account:
     def __init__(self, public_key: str, address: str, role: Role, org_name: str = None, is_active: int = 1, created_at: str = None):
          self.public_key = public_key
          self.address = address
          self.role = role
          self.org_name = org_name
          self.is_active = is_active
          self.created_at = created_at

     def to_dict(self) -> Dict[str, str]:
          return {
               "public_key": self.public_key,
               "address": self.address,
               "role": self.role,
               "org_name": self.org_name,
               "is_active": self.is_active,
               "created_at": self.created_at
          }
     @staticmethod
     def from_dict(data: Dict[str,Any]):
          return Account(**data)
     