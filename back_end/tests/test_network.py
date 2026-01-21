"""
Test script for P2P Network functionality
Tests peer discovery, gossip protocol, and time synchronization
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import time
from network.config_loader import NetworkConfig
from network.peer_manager import PeerManager
from network.gossip_protocol import GossipProtocol
from network.ntp_sync import NTPClient, ConsensusTimer, verify_time_synchronization
from app.services.NetworkService import NetworkService


def test_configuration():
    """Test configuration loading"""
    print("\n" + "="*60)
    print("TEST 1: Configuration Loading")
    print("="*60)
    
    try:
        config = NetworkConfig()
        
        # Validate config
        assert config.validate_config(), "Configuration validation failed"
        
        # Check sections
        assert config.get_network_config(), "Network config missing"
        assert config.get_seed_nodes(), "Seed nodes missing"
        assert config.get_gossip_config(), "Gossip config missing"
        assert config.get_ntp_config(), "NTP config missing"
        
        print("✓ Configuration loaded successfully")
        print(f"  - Seed nodes: {len(config.get_seed_nodes())}")
        print(f"  - Whitelist enabled: {config.is_whitelist_enabled()}")
        print(f"  - Slot duration: {config.get_slot_duration()}s")
        
        return True
    except Exception as e:
        print(f"✗ Configuration test failed: {e}")
        return False


def test_peer_manager():
    """Test peer manager functionality"""
    print("\n" + "="*60)
    print("TEST 2: Peer Manager")
    print("="*60)
    
    try:
        manager = PeerManager()
        
        # Test adding peer
        peer = manager.add_peer(
            ip_address="10.0.1.100",
            port=5000,
            public_key="test_key_123",
            node_type="validator"
        )
        
        assert peer is not None, "Failed to add peer"
        print(f"✓ Added peer: {peer.ip_address}:{peer.port}")
        
        # Test peer ID generation
        peer_id = manager.generate_peer_id("10.0.1.100", 5000)
        assert len(peer_id) == 16, "Invalid peer ID length"
        print(f"✓ Generated peer ID: {peer_id}")
        
        # Test getting active peers
        active_peers = manager.get_active_peers()
        print(f"✓ Active peers: {len(active_peers)}")
        
        return True
    except Exception as e:
        print(f"✗ Peer manager test failed: {e}")
        return False


def test_gossip_protocol():
    """Test gossip protocol"""
    print("\n" + "="*60)
    print("TEST 3: Gossip Protocol")
    print("="*60)
    
    try:
        manager = PeerManager()
        gossip = GossipProtocol(manager)
        
        # Test fan-out calculation
        test_cases = [
            (5, 3),   # N=5 should give k=3 (min)
            (10, 3),  # N=10 should give k=3
            (50, 5),  # N=50 should give k≈5
        ]
        
        for n, expected_min in test_cases:
            k = gossip.calculate_fan_out(n)
            assert k >= expected_min, f"Fan-out too small for N={n}"
            print(f"✓ Fan-out for N={n}: k={k}")
        
        # Test message deduplication
        test_tx = {
            'tx_hash': 'test_hash_123',
            'sender': 'addr1',
            'recipient': 'addr2'
        }
        
        # First propagation should work
        is_new = gossip.receive_transaction(test_tx)
        assert is_new, "First transaction should be new"
        print("✓ First transaction marked as new")
        
        # Second propagation should be ignored
        is_new = gossip.receive_transaction(test_tx)
        assert not is_new, "Duplicate transaction should be ignored"
        print("✓ Duplicate transaction detected")
        
        return True
    except Exception as e:
        print(f"✗ Gossip protocol test failed: {e}")
        return False


def test_ntp_sync():
    """Test NTP synchronization"""
    print("\n" + "="*60)
    print("TEST 4: NTP Synchronization")
    print("="*60)
    
    try:
        ntp_client = NTPClient()
        
        # Test time sync (may fail if no internet)
        try:
            ntp_time, offset = ntp_client.get_ntp_time(use_multiple_servers=False)
            print(f"✓ NTP time retrieved: {time.ctime(ntp_time)}")
            print(f"✓ Offset: {offset:.3f}s")
        except Exception as e:
            print(f"⚠ NTP sync skipped (no internet?): {e}")
        
        # Test consensus timer
        timer = ConsensusTimer(ntp_client)
        
        current_slot = timer.get_current_slot()
        print(f"✓ Current slot: {current_slot}")
        
        # Test leader selection with 3 validators
        total_validators = 3
        leader = timer.get_leader_index(total_validators)
        print(f"✓ Current leader (3 validators): Validator #{leader}")
        
        # Test slot info
        info = timer.get_slot_info(total_validators)
        print(f"✓ Time remaining in slot: {info['time_remaining_in_slot']:.2f}s")
        
        return True
    except Exception as e:
        print(f"✗ NTP sync test failed: {e}")
        return False


def test_network_service():
    """Test network service integration"""
    print("\n" + "="*60)
    print("TEST 5: Network Service Integration")
    print("="*60)
    
    try:
        service = NetworkService()
        
        # Test initialization (may fail if no seed nodes available)
        print("→ Initializing network service...")
        try:
            success = service.initialize()
            if success:
                print("✓ Network service initialized")
            else:
                print("⚠ Network service initialization incomplete")
        except Exception as e:
            print(f"⚠ Network service init skipped: {e}")
        
        # Test getting stats
        stats = service.get_network_stats()
        print(f"✓ Network stats retrieved:")
        print(f"  - Total peers: {stats['total_peers']}")
        print(f"  - Active peers: {stats['active_peers']}")
        print(f"  - Slot duration: {stats['slot_duration']}s")
        
        return True
    except Exception as e:
        print(f"✗ Network service test failed: {e}")
        return False


def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 EduChain P2P Network Test Suite")
    print("="*60)
    
    results = {
        'Configuration': test_configuration(),
        'Peer Manager': test_peer_manager(),
        'Gossip Protocol': test_gossip_protocol(),
        'NTP Sync': test_ntp_sync(),
        'Network Service': test_network_service()
    }
    
    # Summary
    print("\n" + "="*60)
    print("📊 Test Results Summary")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠ {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
