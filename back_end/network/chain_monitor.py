"""
Chain Monitor for EduChain
Periodically monitors blockchain state across connected peers
Automatically triggers synchronization when block gaps are detected
"""

import time
import threading
import json
from typing import Dict, List, Optional
from datetime import datetime

from network.peer_manager import PeerManager, Peer
from network.chain_sync import ChainSync
from network.config_loader import get_config

class PeerBlockStatus:
    """Track block status of each peer"""
    
    def __init__(self, peer: Peer):
        self.peer = peer
        self.chain_height = 0
        self.last_queried = 0
        self.query_count = 0
        self.failed_count = 0
        self.status = "UNKNOWN"  # ACTIVE, SYNCED, BEHIND, AHEAD, UNREACHABLE
    
    def __repr__(self):
        return (f"PeerBlockStatus({self.peer.ip_address}:{self.peer.port} "
                f"h={self.chain_height} status={self.status})")


class ChainMonitor:
    """
    Monitors blockchain synchronization state
    
    Features:
    - Periodically queries peer chain heights
    - Identifies missing blocks and block gaps
    - Automatically triggers chain sync when needed
    - Maintains peer block statistics
    - Non-blocking background monitoring
    """
    
    def __init__(self, peer_manager: PeerManager, blockchain, check_interval: int = 30):
        """
        Initialize chain monitor
        
        Args:
            peer_manager: PeerManager instance
            blockchain: Blockchain instance
            check_interval: Seconds between checks (default: 30s)
        """
        self.peer_manager = peer_manager
        self.blockchain = blockchain
        self.config = get_config()
        self.check_interval = check_interval
        
        # Monitoring state
        self.peer_block_status: Dict[str, PeerBlockStatus] = {}
        self.is_running = False
        self.monitor_thread = None
        self.last_check_time = 0
        
        # Sync trigger thresholds
        self.max_height = 0
        self.local_height = 0
        monitor_config = self.config.get_monitor_config()
        self.block_gap_threshold = monitor_config.get('block_gap_threshold', 5)
        self.sync_check_enabled = monitor_config.get('auto_sync_enabled', True)
        
        print(f"[ChainMonitor] Initialized (interval={check_interval}s, gap_threshold={self.block_gap_threshold})")
    
    def get_local_height(self) -> int:
        """
        Get current local blockchain height.
        
        Priority:
        1. Query DB directly (MAX index_num) - the reliable persistent source
        2. If RAM chain is behind DB (e.g. after restart), reload chain from DB
        3. Fallback to RAM chain length if DB query fails
        """
        try:
            from app.database.connection import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT MAX(index_num) FROM block')
            row = cursor.fetchone()
            conn.close()
            
            if row and row[0] is not None:
                db_height = int(row[0])
            else:
                db_height = -1
            
            # Check if RAM chain is out-of-sync with DB (e.g. after restart)
            ram_height = len(self.blockchain.chain) - 1
            if db_height > ram_height:
                print(f"[ChainMonitor] ⚠️  RAM chain ({ram_height}) lags behind DB ({db_height}), reloading from DB...")
                try:
                    from app.blockchain_instance import load_chain_from_db
                    load_chain_from_db(self.blockchain)
                    print(f"[ChainMonitor] ✅ Chain reloaded: RAM height now {len(self.blockchain.chain) - 1}")
                except Exception as reload_err:
                    print(f"[ChainMonitor] ✗ Could not reload chain from DB: {reload_err}")
            
            self.local_height = db_height
            return self.local_height
        
        except Exception as e:
            print(f"✗ [ChainMonitor] Error getting local height from DB: {e}")
            # Fallback to RAM
            try:
                self.local_height = len(self.blockchain.chain) - 1
                return self.local_height
            except Exception:
                return 0
    
    def query_peer_block_info(self, peer: Peer) -> Optional[int]:
        """
        Query a peer for its chain height and update status
        
        Returns:
            Chain height or None if query failed
        """
        if peer.peer_id not in self.peer_block_status:
            self.peer_block_status[peer.peer_id] = PeerBlockStatus(peer)
        
        status = self.peer_block_status[peer.peer_id]
        
        try:
            # Query peer height endpoint
            url = f"{peer.get_url()}/api/v1/network/blocks/height"
            import requests
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                height = data.get('height', 0)
                
                status.chain_height = height
                status.last_queried = time.time()
                status.query_count += 1
                status.failed_count = 0
                status.status = "ACTIVE"
                
                return height
            else:
                status.failed_count += 1
                status.status = "UNREACHABLE"
                return None
        
        except requests.exceptions.RequestException as e:
            status.failed_count += 1
            status.status = "UNREACHABLE"
            return None
    
    def get_peer_block_info(self, peer: Peer, block_index: int, timeout: int = 5) -> Optional[Dict]:
        """
        Get a specific block from a peer
        
        Args:
            peer: Peer to query
            block_index: Block index to fetch
            timeout: Request timeout
            
        Returns:
            Block data dict or None if failed
        """
        try:
            url = f"{peer.get_url()}/api/v1/network/blocks/{block_index}"
            import requests
            response = requests.get(url, timeout=timeout)
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
        
        except requests.exceptions.RequestException:
            return None
    
    def scan_peer_blocks(self, peer: Peer, start_index: int, end_index: int) -> Dict[int, bool]:
        """
        Scan a peer to identify which blocks it has
        
        Args:
            peer: Peer to scan
            start_index: Starting block index
            end_index: Ending block index
            
        Returns:
            Dict {block_index: has_block}
        """
        block_map = {}
        
        for idx in range(start_index, end_index + 1):
            block_data = self.get_peer_block_info(peer, idx, timeout=3)
            block_map[idx] = block_data is not None
        
        return block_map
    
    def identify_missing_blocks(self) -> List[int]:
        """
        Identify missing blocks in local chain
        by comparing with connected peers
        
        Returns:
            List of missing block indices
        """
        local_height = self.get_local_height()  # Uses DB-based height
        missing_blocks = []
        
        # Get blocks we know we're missing
        if self.max_height > local_height:
            for idx in range(local_height + 1, min(self.max_height + 1, local_height + 100)):
                missing_blocks.append(idx)
        
        return missing_blocks
    
    def monitor_loop(self):
        """Main monitoring loop - runs in background thread"""
        print(f"\n[ChainMonitor] 🔄 Monitor loop started (check_interval={self.check_interval}s)")
        print(f"[ChainMonitor] 🔄 block_gap_threshold={self.block_gap_threshold}, auto_sync_enabled={self.sync_check_enabled}")
        print(f"[ChainMonitor] ⏳ Waiting {self.check_interval} seconds before first check...\n")
        
        # Wait before first check to let peers initialize
        first_check_delay = min(self.check_interval, 10)
        check_count = 0
        
        while self.is_running:
            try:
                # First check: use shorter delay to give peers time to initialize
                if check_count == 0 and first_check_delay > 0:
                    time.sleep(first_check_delay)
                    print(f"[ChainMonitor] → Starting first check...")
                
                check_count += 1
                self._do_monitor_check()
                
                # Regular checks: use configured interval
                if self.is_running:
                    time.sleep(self.check_interval)
            
            except KeyboardInterrupt:
                print("[ChainMonitor] Monitor interrupted")
                break
            
            except Exception as e:
                print(f"✗ [ChainMonitor] Error in monitor loop: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(self.check_interval)
    
    def _do_monitor_check(self):
        """Perform one monitoring check iteration"""
        check_time = datetime.now().strftime("%H:%M:%S")
        
        # Update local height
        self.get_local_height()
        
        # Get active peers
        active_peers = self.peer_manager.get_active_peers()
        
        if not active_peers:
            print(f"[ChainMonitor {check_time}] ⚠️  No active peers to monitor")
            return
        
        # Query all active peers for height
        peer_heights = []
        
        for peer in active_peers:
            height = self.query_peer_block_info(peer)
            if height is not None:
                peer_heights.append((peer, height))
        
        if not peer_heights:
            print(f"[ChainMonitor {check_time}] ⚠️  Could not query any peer heights (tried {len(active_peers)} peers)")
            return
        
        # Find max height from all peers
        self.max_height = max(h for _, h in peer_heights)
        
        # Analyze block gap
        block_gap = self.max_height - self.local_height
        
        # Build status report
        status_lines = [
            f"[ChainMonitor {check_time}]",
            f"  📊 Local height: {self.local_height}",
            f"  📊 Max remote height: {self.max_height} (gap={block_gap})",
            f"  📊 Queried {len(peer_heights)}/{len(active_peers)} peers"
        ]
        
        # Print peer details
        for peer, height in peer_heights:
            status = self.peer_block_status.get(peer.peer_id)
            if status:
                diff = height - self.local_height
                sync_marker = "✓" if height == self.local_height else f"({diff:+d})"
                status_lines.append(f"    {peer.ip_address}:{peer.port} h={height} {sync_marker}")
        
        print("\n".join(status_lines))
        
        # ✅ AUTO-TRIGGER SYNC IF NEEDED
        if self.sync_check_enabled and block_gap > 0:
            print(f"\n🔴 [ChainMonitor] Block gap detected: local={self.local_height}, remote={self.max_height} (gap={block_gap})")
            print(f"   Threshold: {self.block_gap_threshold}, Auto-sync enabled: {self.sync_check_enabled}")
            self._trigger_auto_sync()
        elif block_gap <= 0:
            print(f"   ✓ Chain is synced with network")
    
    def _trigger_auto_sync(self) -> int:
        """
        Trigger automatic chain synchronization
        
        Returns:
            Number of blocks synced
        """
        print(f"→ [ChainMonitor] Triggering automatic chain sync...")
        
        try:
            chain_sync = ChainSync(self.peer_manager, self.blockchain)
            blocks_synced = chain_sync.sync()
            
            if blocks_synced > 0:
                print(f"✅ [ChainMonitor] Auto-sync completed: {blocks_synced} blocks synced")
                self.get_local_height()  # Update local height
                return blocks_synced
            else:
                print(f"⚠️  [ChainMonitor] Auto-sync found no blocks to sync")
                return 0
        
        except Exception as e:
            print(f"✗ [ChainMonitor] Auto-sync failed: {e}")
            import traceback
            traceback.print_exc()
            return 0
    
    def start(self):
        """Start monitoring in background thread"""
        if self.is_running:
            print("[ChainMonitor] ⚠️  Monitor already running (cannot start twice)")
            return
        
        self.is_running = True
        self.monitor_thread = threading.Thread(
            target=self.monitor_loop,
            daemon=True,
            name="ChainMonitor"
        )
        self.monitor_thread.start()
        print("[ChainMonitor] ✓ Background thread started")
    
    def stop(self):
        """Stop monitoring"""
        if not self.is_running:
            print("[ChainMonitor] Monitor not running")
            return
        
        self.is_running = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        
        print("[ChainMonitor] ✓ Stopped")
    
    def get_monitored_peers_summary(self) -> Dict:
        """Get summary of monitored peers"""
        local_h = self.get_local_height()
        
        summary = {
            'timestamp': datetime.now().isoformat(),
            'local_height': local_h,
            'max_remote_height': self.max_height,
            'block_gap': self.max_height - local_h,
            'monitored_peers': len(self.peer_block_status),
            'peer_details': []
        }
        
        for peer_id, status in self.peer_block_status.items():
            summary['peer_details'].append({
                'peer_id': peer_id,
                'ip_address': status.peer.ip_address,
                'port': status.peer.port,
                'chain_height': status.chain_height,
                'status': status.status,
                'query_count': status.query_count,
                'failed_count': status.failed_count,
                'last_queried': datetime.fromtimestamp(status.last_queried).isoformat() 
                                if status.last_queried else None
            })
        
        return summary
    
    def get_statistics(self) -> Dict:
        """Get monitoring statistics"""
        stats = {
            'is_running': self.is_running,
            'check_interval': self.check_interval,
            'block_gap_threshold': self.block_gap_threshold,
            'local_height': self.local_height,
            'max_peer_height': self.max_height,
            'peers_monitored': len(self.peer_block_status),
        }
        
        # Calculate peer statistics
        if self.peer_block_status:
            heights = [s.chain_height for s in self.peer_block_status.values()]
            stats['avg_peer_height'] = sum(heights) / len(heights)
            stats['min_peer_height'] = min(heights)
            stats['max_peer_height'] = max(heights)
        
        return stats


# Global monitor instance
_global_monitor: Optional[ChainMonitor] = None


def init_chain_monitor(peer_manager: PeerManager, blockchain, check_interval: int = 30) -> ChainMonitor:
    """Initialize global chain monitor"""
    global _global_monitor
    _global_monitor = ChainMonitor(peer_manager, blockchain, check_interval)
    return _global_monitor


def get_chain_monitor() -> Optional[ChainMonitor]:
    """Get global chain monitor instance"""
    return _global_monitor


def start_chain_monitoring():
    """Start chain monitoring"""
    if _global_monitor:
        _global_monitor.start()


def stop_chain_monitoring():
    """Stop chain monitoring"""
    if _global_monitor:
        _global_monitor.stop()


if __name__ == "__main__":
    # Test chain monitor
    from network.peer_manager import PeerManager
    from app.blockchain_instance import get_blockchain_instance
    
    peer_manager = PeerManager()
    blockchain = get_blockchain_instance()
    
    # Initialize monitor
    monitor = ChainMonitor(peer_manager, blockchain, check_interval=10)
    
    # Start monitoring
    monitor.start()
    
    try:
        # Let it run for a while
        print("\n=== Chain Monitor Test ===")
        print("Monitoring for 60 seconds...")
        time.sleep(60)
    
    except KeyboardInterrupt:
        print("\nStopping monitor...")
    
    finally:
        monitor.stop()
        print("Done")
