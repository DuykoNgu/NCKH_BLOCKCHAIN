"""
Gossip Protocol for EduChain P2P Network
Implements transaction and block propagation using gossip algorithm
"""
import time
import math
import random
import requests
from typing import List, Dict, Set, Optional
import hashlib
import json

from network.peer_manager import PeerManager, Peer
from network.config_loader import get_config


class GossipMessage:
    """Represents a gossip message"""
    
    def __init__(self, msg_type: str, data: Dict, msg_id: str = None):
        self.msg_type = msg_type  # 'transaction', 'block', 'inv'
        self.data = data
        self.msg_id = msg_id or self.generate_msg_id()
        self.timestamp = time.time()
        self.ttl = self.get_ttl_for_type(msg_type)
    
    def generate_msg_id(self) -> str:
        """Generate unique message ID"""
        data_str = json.dumps(self.data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    def get_ttl_for_type(self, msg_type: str) -> int:
        """Get TTL based on message type"""
        config = get_config()
        gossip_config = config.get_gossip_config()
        
        if msg_type == 'transaction':
            return gossip_config.get('transaction_ttl', 300)
        elif msg_type == 'block':
            return gossip_config.get('block_ttl', 600)
        else:
            return 300
    
    def is_expired(self) -> bool:
        """Check if message has expired"""
        return (time.time() - self.timestamp) > self.ttl
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for transmission"""
        return {
            'msg_type': self.msg_type,
            'msg_id': self.msg_id,
            'data': self.data,
            'timestamp': self.timestamp
        }


class GossipProtocol:
    """Implements gossip-based message propagation"""
    
    def __init__(self, peer_manager: PeerManager):
        self.peer_manager = peer_manager
        self.config = get_config()
        self.gossip_config = self.config.get_gossip_config()
        
        # Track seen messages to prevent infinite loops
        self.seen_messages: Set[str] = set()
        self.message_cache: Dict[str, GossipMessage] = {}
        
        # Track inventory messages
        self.known_blocks: Set[str] = set()
        self.known_transactions: Set[str] = set()
    
    def calculate_fan_out(self, total_peers: int) -> int:
        """
        Calculate optimal fan-out factor
        Formula: k = sqrt(N) * fan_out_factor
        """
        if total_peers == 0:
            return 0
        
        fan_out_factor = self.gossip_config.get('fan_out_factor', 0.5)
        min_fan_out = self.gossip_config.get('min_fan_out', 3)
        max_fan_out = self.gossip_config.get('max_fan_out', 10)
        
        # Calculate k = sqrt(N) * factor
        k = int(math.sqrt(total_peers) * fan_out_factor)
        
        # Clamp to min/max
        k = max(min_fan_out, min(k, max_fan_out))
        k = min(k, total_peers)  # Can't exceed total peers
        
        return k
    
    def select_random_peers(self, k: int, exclude_peers: List[str] = None) -> List[Peer]:
        """
        Select k random peers for gossip
        Excludes peers in exclude_peers list
        """
        active_peers = self.peer_manager.get_active_peers()
        
        if exclude_peers:
            active_peers = [p for p in active_peers if p.peer_id not in exclude_peers]
        
        if len(active_peers) <= k:
            return active_peers
        
        return random.sample(active_peers, k)
    
    def has_seen_message(self, msg_id: str) -> bool:
        """Check if we've already seen this message"""
        return msg_id in self.seen_messages
    
    def mark_message_seen(self, msg_id: str, message: GossipMessage = None) -> None:
        """Mark message as seen"""
        self.seen_messages.add(msg_id)
        
        if message:
            self.message_cache[msg_id] = message
        
        # Clean up old messages periodically
        if len(self.seen_messages) > 10000:
            self.cleanup_old_messages()
    
    def cleanup_old_messages(self) -> None:
        """Remove expired messages from cache"""
        current_time = time.time()
        expired_ids = []
        
        for msg_id, message in self.message_cache.items():
            if message.is_expired():
                expired_ids.append(msg_id)
        
        for msg_id in expired_ids:
            self.seen_messages.discard(msg_id)
            del self.message_cache[msg_id]
        
        print(f"✓ Cleaned up {len(expired_ids)} expired messages")
    
    def send_message_to_peer(self, peer: Peer, endpoint: str, message: Dict, 
                            timeout: int = 5) -> bool:
        """Send message to a specific peer"""
        try:
            url = f"{peer.get_url()}/api/v1/network{endpoint}"
            response = requests.post(url, json=message, timeout=timeout)
            
            if response.status_code == 200:
                return True
            else:
                print(f"✗ Failed to send to {peer.ip_address}:{peer.port}: HTTP {response.status_code}")
                return False
        
        except requests.exceptions.RequestException as e:
            print(f"✗ Error sending to {peer.ip_address}:{peer.port}: {e}")
            return False
    
    def propagate_transaction(self, tx_data: Dict, exclude_peers: List[str] = None) -> int:
        """
        Propagate transaction using fan-out gossip
        Returns number of peers successfully notified
        """
        # Create gossip message
        message = GossipMessage('transaction', tx_data)
        
        # Check if we've already seen this transaction
        tx_hash = tx_data.get('tx_hash')
        if tx_hash and tx_hash in self.known_transactions:
            print(f"⚠ Transaction {tx_hash[:8]}... already known, skipping gossip")
            return 0
        
        # Mark as known
        if tx_hash:
            self.known_transactions.add(tx_hash)
        
        self.mark_message_seen(message.msg_id, message)
        
        # Calculate fan-out
        active_peers = self.peer_manager.get_active_peers()
        k = self.calculate_fan_out(len(active_peers))
        
        if k == 0:
            print("⚠ No peers available for gossip")
            return 0
        
        # Select random peers
        selected_peers = self.select_random_peers(k, exclude_peers)
        
        print(f"→ Gossiping transaction to {len(selected_peers)} peers (fan-out={k})")
        
        # Send to selected peers
        success_count = 0
        for peer in selected_peers:
            if self.send_message_to_peer(peer, '/gossip/transaction', message.to_dict()):
                success_count += 1
        
        print(f"✓ Transaction gossiped to {success_count}/{len(selected_peers)} peers")
        return success_count
    
    def propagate_block(self, block_data: Dict, use_inv: bool = True) -> int:
        """
        Propagate block with high priority
        Uses INV (inventory) messages for efficiency
        Returns number of peers successfully notified
        """
        block_hash = block_data.get('block_hash')
        
        if not block_hash:
            print("✗ Block hash missing, cannot propagate")
            return 0
        
        # Check if we've already seen this block
        if block_hash in self.known_blocks:
            print(f"⚠ Block {block_hash[:8]}... already known, skipping gossip")
            return 0
        
        # Mark as known
        self.known_blocks.add(block_hash)
        
        # Get all active peers (high priority - send to all)
        active_peers = self.peer_manager.get_active_peers()
        
        if not active_peers:
            print("⚠ No peers available for block propagation")
            return 0
        
        success_count = 0
        
        if use_inv:
            # Send INV message first (lightweight)
            inv_message = GossipMessage('inv', {
                'block_hash': block_hash,
                'block_index': block_data.get('index', 0),
                'has_block': True
            })
            
            print(f"→ Sending INV for block {block_hash[:8]}... to {len(active_peers)} peers")
            
            for peer in active_peers:
                if self.send_message_to_peer(peer, '/gossip/inv', inv_message.to_dict()):
                    success_count += 1
        else:
            # Send full block directly
            block_message = GossipMessage('block', block_data)
            
            print(f"→ Broadcasting full block {block_hash[:8]}... to {len(active_peers)} peers")
            
            for peer in active_peers:
                if self.send_message_to_peer(peer, '/gossip/block', block_message.to_dict()):
                    success_count += 1
        
        print(f"✓ Block propagated to {success_count}/{len(active_peers)} peers")
        return success_count
    
    def request_block(self, peer: Peer, block_hash: str) -> Optional[Dict]:
        """Request full block data from peer"""
        try:
            url = f"{peer.get_url()}/api/v1/network/gossip/block/{block_hash}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                block_data = response.json()
                print(f"✓ Received block {block_hash[:8]}... from {peer.ip_address}")
                return block_data
            else:
                print(f"✗ Failed to get block from {peer.ip_address}: HTTP {response.status_code}")
                return None
        
        except requests.exceptions.RequestException as e:
            print(f"✗ Error requesting block from {peer.ip_address}: {e}")
            return None
    
    def handle_inv_message(self, inv_data: Dict, sender_peer_id: str) -> Optional[Dict]:
        """
        Handle incoming INV message
        If we don't have the block, request it
        """
        block_hash = inv_data.get('block_hash')
        
        if not block_hash:
            return None
        
        # Check if we already have this block
        if block_hash in self.known_blocks:
            print(f"⚠ Already have block {block_hash[:8]}...")
            return None
        
        # We don't have it, request from sender
        print(f"→ Requesting block {block_hash[:8]}... from peer {sender_peer_id[:8]}...")
        
        # Find sender peer
        sender_peer = self.peer_manager.peers.get(sender_peer_id)
        if not sender_peer:
            print(f"✗ Sender peer {sender_peer_id[:8]}... not found")
            return None
        
        # Request block
        block_data = self.request_block(sender_peer, block_hash)
        
        if block_data:
            self.known_blocks.add(block_hash)
        
        return block_data
    
    def receive_transaction(self, tx_data: Dict, sender_peer_id: str = None) -> bool:
        """
        Handle received transaction from gossip
        Returns True if transaction is new and should be processed
        """
        tx_hash = tx_data.get('tx_hash')
        
        if not tx_hash:
            print("✗ Transaction hash missing")
            return False
        
        # Check if we've already seen this transaction
        if tx_hash in self.known_transactions:
            print(f"⚠ Transaction {tx_hash[:8]}... already in mempool")
            return False
        
        # Mark as known
        self.known_transactions.add(tx_hash)
        
        # ✅ VALIDATE AND ADD TO MEMPOOL
        from app.models.Transaction import Transaction
        from app.services.TransactionService import TransactionService
        from app.services.BlockChainService import BlockChainService
        from app.blockchain_instance import get_blockchain_instance
        
        try:
            # Parse transaction
            tx = Transaction.from_dict(tx_data)
            
            # Validate transaction signature
            if not TransactionService.is_valid(tx):
                print(f"✗ Invalid transaction signature: {tx_hash[:8]}...")
                return False
            
            # Add to blockchain mempool
            blockchain = get_blockchain_instance()
            if BlockChainService.add_transaction_to_mempool(blockchain, tx):
                print(f"✓ Transaction {tx_hash[:8]}... added to mempool")
            else:
                print(f"✗ Failed to add transaction {tx_hash[:8]}... to mempool")
                return False
        
        except Exception as e:
            print(f"✗ Error processing transaction: {e}")
            return False
        
        # Continue gossip to other peers (exclude sender)
        exclude = [sender_peer_id] if sender_peer_id else []
        self.propagate_transaction(tx_data, exclude_peers=exclude)
        
        return True
    
    def receive_block(self, block_data: Dict, sender_peer_id: str = None) -> bool:
        """
        Handle received block from gossip
        Returns True if block is new and should be processed
        """
        block_hash = block_data.get('block_hash')
        
        if not block_hash:
            print("✗ Block hash missing")
            return False
        
        # Check if we've already seen this block
        if block_hash in self.known_blocks:
            print(f"⚠ Block {block_hash[:8]}... already known")
            return False
        
        # Mark as known
        self.known_blocks.add(block_hash)
        
        # ✅ VERIFY AND COMMIT BLOCK
        from app.models.Block import Block
        from app.services.BlockService import BlockService
        from app.services.BlockChainService import BlockChainService
        from app.repositories.BlockRepository import BlockRepository
        from app.repositories.TransactionRepository import TransactionRepository
        from app.blockchain_instance import get_blockchain_instance
        
        try:
            # Parse block
            block = Block.from_dict(block_data)
            blockchain = get_blockchain_instance()
            
            # 1. Verify validator signature
            if not BlockService.verify_block(block, block.block_header.validator_pubkey):
                print(f"✗ Block {block_hash[:8]}... has invalid signature")
                return False
            
            # 2. Verify validator authorization
            if block.block_header.validator_pubkey not in blockchain.authority_set:
                print(f"✗ Validator {block.block_header.validator_pubkey[:16]}... not authorized")
                return False
            
            # 3. Verify merkle root
            calculated_merkle = BlockService.calculate_merkle_root(block.transactions)
            if calculated_merkle != block.block_header.merkle_root:
                print(f"✗ Merkle root mismatch for block {block_hash[:8]}...")
                return False
            
            # 4. Verify block chain continuity
            if len(blockchain.chain) > 0:
                if not BlockChainService.is_valid_new_block(blockchain, block, blockchain.get_last_block()):
                    print(f"✗ Block {block_hash[:8]}... validation failed")
                    return False
            
            # 5. Commit to blockchain
            BlockChainService.add_block(blockchain, block)
            
            # 6. Save to database
            BlockRepository.create_block(block)
            for tx in block.transactions:
                tx.block_id = block.block_id
                TransactionRepository.create_transaction(tx)
            
            print(f"✓ Block {block_hash[:8]}... verified and committed (index={block.index})")
        
        except Exception as e:
            print(f"✗ Failed to process block: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        # Continue gossip to other peers (exclude sender)
        exclude = [sender_peer_id] if sender_peer_id else []
        active_peers = self.peer_manager.get_active_peers()
        selected_peers = [p for p in active_peers if p.peer_id not in exclude]
        
        block_message = GossipMessage('block', block_data)
        for peer in selected_peers:
            self.send_message_to_peer(peer, '/gossip/block', block_message.to_dict())
        
        return True


if __name__ == "__main__":
    # Test gossip protocol
    from network.peer_manager import PeerManager
    
    peer_manager = PeerManager()
    gossip = GossipProtocol(peer_manager)
    
    print("\n=== Testing Gossip Protocol ===")
    
    # Test fan-out calculation
    for n in [5, 10, 20, 50, 100]:
        k = gossip.calculate_fan_out(n)
        print(f"N={n} peers → fan-out k={k}")
    
    # Test transaction gossip
    print("\n=== Test Transaction Gossip ===")
    test_tx = {
        'tx_hash': 'abc123',
        'sender': 'addr1',
        'recipient': 'addr2',
        'amount': 100
    }
    gossip.propagate_transaction(test_tx)
