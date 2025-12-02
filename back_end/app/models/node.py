
from enum import Enum


class NodeRole(Enum):
     MOET = "MOET"
     VALIDATOR = "VALIDATOR"
     OBSERVER = "OBSERVER"

class Node:
     def __init__(self,validator_private_key:str, pubkey: str,node_role: NodeRole):
          self.validator_private_key = validator_private_key
          self.pubkey = pubkey # Đây là public key của node
          self.node_role = node_role
          