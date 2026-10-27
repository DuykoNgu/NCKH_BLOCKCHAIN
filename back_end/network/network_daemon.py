import time
import threading
from typing import Optional


class NetworkDaemon:
    
    def __init__(self, network_service, health_interval: int = 30, sync_interval: int = 60):
        self.network_service = network_service
        self.health_interval = health_interval
        self.sync_interval = sync_interval
        
        self.is_running = False
        self._health_thread: Optional[threading.Thread] = None
        self._sync_thread: Optional[threading.Thread] = None
        
        self.health_checks_count = 0
        self.peer_syncs_count = 0
    
    def start(self) -> None:
        if self.is_running:
            print("⚠ Network daemon is already running")
            return
        
        self.is_running = True
        
        self._health_thread = threading.Thread(
            target=self._health_check_loop,
            name="NetworkDaemon-HealthCheck",
            daemon=True
        )
        self._health_thread.start()
        
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
            
            self._interruptible_sleep(self.health_interval)
    
    def _peer_sync_loop(self) -> None:
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
        interval = 1.0
        elapsed = 0.0
        while elapsed < seconds and self.is_running:
            time.sleep(min(interval, seconds - elapsed))
            elapsed += interval
    
    def get_stats(self) -> dict:
        return {
            'is_running': self.is_running,
            'health_checks_count': self.health_checks_count,
            'peer_syncs_count': self.peer_syncs_count,
            'health_interval': self.health_interval,
            'sync_interval': self.sync_interval
        }


_daemon_instance: Optional[NetworkDaemon] = None


def get_network_daemon() -> Optional[NetworkDaemon]:
    return _daemon_instance


def start_network_daemon(network_service, health_interval: int = 30, 
                          sync_interval: int = 60) -> NetworkDaemon:
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
    global _daemon_instance
    
    if _daemon_instance is not None:
        _daemon_instance.stop()
        _daemon_instance = None
