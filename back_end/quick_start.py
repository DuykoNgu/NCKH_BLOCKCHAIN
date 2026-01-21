"""
Quick Start Guide - EduChain P2P Network
Run this script to verify the installation
"""
import sys
import os

# Add back_end to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("="*60)
print("🚀 EduChain P2P Network - Quick Start")
print("="*60)

# Step 1: Check dependencies
print("\n[1/4] Checking dependencies...")
try:
    import ntplib
    import requests
    print("✅ All dependencies installed")
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("Run: pip install ntplib requests")
    sys.exit(1)

# Step 2: Load configuration
print("\n[2/4] Loading configuration...")
try:
    from network.config_loader import NetworkConfig
    config = NetworkConfig()
    config.validate_config()
    print("✅ Configuration loaded successfully")
    print(f"   - Seed nodes: {len(config.get_seed_nodes())}")
    print(f"   - Slot duration: {config.get_slot_duration()}s")
except Exception as e:
    print(f"❌ Configuration error: {e}")
    sys.exit(1)

# Step 3: Test NTP sync
print("\n[3/4] Testing NTP synchronization...")
try:
    from network.ntp_sync import NTPClient
    ntp = NTPClient()
    offset = ntp.calculate_offset()
    print(f"✅ NTP synchronized (offset: {offset:.3f}s)")
except Exception as e:
    print(f"⚠️  NTP sync failed (no internet?): {e}")
    print("   This is OK for testing, but required for production")

# Step 4: Test consensus timer
print("\n[4/4] Testing consensus timer...")
try:
    from network.ntp_sync import ConsensusTimer
    timer = ConsensusTimer()
    slot = timer.get_current_slot()
    leader = timer.get_leader_index(3)
    print(f"✅ Consensus timer working")
    print(f"   - Current slot: {slot}")
    print(f"   - Leader (3 validators): Validator #{leader}")
except Exception as e:
    print(f"❌ Consensus timer error: {e}")
    sys.exit(1)

# Summary
print("\n" + "="*60)
print("✅ Quick Start Complete!")
print("="*60)
print("\nNext steps:")
print("1. Update seed nodes in network/config.json")
print("2. Run: python examples/network_examples.py")
print("3. Start Flask app: python app/main.py")
print("\nDocumentation: network/README.md")
