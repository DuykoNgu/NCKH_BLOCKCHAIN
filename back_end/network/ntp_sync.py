"""
NTP Time Synchronization for EduChain
Ensures accurate time synchronization for slot-based PoA consensus
"""
import time
import ntplib
from typing import List, Tuple, Optional
import statistics

from network.config_loader import get_config


class NTPClient:
    """NTP client for time synchronization"""
    
    def __init__(self):
        self.config = get_config()
        self.ntp_config = self.config.get_ntp_config()
        self.ntp_servers = self.ntp_config.get('servers', ['pool.ntp.org'])
        self.max_offset = self.ntp_config.get('max_offset', 2.0)  # seconds
        self.client = ntplib.NTPClient()
        
        # Cache for time offset
        self.cached_offset: Optional[float] = None
        self.last_sync_time: float = 0
        self.sync_interval = self.ntp_config.get('sync_interval', 3600)  # 1 hour
    
    def query_ntp_server(self, server: str, timeout: int = 5) -> Optional[float]:
        """
        Query single NTP server and return offset
        Returns None if query fails
        """
        try:
            response = self.client.request(server, version=3, timeout=timeout)
            # Offset is the difference between server time and local time
            offset = response.offset
            return offset
        except Exception as e:
            print(f"[FAIL] Failed to query NTP server {server}: {e}")
            return None
    
    def get_ntp_time(self, use_multiple_servers: bool = True) -> Tuple[float, float]:
        """
        Get accurate time from NTP servers
        Returns (ntp_timestamp, offset_from_local)
        """
        offsets = []
        
        if use_multiple_servers:
            # Query multiple servers for better accuracy
            for server in self.ntp_servers:
                offset = self.query_ntp_server(server)
                if offset is not None:
                    offsets.append(offset)
                    print(f"[OK] NTP {server}: offset = {offset:.3f}s")
        else:
            # Query only first server
            offset = self.query_ntp_server(self.ntp_servers[0])
            if offset is not None:
                offsets.append(offset)
        
        if not offsets:
            print("[FAIL] Failed to query any NTP servers, using local time")
            return time.time(), 0.0
        
        # Use median offset for robustness
        median_offset = statistics.median(offsets)
        
        # Get current local time and adjust
        local_time = time.time()
        ntp_time = local_time + median_offset
        
        # Cache the offset
        self.cached_offset = median_offset
        self.last_sync_time = local_time
        
        return ntp_time, median_offset
    
    def calculate_offset(self) -> float:
        """
        Calculate time offset from NTP servers
        Uses cached value if recent sync exists
        """
        current_time = time.time()
        
        # Use cached offset if sync was recent
        if self.cached_offset is not None:
            time_since_sync = current_time - self.last_sync_time
            if time_since_sync < self.sync_interval:
                print(f"[OK] Using cached NTP offset: {self.cached_offset:.3f}s (synced {time_since_sync:.0f}s ago)")
                return self.cached_offset
        
        # Need fresh sync
        print("-> Synchronizing with NTP servers...")
        _, offset = self.get_ntp_time()
        
        return offset
    
    def get_synchronized_time(self) -> float:
        """Get current time synchronized with NTP"""
        offset = self.calculate_offset()
        return time.time() + offset
    
    def check_time_sync(self) -> bool:
        """
        Check if local time is synchronized within acceptable range
        Returns True if offset is within max_offset
        """
        offset = self.calculate_offset()
        
        if abs(offset) > self.max_offset:
            print(f"⚠ WARNING: Time offset {offset:.3f}s exceeds maximum {self.max_offset}s")
            print(f"⚠ This may cause consensus issues in PoA!")
            return False
        
        print(f"[OK] Time synchronized: offset = {offset:.3f}s (within {self.max_offset}s)")
        return True


class ConsensusTimer:
    """
    Manages slot-based timing for PoA consensus
    Implements formulas:
    - Current Slot = ⌊Current Timestamp / Slot Duration⌋
    - Leader Index = Current Slot mod Total Validators
    """
    
    def __init__(self, ntp_client: NTPClient = None):
        self.config = get_config()
        self.consensus_config = self.config.get_consensus_config()
        self.slot_duration = self.consensus_config.get('slot_duration', 5)  # 5 seconds
        self.ntp_client = ntp_client or NTPClient()
    
    def get_current_timestamp(self) -> float:
        """Get current synchronized timestamp"""
        return self.ntp_client.get_synchronized_time()
    
    def get_current_slot(self) -> int:
        """
        Calculate current slot number
        Formula: Current Slot = ⌊Current Timestamp / Slot Duration⌋
        """
        current_time = self.get_current_timestamp()
        slot = int(current_time // self.slot_duration)
        return slot
    
    def get_leader_index(self, total_validators: int) -> int:
        """
        Determine which validator should create block in current slot
        Formula: Leader Index = Current Slot mod Total Validators
        """
        if total_validators == 0:
            return 0
        
        current_slot = self.get_current_slot()
        leader_index = current_slot % total_validators
        return leader_index
    
    def get_leader_for_slot(self, slot: int, total_validators: int) -> int:
        """Get leader index for specific slot"""
        if total_validators == 0:
            return 0
        return slot % total_validators
    
    def is_my_turn(self, my_validator_index: int, total_validators: int) -> bool:
        """Check if it's current node's turn to create block"""
        leader_index = self.get_leader_index(total_validators)
        return leader_index == my_validator_index
    
    def time_until_next_slot(self) -> float:
        """Calculate seconds until next slot begins"""
        current_time = self.get_current_timestamp()
        current_slot = self.get_current_slot()
        next_slot_time = (current_slot + 1) * self.slot_duration
        return next_slot_time - current_time
    
    def time_until_my_turn(self, my_validator_index: int, total_validators: int) -> float:
        """Calculate seconds until it's my turn to create block"""
        if total_validators == 0:
            return float('inf')
        
        current_slot = self.get_current_slot()
        current_leader = self.get_leader_index(total_validators)
        
        if current_leader == my_validator_index:
            # It's my turn now
            return 0.0
        
        # Calculate slots until my turn
        slots_until_turn = (my_validator_index - current_leader) % total_validators
        if slots_until_turn == 0:
            slots_until_turn = total_validators
        
        # Calculate time
        time_in_current_slot = self.time_until_next_slot()
        additional_slots = slots_until_turn - 1
        
        total_time = time_in_current_slot + (additional_slots * self.slot_duration)
        return total_time
    
    def get_slot_info(self, total_validators: int) -> dict:
        """Get comprehensive slot information"""
        current_slot = self.get_current_slot()
        leader_index = self.get_leader_index(total_validators)
        time_remaining = self.time_until_next_slot()
        
        return {
            'current_slot': current_slot,
            'leader_index': leader_index,
            'slot_duration': self.slot_duration,
            'time_remaining_in_slot': time_remaining,
            'current_timestamp': self.get_current_timestamp()
        }
    
    def wait_for_next_slot(self) -> None:
        """Sleep until next slot begins"""
        wait_time = self.time_until_next_slot()
        if wait_time > 0:
            print(f"⏳ Waiting {wait_time:.2f}s for next slot...")
            time.sleep(wait_time)
    
    def wait_for_my_turn(self, my_validator_index: int, total_validators: int) -> None:
        """Sleep until it's my turn to create block"""
        wait_time = self.time_until_my_turn(my_validator_index, total_validators)
        if wait_time > 0:
            print(f"⏳ Waiting {wait_time:.2f}s for my turn (validator #{my_validator_index})...")
            time.sleep(wait_time)


def verify_time_synchronization() -> bool:
    """
    Verify that time synchronization is working correctly
    Should be called before starting consensus
    """
    print("\n=== Time Synchronization Check ===")
    
    ntp_client = NTPClient()
    
    # Check sync status
    is_synced = ntp_client.check_time_sync()
    
    if not is_synced:
        print("\n⚠ WARNING: Time synchronization failed!")
        print("⚠ Please ensure NTP service is running:")
        print("   - Windows: w32time service")
        print("   - Linux: ntpd or chronyd service")
        return False
    
    # Show current time info
    local_time = time.time()
    ntp_time = ntp_client.get_synchronized_time()
    offset = ntp_time - local_time
    
    print(f"\n[OK] Local time: {time.ctime(local_time)}")
    print(f"[OK] NTP time:   {time.ctime(ntp_time)}")
    print(f"[OK] Offset:     {offset:.3f} seconds")
    
    return True


if __name__ == "__main__":
    # Test NTP synchronization
    print("=== Testing NTP Client ===")
    
    ntp_client = NTPClient()
    
    # Test time sync
    verify_time_synchronization()
    
    # Test consensus timer
    print("\n=== Testing Consensus Timer ===")
    timer = ConsensusTimer(ntp_client)
    
    # Example with 3 validators
    total_validators = 3
    
    for i in range(5):
        info = timer.get_slot_info(total_validators)
        print(f"\nSlot #{info['current_slot']}")
        print(f"  Leader: Validator #{info['leader_index']}")
        print(f"  Time remaining: {info['time_remaining_in_slot']:.2f}s")
        
        # Check each validator
        for v_idx in range(total_validators):
            is_turn = timer.is_my_turn(v_idx, total_validators)
            time_until = timer.time_until_my_turn(v_idx, total_validators)
            status = "🟢 ACTIVE" if is_turn else f"⏳ {time_until:.1f}s"
            print(f"  Validator #{v_idx}: {status}")
        
        # Wait for next slot
        if i < 4:
            timer.wait_for_next_slot()


