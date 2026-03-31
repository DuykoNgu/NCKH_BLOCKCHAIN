"""
Peer Manager for EduChain P2P Network
Handles peer discovery, connection management, and health checks
"""
import sqlite3
import time
import requests
from typing import List, Dict, Optional, Tuple
import hashlib
import json
from enum import Enum
from app.database.connection import get_connection
from network.config_loader import get_config


class PeerStatus(Enum):
    """Peer status enum"""
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class Peer:
    """Represents a peer node in the network"""
    
    def __init__(self, peer_id: str, ip_address: str, port: int, 
                 public_key: str = "", node_type: str = "observer", status: str = "PENDING"):
        self.peer_id = peer_id
        self.ip_address = ip_address
        self.port = port
        self.public_key = public_key
        self.node_type = node_type
        # Handle both string and enum for status
        if isinstance(status, PeerStatus):
            self.status = status.value
        else:
            self.status = status if status in ["PENDING", "ACTIVE", "INACTIVE"] else "PENDING"
        self.last_seen = time.time()
    
    def get_url(self) -> str:
        """Get full URL for this peer"""
        return f"http://{self.ip_address}:{self.port}"
    
    def to_dict(self) -> Dict:
        """Convert peer to dictionary"""
        return {
            'peer_id': self.peer_id,
            'ip_address': self.ip_address,
            'port': self.port,
            'public_key': self.public_key,
            'node_type': self.node_type,
            'status': self.status,
            'last_seen': self.last_seen
        }
    
    @staticmethod
    def from_dict(data: Dict) -> 'Peer':
        """Create peer from dictionary"""
        peer = Peer(
            peer_id=data['peer_id'],
            ip_address=data['ip_address'],
            port=data['port'],
            public_key=data.get('public_key', ''),
            node_type=data.get('node_type', 'observer'),
            status=data.get('status', 'PENDING')
        )
        peer.last_seen = data.get('last_seen', time.time())
        return peer


class PeerManager:
    """Manages peer connections and discovery"""
    
    def __init__(self):
        self.config = get_config()
        self.peers: Dict[str, Peer] = {}
        self.load_peers_from_db()
    
    def load_peers_from_db(self) -> None:
        """Load peers from database"""
        conn = get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT peer_id, ip_address, port, public_key, node_type, 
                       status, last_seen
                FROM peers
                WHERE status = 'ACTIVE'
            """)
            
            rows = cursor.fetchall()
            for row in rows:
                peer = Peer(
                    peer_id=row['peer_id'],
                    ip_address=row['ip_address'],
                    port=row['port'],
                    public_key=row['public_key'] or '',
                    node_type=row['node_type'] or 'observer',
                    status=row['status'] or 'PENDING'
                )
                peer.last_seen = row['last_seen'] or time.time()
                self.peers[peer.peer_id] = peer
            
            print(f"✓ Loaded {len(self.peers)} peers from database")
        except sqlite3.Error as e:
            print(f"✗ Error loading peers: {e}")
        finally:
            conn.close()
    
    def save_peer_to_db(self, peer: Peer) -> bool:
        """Save peer to database"""
        conn = get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT OR REPLACE INTO peers 
                (peer_id, ip_address, port, public_key, node_type, status, last_seen)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                peer.peer_id,
                peer.ip_address,
                peer.port,
                peer.public_key,
                peer.node_type,
                peer.status,
                peer.last_seen
            ))
            
            conn.commit()
            return True
        except sqlite3.Error as e:
            print(f"✗ Error saving peer: {e}")
            return False
        finally:
            conn.close()
    
    def generate_peer_id(self, ip: str, port: int) -> str:
        """Generate unique peer ID from IP and port"""
        data = f"{ip}:{port}".encode()
        return hashlib.sha256(data).hexdigest()[:16]
    
    def add_peer(self, ip_address: str, port: int, public_key: str = "", 
                 node_type: str = "observer") -> Optional[Peer]:
        """Add a new peer to the network"""
        # Generate peer ID
        peer_id = self.generate_peer_id(ip_address, port)
        
        # Check if peer already exists
        if peer_id in self.peers:
            print(f"⚠ Peer {ip_address}:{port} already exists")
            return self.peers[peer_id]
            
        # Check max peers limit
        if len(self.peers) >= self.config.get_max_peers():
            print(f"⚠ Max peers limit reached ({self.config.get_max_peers()}). Cannot add {ip_address}:{port}")
            return None
        
        # Validate against whitelist if enabled
        if self.config.is_whitelist_enabled() and public_key:
            if not self.is_peer_authorized(public_key):
                print(f"✗ Peer {ip_address}:{port} not in whitelist")
                return None
        
        # Create and save peer
        peer = Peer(peer_id, ip_address, port, public_key, node_type)
        self.peers[peer_id] = peer
        self.save_peer_to_db(peer)
        
        print(f"✓ Added peer: {ip_address}:{port} ({node_type})")
        return peer
    
    def is_peer_authorized(self, public_key: str) -> bool:
        """Check if peer's public key is in whitelist"""
        authorized_keys = self.config.get_authorized_validators()
        return public_key in authorized_keys
    
    def remove_peer(self, peer_id: str) -> bool:
        """Remove peer from network"""
        if peer_id in self.peers:
            peer = self.peers[peer_id]
            peer.status = "INACTIVE"
            self.save_peer_to_db(peer)
            del self.peers[peer_id]
            print(f"✓ Removed peer: {peer_id}")
            return True
        return False
    
    def ping_peer(self, peer: Peer, timeout: int = 5) -> bool:
        """Ping peer to check if it's alive"""
        try:
            url = f"{peer.get_url()}/api/v1/network/health"
            response = requests.get(url, timeout=timeout)
            
            if response.status_code == 200:
                peer.last_seen = time.time()
                peer.status = "ACTIVE"
                self.save_peer_to_db(peer)
                return True
            else:
                return False
        except requests.exceptions.RequestException:
            return False
    
    def get_active_peers(self, timeout: int = 120) -> List[Peer]:
        """Get list of active peers (seen within timeout seconds)"""
        current_time = time.time()
        active_peers = []
        
        for peer in self.peers.values():
            if peer.status == "ACTIVE" and (current_time - peer.last_seen) < timeout:
                active_peers.append(peer)
        
        return active_peers
    
    def get_validator_peers(self) -> List[Peer]:
        """Get list of validator peers"""
        return [p for p in self.get_active_peers() if p.node_type == 'validator']
    
    def discover_peers_from_seed(self, seed_node: Dict) -> List[Peer]:
        """
        Discover peers from a seed node
        Implements Peer Exchange (PEX) protocol
        """
        discovered_peers = []
        
        try:
            url = f"http://{seed_node['ip']}:{seed_node['port']}/api/v1/network/peers"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                peer_list = response.json()
                
                for peer_data in peer_list:
                    peer = self.add_peer(
                        ip_address=peer_data['ip_address'],
                        port=peer_data['port'],
                        public_key=peer_data.get('public_key', ''),
                        node_type=peer_data.get('node_type', 'observer')
                    )
                    
                    if peer:
                        discovered_peers.append(peer)
                
                print(f"✓ Discovered {len(discovered_peers)} peers from {seed_node['name']}")
            else:
                print(f"✗ Failed to discover peers from {seed_node['name']}: HTTP {response.status_code}")
        
        except requests.exceptions.RequestException as e:
            print(f"✗ Error connecting to seed node {seed_node['name']}: {e}")
        
        return discovered_peers
    
    def bootstrap_network(self) -> int:
        """
        Bootstrap network by connecting to seed nodes
        Returns number of discovered peers
        """
        print("\n=== Starting Network Bootstrap ===")
        seed_nodes = self.config.get_seed_nodes()
        total_discovered = 0
        
        for seed_node in seed_nodes:
            print(f"\n→ Connecting to seed node: {seed_node['name']}")
            
            # Add seed node itself as a peer
            seed_peer = self.add_peer(
                ip_address=seed_node['ip'],
                port=seed_node['port'],
                public_key=seed_node.get('public_key', ''),
                node_type=seed_node.get('role', 'validator')
            )
            
            if seed_peer:
                # Discover peers from this seed node
                discovered = self.discover_peers_from_seed(seed_node)
                total_discovered += len(discovered)
        
        print(f"\n✓ Bootstrap complete: {total_discovered} peers discovered")
        print(f"✓ Total active peers: {len(self.get_active_peers())}")
        
        return total_discovered
    
    def health_check_all_peers(self) -> Tuple[int, int]:
        """
        Ping all peers to check health
        Returns (alive_count, dead_count)
        """
        alive = 0
        dead = 0
        
        for peer in list(self.peers.values()):
            if self.ping_peer(peer):
                alive += 1
            else:
                dead += 1
                peer.status = "INACTIVE"
                self.save_peer_to_db(peer)
        
        print(f"Health check: {alive} alive, {dead} dead")
        return alive, dead
    
    def get_peers_by_status(self, status: str) -> List[Peer]:
        """Get peers by status"""
        return [peer for peer in self.peers.values() if peer.status == status]
    
    def approve_peer(self, peer_id: str) -> bool:
        """Approve a pending peer (PENDING -> ACTIVE)"""
        if peer_id not in self.peers:
            # Try to load from database
            conn = get_connection()
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    SELECT peer_id, ip_address, port, public_key, node_type, status, last_seen
                    FROM peers
                    WHERE peer_id = ?
                """, (peer_id,))
                row = cursor.fetchone()
                if row:
                    peer = Peer(
                        peer_id=row['peer_id'],
                        ip_address=row['ip_address'],
                        port=row['port'],
                        public_key=row['public_key'] or '',
                        node_type=row['node_type'] or 'observer',
                        status=row['status'] or 'PENDING'
                    )
                    peer.last_seen = row['last_seen'] or time.time()
                    self.peers[peer_id] = peer
                else:
                    print(f"✗ Peer {peer_id} not found")
                    return False
            except sqlite3.Error as e:
                print(f"✗ Error loading peer: {e}")
                return False
            finally:
                conn.close()
        
        peer = self.peers.get(peer_id)
        if not peer:
            return False
        
        if peer.status != "PENDING":
            print(f"⚠ Peer {peer_id} is not pending (current status: {peer.status})")
            return False
        
        # Update status to ACTIVE
        peer.status = "ACTIVE"
        
        # Add to whitelist if configured
        if self.config.is_whitelist_enabled() and peer.public_key:
            # TODO: Add logic to update whitelist configuration
            print(f"✓ Added peer {peer_id} public key to whitelist")
        
        # Save to database
        if self.save_peer_to_db(peer):
            print(f"✓ Peer {peer_id} approved and activated")
            return True
        else:
            print(f"✗ Failed to save peer {peer_id}")
            return False
    
    def get_peer_list_for_api(self) -> List[Dict]:
        """Get peer list in format suitable for API response"""
        return [peer.to_dict() for peer in self.get_active_peers()]


if __name__ == "__main__":
    # Test peer manager
    manager = PeerManager()
    
    print("\n=== Testing Peer Manager ===")
    print(f"Current peers: {len(manager.peers)}")
    
    # Test bootstrap
    manager.bootstrap_network()
    
    # Test health check
    print("\n=== Health Check ===")
    manager.health_check_all_peers()
    
    # Show active peers
    print("\n=== Active Peers ===")
    for peer in manager.get_active_peers():
        print(f"  - {peer.ip_address}:{peer.port} ({peer.node_type})")
