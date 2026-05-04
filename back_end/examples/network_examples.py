"""
Example: How to use the P2P Network in EduChain
Demonstrates network initialization, peer discovery, and consensus
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import time
from app.services.NetworkService import NetworkService


def example_1_initialize_network():
    """Example 1: Initialize network and connect to peers"""
    print("\n" + "="*60)
    print("EXAMPLE 1: Network Initialization")
    print("="*60)
    
    # Create network service
    service = NetworkService()
    
    # Initialize (connects to seed nodes, syncs time, etc.)
    if service.initialize():
        print("\n✅ Network initialized successfully!")
        
        # Get network statistics
        stats = service.get_network_stats()
        print(f"\n📊 Network Statistics:")
        print(f"   Total peers: {stats['total_peers']}")
        print(f"   Active peers: {stats['active_peers']}")
        print(f"   Validators: {stats['validator_peers']}")
        print(f"   Observers: {stats['observer_peers']}")
        print(f"   Time synced: {stats['is_time_synced']}")
        print(f"   NTP offset: {stats['ntp_offset']:.3f}s")
    else:
        print("\n❌ Network initialization failed")


def example_2_peer_discovery():
    """Example 2: Discover and manage peers"""
    print("\n" + "="*60)
    print("EXAMPLE 2: Peer Discovery")
    print("="*60)
    
    service = NetworkService()
    
    # Get current peer list
    peers = service.get_peer_list()
    print(f"\n📋 Current peers: {len(peers)}")
    
    for peer in peers[:5]:  # Show first 5
        print(f"   - {peer['ip_address']}:{peer['port']} ({peer['node_type']})")
    
    # Register a new peer
    print("\n➕ Registering new peer...")
    new_peer = service.register_peer(
        ip_address="10.0.1.200",
        port=5000,
        public_key="04test_key_example",
        node_type="observer"
    )
    
    if new_peer:
        print(f"✅ Peer registered: {new_peer['peer_id']}")
    else:
        print("❌ Peer registration failed (not in whitelist?)")


def example_3_gossip_transaction():
    """Example 3: Broadcast transaction via gossip"""
    print("\n" + "="*60)
    print("EXAMPLE 3: Transaction Gossip")
    print("="*60)
    
    service = NetworkService()
    
    # Create a sample transaction
    transaction = {
        'tx_hash': 'abc123def456',
        'sender_address': 'addr_university_A',
        'recipient_address': 'addr_student_123',
        'payload': {
            'type': 'mint_degree',
            'nft_id': 'nft_001',
            'degree_type': 'Bachelor of Science'
        },
        'timestamp': time.time()
    }
    
    print(f"\n📤 Broadcasting transaction: {transaction['tx_hash']}")
    
    # Broadcast to network
    peers_notified = service.broadcast_transaction(transaction)
    
    print(f"✅ Transaction gossiped to {peers_notified} peers")


def example_4_gossip_block():
    """Example 4: Broadcast block via gossip with INV"""
    print("\n" + "="*60)
    print("EXAMPLE 4: Block Gossip with INV")
    print("="*60)
    
    service = NetworkService()
    
    # Create a sample block
    block = {
        'block_hash': 'block_hash_xyz789',
        'index': 105,
        'previous_hash': 'prev_hash_abc123',
        'timestamp': time.time(),
        'transactions': [],
        'validator_signature': 'sig_validator_1'
    }
    
    print(f"\n📤 Broadcasting block #{block['index']}")
    print(f"   Hash: {block['block_hash']}")
    
    # Broadcast using INV messages (efficient)
    peers_notified = service.broadcast_block(block, use_inv=True)
    
    print(f"✅ Block INV sent to {peers_notified} peers")


def example_5_consensus_timing():
    """Example 5: Slot-based consensus timing"""
    print("\n" + "="*60)
    print("EXAMPLE 5: Consensus Timing (PoA)")
    print("="*60)
    
    service = NetworkService()
    
    # Assume we have 3 validators
    total_validators = 3
    my_validator_index = 1  # I am validator #1
    
    # Get current slot info
    slot_info = service.get_current_slot_info(total_validators)
    
    print(f"\n⏰ Current Slot Information:")
    print(f"   Slot number: {slot_info['current_slot']}")
    print(f"   Leader: Validator #{slot_info['leader_index']}")
    print(f"   Slot duration: {slot_info['slot_duration']}s")
    print(f"   Time remaining: {slot_info['time_remaining_in_slot']:.2f}s")
    
    # Check if it's my turn
    is_my_turn = service.is_my_turn(my_validator_index, total_validators)
    
    if is_my_turn:
        print(f"\n🟢 It's MY turn! (Validator #{my_validator_index})")
        print("   -> I should create a block now")
    else:
        print(f"\n⏳ Not my turn yet (I am Validator #{my_validator_index})")
        print(f"   -> Current leader is Validator #{slot_info['leader_index']}")


def example_6_validator_rotation():
    """Example 6: Demonstrate validator rotation"""
    print("\n" + "="*60)
    print("EXAMPLE 6: Validator Rotation Demo")
    print("="*60)
    
    service = NetworkService()
    total_validators = 3
    
    print(f"\n🔄 Watching validator rotation (3 validators, 5s slots)...")
    print("   Press Ctrl+C to stop\n")
    
    try:
        for i in range(6):  # Watch 6 slots (30 seconds)
            slot_info = service.get_current_slot_info(total_validators)
            
            print(f"Slot #{slot_info['current_slot']}: ", end="")
            print(f"Leader = Validator #{slot_info['leader_index']}, ", end="")
            print(f"Time left = {slot_info['time_remaining_in_slot']:.1f}s")
            
            # Show which validator should act
            for v_idx in range(total_validators):
                if v_idx == slot_info['leader_index']:
                    print(f"   Validator #{v_idx}: 🟢 CREATING BLOCK")
                else:
                    print(f"   Validator #{v_idx}: ⚪ Waiting")
            
            print()
            
            # Wait for next slot
            if i < 5:
                time.sleep(slot_info['time_remaining_in_slot'] + 0.5)
    
    except KeyboardInterrupt:
        print("\n\n⏹ Stopped watching")


def example_7_health_monitoring():
    """Example 7: Network health monitoring"""
    print("\n" + "="*60)
    print("EXAMPLE 7: Network Health Monitoring")
    print("="*60)
    
    service = NetworkService()
    
    # Perform health check
    health = service.health_check()
    
    print(f"\n🏥 Network Health Check:")
    print(f"   Status: {health['status'].upper()}")
    print(f"   Peers alive: {health['peers_alive']}")
    print(f"   Peers dead: {health['peers_dead']}")
    print(f"   Time synced: {health['time_synced']}")
    print(f"   Timestamp: {time.ctime(health['timestamp'])}")
    
    if health['status'] == 'healthy':
        print("\n✅ Network is healthy!")
    else:
        print("\n⚠️  Network has issues!")


def main():
    """Run all examples"""
    print("\n" + "="*60)
    print("🚀 EduChain P2P Network Examples")
    print("="*60)
    
    examples = [
        ("Network Initialization", example_1_initialize_network),
        ("Peer Discovery", example_2_peer_discovery),
        ("Transaction Gossip", example_3_gossip_transaction),
        ("Block Gossip", example_4_gossip_block),
        ("Consensus Timing", example_5_consensus_timing),
        ("Health Monitoring", example_7_health_monitoring),
    ]
    
    print("\nAvailable examples:")
    for i, (name, _) in enumerate(examples, 1):
        print(f"  {i}. {name}")
    print(f"  {len(examples) + 1}. Validator Rotation Demo (live)")
    print("  0. Run all examples")
    
    try:
        choice = input("\nSelect example (0-7): ").strip()
        
        if choice == '0':
            for name, func in examples:
                func()
                time.sleep(1)
        elif choice == str(len(examples) + 1):
            example_6_validator_rotation()
        elif choice.isdigit() and 1 <= int(choice) <= len(examples):
            examples[int(choice) - 1][1]()
        else:
            print("Invalid choice")
    
    except KeyboardInterrupt:
        print("\n\nExiting...")


if __name__ == "__main__":
    main()

