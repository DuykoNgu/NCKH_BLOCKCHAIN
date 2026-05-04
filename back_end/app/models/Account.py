from typing import Dict, Any
from enum import Enum

class Role(Enum):
     MOET = "moet"
     VALIDATOR = "validator"
     CLIENT = "client"

class Account:
     def __init__(self, public_key: str, address: str, role: Role, org_name: str = None, 
                  full_name: str = None, avatar_url: str = None,
                  tax_id: str = None, representative: str = None, email: str = None, phone: str = None,
                  is_active: int = 1, created_at: str = None):
          self.public_key = public_key
          self.address = address
          self.role = role
          self.org_name = org_name
          self.full_name = full_name
          self.avatar_url = avatar_url
          self.tax_id = tax_id
          self.representative = representative
          self.email = email
          self.phone = phone
          self.is_active = is_active
          self.created_at = created_at

     def to_dict(self) -> Dict[str, str]:
          return {
               "public_key": self.public_key,
               "address": self.address,
               "role": self.role.value if hasattr(self.role, 'value') else str(self.role),
               "org_name": self.org_name,
               "full_name": self.full_name,
               "avatar_url": self.avatar_url,
               "tax_id": self.tax_id,
               "representative": self.representative,
               "email": self.email,
               "phone": self.phone,
               "is_active": self.is_active,
               "created_at": self.created_at
          }
     @staticmethod
     def from_dict(data: Dict[str,Any]):
          return Account(**data)
     