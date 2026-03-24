"""
Network Daemon for EduChain P2P Network
Background threads for periodic health checks and peer synchronization
"""
import time
import threading
from typing import Optional


class NetworkDaemon:
    """
    Background daemon that manages periodic network tasks:
    1. Health check thread: Pings all peers periodically
    2. Peer sync thread: Discovers new peers via PEX protocol
    """
    
    def __init__(self, network_service, health_interval: int = 30, sync_interval: int = 60):
        """
        Initialize NetworkDaemon
        
        Args:
            network_service: NetworkService instance
            health_interval: Seconds between health checks (default: 30)
            sync_interval: Seconds between peer sync (default: 60)
        """
        self.network_service = network_service
        self.health_interval = health_interval
        self.sync_interval = sync_interval
        
        self.is_running = False
        self._health_thread: Optional[threading.Thread] = None
        self._sync_thread: Optional[threading.Thread] = None
        
        # Statistics
        self.health_checks_count = 0
        self.peer_syncs_count = 0
    
    def start(self) -> None:
        """Start all daemon threads"""
        if self.is_running:
            print("⚠ Network daemon is already running")
            return
        
        self.is_running = True
        
        # Start health check thread
        self._health_thread = threading.Thread(
            target=self._health_check_loop,
            name="NetworkDaemon-HealthCheck",
            daemon=True
        )
        self._health_thread.start()
        
        # Start peer sync thread
        self._sync_thread = threading.Thread(
            target=self._peer_sync_loop,
            name="NetworkDaemon-PeerSync",
            daemon=True
        )
        self._sync_thread.start()
        
        print(f"✓ Network Daemon started")
        print(f"  Health check interval: {self.health_interval}s")
        print(f"  Peer sync interval: {self.sync_interval}s")
    
    def stop(self) -> None:
        """Stop all daemon threads"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        if self._health_thread:
            self._health_thread.join(timeout=5)
        if self._sync_thread:
            self._sync_thread.join(timeout=5)
        
        print(f"✓ Network Daemon stopped "
              f"(health_checks={self.health_checks_count}, peer_syncs={self.peer_syncs_count})")
    
    def _health_check_loop(self) -> None:
        """Background thread: periodic health check of all peers"""
        # Wait a bit before first check to let the server start
        time.sleep(10)
        
        while self.is_running:
            try:
                alive, dead = self.network_service.peer_manager.health_check_all_peers()
                self.health_checks_count += 1
                
                if dead > 0:
                    print(f"🔍 Health check #{self.health_checks_count}: "
                          f"{alive} alive, {dead} dead")
                
            except Exception as e:
                print(f"✗ Health check error: {e}")
            
            # Sleep in small increments so we can stop quickly
            self._interruptible_sleep(self.health_interval)
    
    def _peer_sync_loop(self) -> None:
        """Background thread: periodic peer discovery via PEX"""
        # Wait a bit before first sync
        time.sleep(15)
        
        while self.is_running:
            try:
                discovered = self.network_service.sync_peers()
                self.peer_syncs_count += 1
                
                if discovered > 0:
                    print(f"🔄 Peer sync #{self.peer_syncs_count}: "
                          f"{discovered} new peers discovered")
                
            except Exception as e:
                print(f"✗ Peer sync error: {e}")
            
            self._interruptible_sleep(self.sync_interval)
    
    def _interruptible_sleep(self, seconds: float) -> None:
        """Sleep in small increments so daemon can be stopped quickly"""
        interval = 1.0
        elapsed = 0.0
        while elapsed < seconds and self.is_running:
            time.sleep(min(interval, seconds - elapsed))
            elapsed += interval
    
    def get_stats(self) -> dict:
        """Get daemon statistics"""
        return {
            'is_running': self.is_running,
            'health_checks_count': self.health_checks_count,
            'peer_syncs_count': self.peer_syncs_count,
            'health_interval': self.health_interval,
            'sync_interval': self.sync_interval
        }


# Global daemon instance
_daemon_instance: Optional[NetworkDaemon] = None


def get_network_daemon() -> Optional[NetworkDaemon]:
    """Get global network daemon instance"""
    return _daemon_instance


def start_network_daemon(network_service, health_interval: int = 30, 
                          sync_interval: int = 60) -> NetworkDaemon:
    """Start the global network daemon"""
    global _daemon_instance
    
    if _daemon_instance is not None:
        _daemon_instance.stop()
    
    _daemon_instance = NetworkDaemon(
        network_service=network_service,
        health_interval=health_interval,
        sync_interval=sync_interval
    )
    _daemon_instance.start()
    
    return _daemon_instance


def stop_network_daemon() -> None:
    """Stop the global network daemon"""
    global _daemon_instance
    
    if _daemon_instance is not None:
        _daemon_instance.stop()
        _daemon_instance = None
