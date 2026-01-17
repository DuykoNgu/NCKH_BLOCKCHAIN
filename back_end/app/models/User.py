from enum import Enum

class UserRole(Enum):
    ADMIN = "0"
    CLIENT = "1"
class User:
    def __init__(self, user_id: str, pubkey: str, address: str, role: UserRole, password: str):
        self.user_id = user_id
        self.pubkey = pubkey
        self.address = address
        self.role = role
        self.password = password


