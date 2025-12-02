from typing import Dict, Any
from enum import Enum 

class UserRole(Enum):
     ADMIN = "admin"
     CLIENT = "client"
     VALIDATOR = "validator"
     
class User:
     def __init__(self, pubkey: str, address: str, user_id: str, role: UserRole, password: str):
          self.user_id = user_id
          self.pubkey = pubkey
          self.address = address
          self.role = role
          self.password = password

     def to_dict(self) -> Dict[str, str]:
          return {
               "pubkey": self.pubkey,
               "address": self.address,
               "user_id": self.user_id,
               "role": self.role.value,
               "password": self.password
          }
     @staticmethod
     def from_dict(data: Dict[str,Any]):
          # Convert role from string to UserRole enum if needed
          if isinstance(data.get('role'), str):
               data['role'] = UserRole(data['role'])
          return User(**data)

