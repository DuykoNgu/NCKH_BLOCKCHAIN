from app.utils.CryptoUtils import CryptoUtils
from app.utils.HashUtils import HashUtils
import json

# 1. Dữ liệu block
block_data = {
    "block_id": "BLOCK_001",
    "index": 1,
    "pre_hash": "0x0000000000000000000000000000000000000000",
    "merkle_root": "0x1234567890abcdef",
    "validator_pubkey": "abcd...",  # pubkey từ step 1
    "timestamp": 1702800000,
    "transactions": []
}

# 2. Tạo message để ký (giống get_signing_data trong BlockService)
message_dict = {
    "block": {
        "block_id": block_data["block_id"],
        "index": block_data["index"],
        "pre_hash": block_data["pre_hash"],
        "merkle_root": block_data["merkle_root"],
        "validator_pubkey": block_data["validator_pubkey"],
        "timestamp": block_data["timestamp"]
    },
    "transactions": []
}
message = json.dumps(message_dict, sort_keys=True).encode()

# 3. Ký message
private_key = "ef5678..."  # Từ step 1
signature = CryptoUtils.sign_data(message, private_key)
print(f"Signature: {signature}")  # ← Copy cái này