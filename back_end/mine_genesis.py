import sys
import os

# Add back_end directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from app.blockchain_instance import get_blockchain_instance
from app.services.BlockChainService import BlockChainService
from app.repositories.BlockRepository import BlockRepository

def mine_genesis():
    print("Initializing Blockchain and Mining Genesis Block...")
    blockchain = get_blockchain_instance()
    
    # Simple check for existing blocks
    if BlockRepository.count_blocks() > 0:
        print(f"Database already has {BlockRepository.count_blocks()} blocks. Skipping.")
        return

    # Use a dummy pubkey for genesis if none provided
    genesis_pubkey = "0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
    
    print("Creating genesis block...")
    genesis_block = BlockChainService.create_genesis_block(blockchain, genesis_pubkey)
    
    # Sign it with a dummy private key (or just set hash manually if it's genesis)
    # For simplicity, we just set a hash
    genesis_block.block_hash = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
    
    print(f"Saving genesis block to DB...")
    success = BlockRepository.create_block(genesis_block)
    
    if success:
        print("[OK] Genesis block saved successfully!")
    else:
        print("[FAIL] Failed to save genesis block.")

if __name__ == "__main__":
    mine_genesis()
