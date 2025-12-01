import time

class BlockHeader:
    def __init__(self, index: int, pre_hash: str,merkle_root: str, validator_pubkey: str, timestamp: float = None, none: float = None):
        self.index = index
        self.pre_hash = pre_hash
        self.merkle_root = merkle_root
        self.validator_pubkey = validator_pubkey
        self.timestamp = timestamp or time.time()
        self.none = none

    def __repr__(self):
        return f"<BlockHeader index={self.index}"
    