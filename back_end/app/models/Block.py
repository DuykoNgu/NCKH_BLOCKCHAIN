import hashlib
import json
from typing import List
from ecdsa import SigningKey, SECP256k1, VerifyingKey

from models.BlockHeader import BlockHeader
from models.Transaction import Transaction

## TODO: CẦN PHÁT TRIỂN THÊM VÌ ĐÂY LÀ EM VIẾT THEO CORE DATABASE CỦA DỰ ÁN
##       Vì chưa viết gì về TRANSACTION NÊN KHI VIẾT tIẾP MỌI NGƯỜI CHÚ Ý PHẦN TRANSACTION TRONG TỪNG ĐOẠN THEO DTB NHÉ



class Block:
    def __init__(self, index: int, block_id: str, block_header: BlockHeader, transactions: List[Transaction]):
        self.block_id = block_id
        self.index = index
        self.block_header = block_header
        self.transactions = transactions
        self.block_hash: str = ""
        self.validator_signature: str = ""

