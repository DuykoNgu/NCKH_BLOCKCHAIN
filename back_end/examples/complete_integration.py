

from app.blockchain_instance import initialize_blockchain, get_blockchain_instance
from app.services.NetworkService import initialize_network, get_network_service
from consensus.validator_worker import start_validator_worker

SUPER_VALIDATOR_PUBKEY = "04a1b2c3d4e5f6..."

blockchain = initialize_blockchain(SUPER_VALIDATOR_PUBKEY)
print(f"✓ Blockchain initialized with {len(blockchain.chain)} blocks")

if initialize_network():
    print("✓ P2P network initialized successfully")
    network_service = get_network_service()
    
    stats = network_service.get_network_stats()
    print(f"  - Active peers: {stats['active_peers']}")
    print(f"  - Validators: {stats['validator_peers']}")
    print(f"  - Time synced: {stats['is_time_synced']}")
else:
    print("✗ Failed to initialize network")
    exit(1)



MY_VALIDATOR_INDEX = 0
TOTAL_VALIDATORS = 3
MY_PRIVATE_KEY = "your_private_key_hex"
MY_PUBLIC_KEY = "your_public_key_hex"

worker = start_validator_worker(
    my_validator_index=MY_VALIDATOR_INDEX,
    total_validators=TOTAL_VALIDATORS,
    private_key=MY_PRIVATE_KEY,
    public_key=MY_PUBLIC_KEY
)

print(f"✓ Validator worker started")
print(f"  - My index: {MY_VALIDATOR_INDEX}/{TOTAL_VALIDATORS}")
print(f"  - Slot duration: 5 seconds")



import requests
import json

nft_data = {
    "degree_type": "Bachelor of Computer Science",
    "pdf_url": "https://example.com/certificates/student123.pdf",
    "pdf_hash": "abc123def456...",
    "institution_address": "0x1234...",
    "recipient_address": "0x5678...",
    "signature": "signature_hex..."
}

response = requests.post(
    "http://localhost:5000/api/v1/nft/create",
    json=nft_data,
    headers={"Content-Type": "application/json"}
)

if response.status_code == 201:
    result = response.json()
    print(f"✓ NFT minted successfully!")
    print(f"  - Token ID: {result['token_id']}")
    print(f"  - TX Hash: {result['tx_hash']}")
    print(f"  - Transaction is now in mempool and propagating to peers")
else:
    print(f"✗ Failed to mint NFT: {response.json()}")



def monitor_blockchain():
    blockchain = get_blockchain_instance()
    network_service = get_network_service()
    
    print("\n" + "="*60)
    print("BLOCKCHAIN STATUS")
    print("="*60)
    
    print(f"Chain length: {len(blockchain.chain)} blocks")
    print(f"Mempool size: {len(blockchain.mempool)} transactions")
    print(f"Authority set: {len(blockchain.authority_set)} validators")
    
    if len(blockchain.chain) > 0:
        latest_block = blockchain.get_last_block()
        print(f"\nLatest block:")
        print(f"  - Index: {latest_block.index}")
        print(f"  - Hash: {latest_block.block_hash[:32]}...")
        print(f"  - Transactions: {len(latest_block.transactions)}")
        print(f"  - Validator: {latest_block.block_header.validator_pubkey[:16]}...")
    
    stats = network_service.get_network_stats()
    print(f"\nNetwork status:")
    print(f"  - Total peers: {stats['total_peers']}")
    print(f"  - Active peers: {stats['active_peers']}")
    print(f"  - Validators: {stats['validator_peers']}")
    print(f"  - NTP offset: {stats['ntp_offset']:.3f}s")
    
    slot_info = network_service.get_current_slot_info(TOTAL_VALIDATORS)
    print(f"\nConsensus status:")
    print(f"  - Current slot: {slot_info['current_slot']}")
    print(f"  - Leader index: {slot_info['leader_index']}")
    print(f"  - Time remaining: {slot_info['time_remaining_in_slot']:.2f}s")
    
    print("="*60 + "\n")

monitor_blockchain()



from app.repositories.BlockRepository import BlockRepository
from app.repositories.TransactionRepository import TransactionRepository
from app.repositories.NFTRepository import NFTRepository

all_blocks = BlockRepository.get_all_blocks()
print(f"Total blocks in database: {len(all_blocks)}")

all_transactions = TransactionRepository.get_all_transactions()
print(f"Total transactions in database: {len(all_transactions)}")

user_address = "0x5678..."
user_nfts = NFTRepository.get_nft_by_address(user_address)
print(f"User {user_address[:10]}... has {len(user_nfts)} NFTs")



import signal
import sys

def shutdown_handler(signum, frame):
    print("\n\n🛑 Shutting down...")
    
    from consensus.validator_worker import stop_validator_worker
    stop_validator_worker()
    
    print("✓ Validator worker stopped")
    print("✓ Shutdown complete")
    sys.exit(0)

signal.signal(signal.SIGINT, shutdown_handler)
signal.signal(signal.SIGTERM, shutdown_handler)

print("\n✓ System running. Press Ctrl+C to shutdown gracefully.")






def test_transaction_flow():
    print("\n" + "="*60)
    print("TESTING TRANSACTION FLOW")
    print("="*60)
    
    print("\n[1/5] Minting NFT...")
    
    print("\n[2/5] Waiting for transaction propagation...")
    import time
    time.sleep(2)
    
    print("\n[3/5] Checking mempool...")
    blockchain = get_blockchain_instance()
    print(f"  Mempool size: {len(blockchain.mempool)}")
    
    print("\n[4/5] Waiting for block to be mined...")
    time.sleep(15)
    
    print("\n[5/5] Verifying block creation...")
    latest_block = blockchain.get_last_block()
    print(f"  Latest block index: {latest_block.index}")
    print(f"  Transactions in block: {len(latest_block.transactions)}")
    print(f"  Mempool size: {len(blockchain.mempool)}")
    
    if len(blockchain.mempool) == 0:
        print("\n✓ Transaction flow test PASSED!")
    else:
        print("\n⚠ Transaction flow test INCOMPLETE")
    
    print("="*60 + "\n")




def verify_block_propagation():
    import requests
    
    nodes = [
        "http://localhost:5000",
        "http://localhost:5001",
        "http://localhost:5002"
    ]
    
    print("\n" + "="*60)
    print("VERIFYING BLOCK PROPAGATION")
    print("="*60)
    
    for node_url in nodes:
        try:
            response = requests.get(f"{node_url}/api/v1/blockchain/blocks/latest")
            if response.status_code == 200:
                block = response.json()
                print(f"\n{node_url}:")
                print(f"  Latest block: {block['index']}")
                print(f"  Block hash: {block['block_hash'][:32]}...")
            else:
                print(f"\n{node_url}: ✗ Failed to get block")
        except Exception as e:
            print(f"\n{node_url}: ✗ Connection failed - {e}")
    
    print("\n" + "="*60 + "\n")

