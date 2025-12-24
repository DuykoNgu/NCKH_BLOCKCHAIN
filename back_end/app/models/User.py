from enum import Enum
from typing import Optional

class UserRole(Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class User:
    def __init__(self, user_id: str, pubkey: str, address: str, role: UserRole, password: Optional[str] = None):
        self.user_id = user_id
        self.pubkey = pubkey
        self.address = address
        self.role = role
        self.password = password