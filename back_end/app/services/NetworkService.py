import time
from typing import List, Dict, Optional

from network.peer_manager import PeerManager, Peer
from network.gossip_protocol import GossipProtocol
from network.ntp_sync import NTPClient, ConsensusTimer, verify_time_synchronization
from network.config_loader import get_config


class NetworkService:
    
    def __init__(self, db_path: str = 'NCKH_educhain.db'):
        self.config = get_config()
        self.peer_manager = PeerManager()
        self.gossip = GossipProtocol(self.peer_manager)
        self.ntp_client = NTPClient()
        self.consensus_timer = ConsensusTimer(self.ntp_client)
        
        self.is_initialized = False
    
    def initialize(self, node_ip: str = None, node_port: int = None, public_key: str = "") -> bool:
        print("\n" + "="*50)
        print("🚀 Initializing EduChain Network Service")
        print("="*50)
        
        if node_ip and node_port:
            self.peer_manager.set_local_peer_id(node_ip, node_port)
        
        print("\n[1/3] Verifying time synchronization...")
        if not verify_time_synchronization():
            print("✗ Time synchronization check failed")
            return False
        
        print("\n[2/3] Bootstrapping P2P network...")
        discovered = self.bootstrap_network(node_ip, node_port, public_key)
        print(f"✓ Network bootstrap complete: {discovered} peers discovered")
        
        print("\n[3/3] Performing initial health check...")
        alive, dead = self.peer_manager.health_check_all_peers()
        print(f"✓ Health check complete: {alive} alive, {dead} dead")
        
        self.is_initialized = True
        
        print("\n" + "="*50)
        print("✅ Network Service Initialized Successfully")
        print("="*50 + "\n")
        
        return True
    
    def bootstrap_network(self, node_ip: str = None, node_port: int = None, public_key: str = "") -> int:
        return self.peer_manager.bootstrap_network(node_ip, node_port, public_key)
    
    def sync_peers(self) -> int:
        print("→ Synchronizing peer list...")
        
        active_peers = self.peer_manager.get_active_peers()
        
        if not active_peers:
            print("⚠ No active peers, attempting bootstrap...")
            return self.bootstrap_network()
        
        total_discovered = 0
        
        for peer in active_peers[:5]:
            seed_node_format = {
                'name': f"Peer {peer.peer_id[:8]}",
                'ip': peer.ip_address,
                'port': peer.port,
                'public_key': peer.public_key
            }
            
            discovered = self.peer_manager.discover_peers_from_seed(seed_node_format)
            total_discovered += len(discovered)
        
        print(f"✓ Peer sync complete: {total_discovered} new peers discovered")
        return total_discovered
    
    def validate_peer(self, public_key: str) -> bool:
        return self.peer_manager.is_peer_authorized(public_key)
    
    def register_peer(self, ip_address: str, port: int, public_key: str, 
                     node_type: str = "observer") -> Optional[Dict]:
        peer = self.peer_manager.add_peer(ip_address, port, public_key, node_type)
        
        if peer:
            return peer.to_dict()
        return None
    
    def get_peer_list(self) -> List[Dict]:
        return self.peer_manager.get_peer_list_for_api()
    
    def broadcast_transaction(self, tx_data: Dict) -> int:
        tx_hash = tx_data.get('tx_hash', 'UNKNOWN')
        try:
            result = self.gossip.propagate_transaction(tx_data)
            return result
        except Exception as e:
            print(f"❌ [NetworkService.broadcast_transaction] Failed to broadcast {tx_hash[:8]}: {e}")
            raise
    
    def broadcast_block(self, block_data: Dict, use_inv: bool = True) -> int:
        block_hash = block_data.get('block_hash', 'UNKNOWN')
        try:
            result = self.gossip.propagate_block(block_data, use_inv)
            return result
        except Exception as e:
            print(f"❌ [NetworkService.broadcast_block] Failed to broadcast {block_hash[:8]}: {e}")
            raise
    
    def receive_transaction(self, tx_data: Dict, sender_peer_id: str = None) -> bool:
        return self.gossip.receive_transaction(tx_data, sender_peer_id)
    
    def receive_block(self, block_data: Dict, sender_peer_id: str = None) -> bool:
        return self.gossip.receive_block(block_data, sender_peer_id)
    
    def handle_inv_message(self, inv_data: Dict, sender_peer_id: str) -> Optional[Dict]:
        return self.gossip.handle_inv_message(inv_data, sender_peer_id)
    
    def get_block_by_hash(self, block_hash: str) -> Optional[Dict]:
        from app.repositories.BlockRepository import BlockRepository

        for block in BlockRepository.get_all_blocks():
            if block.block_hash == block_hash:
                return block.to_dict()
        return None
    
    def get_current_slot_info(self, total_validators: int) -> Dict:
        return self.consensus_timer.get_slot_info(total_validators)
    
    def get_current_leader(self, total_validators: int) -> int:
        return self.consensus_timer.get_leader_index(total_validators)
    
    def is_my_turn(self, my_validator_index: int, total_validators: int) -> bool:
        return self.consensus_timer.is_my_turn(my_validator_index, total_validators)
    
    def wait_for_my_turn(self, my_validator_index: int, total_validators: int) -> None:
        self.consensus_timer.wait_for_my_turn(my_validator_index, total_validators)
    
    def check_time_sync(self) -> bool:
        return self.ntp_client.check_time_sync()
    
    def get_network_stats(self) -> Dict:
        active_peers = self.peer_manager.get_active_peers()
        validator_peers = self.peer_manager.get_validator_peers()
        pending_peers = self.peer_manager.get_peers_by_status("PENDING")
        
        return {
            'total_peers': len(self.peer_manager.peers),
            'active_peers': len(active_peers),
            'pending_peers': len(pending_peers),
            'validator_peers': len(validator_peers),
            'observer_peers': len(active_peers) - len(validator_peers),
            'whitelist_enabled': self.config.is_whitelist_enabled(),
            'slot_duration': self.consensus_timer.slot_duration,
            'ntp_offset': self.ntp_client.cached_offset or 0.0,
            'is_time_synced': self.ntp_client.check_time_sync()
        }
    
    def approve_peer(self, peer_id: str) -> bool:
        return self.peer_manager.approve_peer(peer_id)
    
    def get_pending_peers(self) -> List[Dict]:
        pending_peers = self.peer_manager.get_peers_by_status("PENDING")
        return [peer.to_dict() for peer in pending_peers]
    
    def update_peer_status(self, public_key: str, status: str, node_type: str = "validator") -> bool:
        return self.peer_manager.update_peer_status_by_public_key(public_key, status, node_type)
    
    def update_peer_activation(self, ip_address: str, port: int, public_key: str, node_type: str = "validator") -> bool:
        return self.peer_manager.update_peer_activation_by_ip_port(ip_address, port, public_key, node_type)
    
    def health_check(self) -> Dict:
        active_peers = len(self.peer_manager.get_active_peers())
        total_peers = len(self.peer_manager.peers)
        dead = total_peers - active_peers
        
        return {
            'status': 'healthy',
            'peers_alive': active_peers,
            'peers_dead': dead,
            'time_synced': self.check_time_sync(),
            'timestamp': time.time()
        }


_network_service: Optional[NetworkService] = None


def get_network_service() -> NetworkService:
    global _network_service
    if _network_service is None:
        _network_service = NetworkService()
    return _network_service


def initialize_network(node_ip: str = None, node_port: int = None, public_key: str = "") -> bool:
    service = get_network_service()
    return service.initialize(node_ip, node_port, public_key)


if __name__ == "__main__":
    service = NetworkService()
    
    if service.initialize():
        print("\n=== Network Statistics ===")
        stats = service.get_network_stats()
        for key, value in stats.items():
            print(f"{key}: {value}")
        
        print("\n=== Slot Information (3 validators) ===")
        slot_info = service.get_current_slot_info(3)
        for key, value in slot_info.items():
            print(f"{key}: {value}")
