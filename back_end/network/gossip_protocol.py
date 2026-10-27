import time
import math
import random
import requests
from typing import List, Dict, Set, Optional
import hashlib
import json
from app.models.Transaction import Transaction
from network.peer_manager import PeerManager, Peer
from network.config_loader import get_config


class GossipMessage:
    
    def __init__(self, msg_type: str, data: Dict, msg_id: str = None):
        self.msg_type = msg_type
        self.data = data
        self.msg_id = msg_id or self.generate_msg_id()
        self.timestamp = time.time()
        self.ttl = self.get_ttl_for_type(msg_type)
    
    def generate_msg_id(self) -> str:
        data_str = json.dumps(self.data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    def get_ttl_for_type(self, msg_type: str) -> int:
        config = get_config()
        gossip_config = config.get_gossip_config()
        
        if msg_type == 'transaction':
            return gossip_config.get('transaction_ttl', 300)
        elif msg_type == 'block':
            return gossip_config.get('block_ttl', 600)
        else:
            return 300
    
    def is_expired(self) -> bool:
        return (time.time() - self.timestamp) > self.ttl
    
    def to_dict(self) -> Dict:
        return {
            'msg_type': self.msg_type,
            'msg_id': self.msg_id,
            'data': self.data,
            'timestamp': self.timestamp
        }


class GossipProtocol:
    
    def __init__(self, peer_manager: PeerManager):
        self.peer_manager = peer_manager
        self.config = get_config()
        self.gossip_config = self.config.get_gossip_config()
        
        self.seen_messages: Set[str] = set()
        self.message_cache: Dict[str, GossipMessage] = {}
        
        self.known_blocks: Set[str] = set()
        self.known_transactions: Set[str] = set()
    
    def calculate_fan_out(self, total_peers: int) -> int:
        if total_peers == 0:
            return 0
        
        fan_out_factor = self.gossip_config.get('fan_out_factor', 0.5)
        min_fan_out = self.gossip_config.get('min_fan_out', 3)
        max_fan_out = self.gossip_config.get('max_fan_out', 10)
        
        k = int(math.sqrt(total_peers) * fan_out_factor)
        
        k = max(min_fan_out, min(k, max_fan_out))
        k = min(k, total_peers)
        
        return k
    
    def select_random_peers(self, k: int, exclude_peers: List[str] = None) -> List[Peer]:
        active_peers = self.peer_manager.get_active_peers()
        
        if exclude_peers:
            active_peers = [p for p in active_peers if p.peer_id not in exclude_peers]
        
        if len(active_peers) <= k:
            return active_peers
        
        return random.sample(active_peers, k)
    
    def has_seen_message(self, msg_id: str) -> bool:
        return msg_id in self.seen_messages
    
    def mark_message_seen(self, msg_id: str, message: GossipMessage = None) -> None:
        self.seen_messages.add(msg_id)
        
        if message:
            self.message_cache[msg_id] = message
        
        if len(self.seen_messages) > 10000:
            self.cleanup_old_messages()
    
    def cleanup_old_messages(self) -> None:
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
        try:
            url = f"{peer.get_url()}/api/v1/network{endpoint}"
            
            headers = {
                'X-Peer-ID': self.peer_manager.local_peer_id or 'UNKNOWN',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(url, json=message, headers=headers, timeout=timeout)
            
            if response.status_code == 200:
                return True
            else:
                print(f"✗ Failed to send to {peer.ip_address}:{peer.port}: HTTP {response.status_code}")
                return False
        
        except requests.exceptions.RequestException as e:
            print(f"✗ Error sending to {peer.ip_address}:{peer.port}: {e}")
            return False
    
    def propagate_transaction(self, tx_data: Dict, exclude_peers: List[str] = None) -> int:
        message = GossipMessage('transaction', tx_data)
        
        tx_hash = tx_data.get('tx_hash')
        if tx_hash and tx_hash in self.known_transactions:
            print(f"⚠ Transaction {tx_hash[:8]}... already known, skipping gossip")
            return 0
        
        if tx_hash:
            self.known_transactions.add(tx_hash)
        
        self.mark_message_seen(message.msg_id, message)
        
        active_peers = self.peer_manager.get_active_peers()
        all_peers = self.peer_manager.get_known_peers(include_inactive=True)
        inactive_peers = [p for p in all_peers if p.status == "INACTIVE"]
        
        print(f"📊 [TX Propagation] Active: {len(active_peers)}, Inactive: {len(inactive_peers)}, Total: {len(all_peers)}")
        
        if len(active_peers) < 3:
            if inactive_peers:
                print(f"→ Low peers ({len(active_peers)} active). Attempting to activate {len(inactive_peers)} INACTIVE peers for gossip...")
                for peer in inactive_peers[:5]:
                    if self.peer_manager.ping_peer(peer):
                        print(f"  ✓ Reactivated peer {peer.ip_address}:{peer.port}")
            
            active_peers = self.peer_manager.get_active_peers()
            print(f"📊 [After Activation] Active peers: {len(active_peers)}")
        
        k = self.calculate_fan_out(len(active_peers))
        
        if k == 0:
            print(f"❌ [TX Propagation FAILED] No peers available for gossip")
            print(f"   Details: active_peers={len(active_peers)}, all_peers={len(all_peers)}")
            if all_peers:
                print(f"   Known peers: {[(p.ip_address, p.port, p.status) for p in all_peers]}")
            return 0
        
        selected_peers = self.select_random_peers(k, exclude_peers)
        
        print(f"→ Gossiping transaction {tx_hash[:8] if tx_hash else 'UNKNOWN'}... to {len(selected_peers)} peers (fan-out={k})")
        for peer in selected_peers:
            print(f"  • {peer.ip_address}:{peer.port} ({peer.status})")
        
        success_count = 0
        for peer in selected_peers:
            if self.send_message_to_peer(peer, '/gossip/transaction', message.to_dict()):
                success_count += 1
        
        print(f"✓ Transaction gossiped to {success_count}/{len(selected_peers)} peers")
        return success_count
    
    def propagate_block(self, block_data: Dict, use_inv: bool = True) -> int:
        block_hash = block_data.get('block_hash')
        block_index = block_data.get('index', 0)
        
        if not block_hash:
            print("✗ Block hash missing, cannot propagate")
            return 0
        
        if block_hash in self.known_blocks:
            print(f"⚠ Block {block_hash[:8]}... already known, skipping gossip")
            return 0
        
        self.known_blocks.add(block_hash)
        
        active_peers = self.peer_manager.get_active_peers()
        all_peers = self.peer_manager.get_known_peers(include_inactive=True)
        
        print(f"📊 [Block Propagation] Block #{block_index}, Active: {len(active_peers)}, Total: {len(all_peers)}")
        
        if not active_peers:
            print(f"❌ [Block Propagation FAILED] No active peers available")
            print(f"   Known peers: {[(p.ip_address, p.port, p.status) for p in all_peers]}")
            return 0
        
        success_count = 0
        
        if use_inv:
            inv_message = GossipMessage('inv', {
                'block_hash': block_hash,
                'block_index': block_index,
                'has_block': True
            })
            
            print(f"→ Sending INV for block {block_hash[:8]}... to {len(active_peers)} peers")
            
            for peer in active_peers:
                if self.send_message_to_peer(peer, '/gossip/inv', inv_message.to_dict()):
                    success_count += 1
        else:
            block_message = GossipMessage('block', block_data)
            
            print(f"→ Broadcasting full block {block_hash[:8]}... to {len(active_peers)} peers")
            
            for peer in active_peers:
                if self.send_message_to_peer(peer, '/gossip/block', block_message.to_dict()):
                    success_count += 1
        
        print(f"✓ Block propagated to {success_count}/{len(active_peers)} peers")
        return success_count
    
    def request_block(self, peer: Peer, block_hash: str) -> Optional[Dict]:
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
    
    def handle_inv_message(self, inv_data: Dict, sender_peer_id: str = None) -> Optional[Dict]:
        block_hash = inv_data.get('block_hash')
        
        if not block_hash:
            print(f"✗ [INV] No block_hash in inventory message")
            return None
        
        if block_hash in self.known_blocks:
            print(f"⚠ Already have block {block_hash[:8]}...")
            return None
        
        if not sender_peer_id:
            print(f"⚠ [INV] Block {block_hash[:8]}... received but sender_peer_id is missing, cannot request full block")
            return None
        
        print(f"→ [INV] Requesting block {block_hash[:8]}... from peer {sender_peer_id[:8]}...")
        
        sender_peer = self.peer_manager.peers.get(sender_peer_id)
        if not sender_peer:
            print(f"✗ [INV] Sender peer {sender_peer_id[:8] if sender_peer_id else 'UNKNOWN'}... not found in peer list")
            return None
        
        block_data = self.request_block(sender_peer, block_hash)
        
        if block_data:
            self.known_blocks.add(block_hash)
            print(f"✓ [INV] Block {block_hash[:8]}... received successfully")
        
        return block_data
    
    def _process_validator_activation(self, tx: 'Transaction') -> None:
        try:
            payload = tx.payload
            
            public_key = payload.get("public_key")
            ip_address = payload.get("ip_address")
            port = payload.get("port")
            
            if not public_key or not ip_address or not port:
                print(f"⚠ Incomplete activation payload: pubkey={bool(public_key)}, ip={bool(ip_address)}, port={bool(port)}")
                return
            
            import hashlib
            peer_id = hashlib.sha256(f"{ip_address}:{port}".encode()).hexdigest()[:16]
            
            print(f"→ Updating peer {peer_id}... with public_key={public_key[:16]}...")
            
            from app.repositories.PeerRepository import PeerRepository
            
            success = PeerRepository.update_peer_public_key_and_activate(
                peer_id=peer_id,
                ip_address=ip_address,
                port=port,
                public_key=public_key
            )
            
            if success:
                print(f"✓ Peer {peer_id}... activated and saved with public_key")
                
                peer = self.peer_manager.peers.get(peer_id)
                if peer:
                    peer.public_key = public_key
                    peer.status = "ACTIVE"
                    self.peer_manager.save_peer_to_db(peer)
                    print(f"✓ Updated in-memory peer {peer_id}... to ACTIVE")
            else:
                print(f"⚠ Failed to update peer {peer_id}... in database")
        
        except Exception as e:
            print(f"✗ Error processing validator activation: {e}")
            import traceback
            traceback.print_exc()
    
    def receive_transaction(self, tx_data: Dict, sender_peer_id: str = None) -> bool:
        tx_hash = tx_data.get('tx_hash')
        
        if not tx_hash:
            print("✗ Transaction hash missing")
            return False
        
        if tx_hash in self.known_transactions:
            print(f"⚠ Transaction {tx_hash[:8]}... already in mempool")
            return False
        
        self.known_transactions.add(tx_hash)
        
        from app.models.Transaction import Transaction
        from app.services.TransactionService import TransactionService
        from app.services.BlockChainService import BlockChainService
        from app.blockchain_instance import get_blockchain_instance
        from app.repositories.TransactionRepository import TransactionRepository
        
        try:
            tx = Transaction.from_dict(tx_data)
            
            if not TransactionService.is_valid(tx):
                payload_op = tx.payload.get("op") if isinstance(tx.payload, dict) else None
                
                print(f"✗ Invalid transaction signature: {tx_hash[:8]}...")
                print(f"  op={payload_op}, sender_address={tx.sender_address}, sender_pubkey={tx.sender_pubkey[:16] if tx.sender_pubkey else 'None'}..., signature={'empty' if not tx.signature else tx.signature[:16]}...")
                
                if payload_op in ["account_register", "account_update"]:
                    pubkey_in_payload = tx.payload.get('public_key', 'MISSING')
                    pubkey_display = pubkey_in_payload[:20] + '...' if isinstance(pubkey_in_payload, str) and len(pubkey_in_payload) > 20 else pubkey_in_payload
                    print(f"  [account_op] payload.public_key={pubkey_display}")
                    print(f"  [DEBUG] Payload keys: {list(tx.payload.keys()) if isinstance(tx.payload, dict) else 'NOT_A_DICT'}")
                
                return False
            
            payload_op = tx.payload.get("op") if isinstance(tx.payload, dict) else None
            payload_type_check = isinstance(tx.payload, dict)
            
            if payload_op in ["account_register", "account_update"]:
                print(f"✓ Transaction {tx_hash[:8]}... validated (op={payload_op})")
                print(f"  [account_op] payload_type={type(tx.payload).__name__}, is_dict={payload_type_check}")
                if payload_type_check:
                    print(f"  [account_op] payload={json.dumps(tx.payload, default=str)[:100]}...")
            else:
                print(f"✓ Transaction {tx_hash[:8]}... validated (op={payload_op})")
            
            is_system_tx = tx.sender_address is None or tx.sender_address == "system"
            if is_system_tx and payload_op == "validator_activate":
                print(f"→ Processing validator activation transaction: {tx_hash[:8]}...")
                self._process_validator_activation(tx)
            
            blockchain = get_blockchain_instance()
            
            if payload_op == "account_register":
                from app.services.BlockChainService import BlockChainService as BCS
                BCS.execute_transaction(blockchain, tx)
                print(f"→ [gossip] Executed account_register for {tx.sender_address} before saving TX")
            
            if BlockChainService.add_transaction_to_mempool(blockchain, tx):
                print(f"✓ Transaction {tx_hash[:8]}... added to mempool")
            else:
                print(f"✗ Failed to add transaction {tx_hash[:8]}... to mempool")
                return False
            
            if TransactionRepository.create_transaction(tx):
                print(f"✓ Transaction {tx_hash[:8]}... saved to database (op={payload_op})")
            else:
                print(f"⚠ Warning: Failed to save transaction {tx_hash[:8]}... to database (op={payload_op}), but still in mempool")
        
        except Exception as e:
            print(f"✗ Error processing transaction: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        exclude = [sender_peer_id] if sender_peer_id else []
        self.propagate_transaction(tx_data, exclude_peers=exclude)
        
        return True
    
    def receive_block(self, block_data: Dict, sender_peer_id: str = None) -> bool:
        block_hash = block_data.get('block_hash')
        block_id = block_data.get('block_id')
        block_index = block_data.get('index', 0)
        
        if not block_id:
            print("✗ Block ID missing")
            return False
        
        if block_id in self.known_blocks:
            print(f"⚠ Block {block_id} already processed")
            return False
        
        if block_hash and block_hash in self.known_blocks:
            print(f"⚠ Block hash {block_hash[:8]}... already known")
            return False
        
        try:
            from app.database.connection import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT block_id FROM block WHERE index_num = ?', (block_index,))
            existing = cursor.fetchone()
            conn.close()
            
            if existing:
                existing_block_id = existing[0]
                if existing_block_id == block_id:
                    print(f"⚠ Block {block_id} already in DB, skipping")
                    return False
                else:
                    print(f"\n{'='*60}")
                    print(f"🔴 FORK DETECTED at block index {block_index}!")
                    print(f"{'='*60}")
                    print(f"  Incoming: block_id={block_id}, hash={block_hash[:16] if block_hash else 'NONE'}...")
                    print(f"  Existing: block_id={existing_block_id} (already in DB)")
                    print(f"  Action: Rejecting incoming block to maintain fork-free state")
                    print(f"{'='*60}\n")
                    return False
        except Exception as e:
            print(f"⚠ Could not check DB for fork: {e}")
        
        self.known_blocks.add(block_id)
        if block_hash:
            self.known_blocks.add(block_hash)
        
        from app.models.Block import Block
        from app.services.BlockService import BlockService
        from app.services.BlockChainService import BlockChainService
        from app.repositories.BlockRepository import BlockRepository
        from app.repositories.TransactionRepository import TransactionRepository
        from app.blockchain_instance import get_blockchain_instance
        
        try:
            block = Block.from_dict(block_data)
            blockchain = get_blockchain_instance()
            
            try:
                from app.blockchain_instance import get_local_db_height
                local_height = get_local_db_height()
                if local_height < 0:
                    local_height = len(blockchain.chain) - 1
            except Exception:
                local_height = len(blockchain.chain) - 1
            
           
            if block.index <= local_height:
                print(f"⚠ Block #{block.index} already exists in chain (local height: {local_height})")
                return True
            
            block_gap = block.index - local_height
            
            if block_gap > 1:
                print(f"⚠️  [GOSSIP] Block gap detected: received block #{block.index} but local height is {local_height} (gap={block_gap})")
                print(f"→ [GOSSIP] Triggering chain sync to fill {block_gap} missing block(s)...")
                
                try:
                    from network.chain_sync import ChainSync
                    chain_sync = ChainSync(
                        peer_manager=self.peer_manager,
                        blockchain=blockchain
                    )
                    synced = chain_sync.sync()
                    if synced > 0:
                        print(f"✅ [GOSSIP] Filled {synced} missing blocks via sync")
                except Exception as sync_err:
                    print(f"⚠️  [GOSSIP] Sync error: {sync_err}, continuing with gossip block...")
            
            if not BlockService.verify_block(block, block.block_header.validator_pubkey):
                print(f"✗ Block {block_hash[:8]}... has invalid signature")
                return False
            
            
            calculated_merkle = BlockService.calculate_merkle_root(block.transactions)
            if calculated_merkle != block.block_header.merkle_root:
                print(f"✗ Merkle root mismatch for block {block_hash[:8]}...")
                return False
            
            if not block.block_hash or block.block_hash == "":
                block.block_hash = BlockService.calculate_hash(block)
                print(f"→ [GOSSIP] Calculated block_hash for {block_hash[:8]}... (was empty)")
            
            if len(blockchain.chain) > 0:
                last_block = blockchain.get_last_block()
                
                print(f"[DEBUG] Validating block continuity:")
                print(f"  New block index: {block.index}, prev_hash: {block.block_header.pre_hash[:16]}...")
                print(f"  Last block index: {last_block.index}, hash: {last_block.block_hash[:16]}...")
                
                if not BlockChainService.is_valid_new_block(blockchain, block, last_block):
                    print(f"✗ Block {block_hash[:8]}... validation failed")
                    print(f"  Index mismatch: {block.index} vs {last_block.index + 1}")
                    print(f"  Hash mismatch: {block.block_header.pre_hash[:16]}... vs {last_block.block_hash[:16]}...")
                    return False
            
            print(f"→ [SYNC] Executing {len(block.transactions)} transactions from block {block_hash[:8]}...")
            execution_errors = 0
            for tx in block.transactions:
                success = BlockChainService.execute_transaction(blockchain, tx)
                if not success:
                    print(f"  ⚠ Transaction execution failed: {tx.tx_hash[:8]}... (op={tx.payload.get('op') if isinstance(tx.payload, dict) else 'UNKNOWN'})")
                    execution_errors += 1
                else:
                    payload_op = tx.payload.get("op") if isinstance(tx.payload, dict) else None
                    if payload_op == "account_register":
                        address = tx.payload.get("address", "UNKNOWN") if isinstance(tx.payload, dict) else "UNKNOWN"
                        print(f"  ✓ account_register executed: {address}")
                    elif payload_op == "validator_activate":
                        ip_address = tx.payload.get("ip_address", "UNKNOWN") if isinstance(tx.payload, dict) else "UNKNOWN"
                        print(f"  ✓ validator_activate executed: {ip_address}")
            
            if execution_errors > 0:
                print(f"⚠️  [SYNC] {execution_errors}/{len(block.transactions)} transaction executions failed")
            
            print(f"→ Persisting block {block_hash[:8]}... to database")
            BlockRepository.create_block(block)
            
            for tx in block.transactions:
                if not tx.block_id:
                    tx.block_id = block.block_id
                    tx.tx_status = "COMMITTED"
                
                existing_tx = TransactionRepository.get_transaction_by_hash(tx.tx_hash)
                if existing_tx:
                    if not existing_tx.block_id:
                        TransactionRepository.update_transaction_block_id(tx.tx_hash, block.block_id)
                else:
                    TransactionRepository.create_transaction(tx)
            
            print(f"✓ Block persisted to database")
            
            print(f"→ Adding block {block_hash[:8]}... to local chain")
            blockchain.chain.append(block)
            print(f"✓ Block added to local chain")
            
            included_tx_hashes = {tx.tx_hash for tx in block.transactions}
            blockchain.mempool = [tx for tx in blockchain.mempool if tx.tx_hash not in included_tx_hashes]
            
            print(f"✓ Block {block_hash[:8]}... verified and committed (index={block.index})")
        
        except Exception as e:
            print(f"✗ Failed to process block: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        exclude = [sender_peer_id] if sender_peer_id else []
        active_peers = self.peer_manager.get_active_peers()
        selected_peers = [p for p in active_peers if p.peer_id not in exclude]
        
        block_message = GossipMessage('block', block_data)
        for peer in selected_peers:
            self.send_message_to_peer(peer, '/gossip/block', block_message.to_dict())
        
        return True


if __name__ == "__main__":
    from network.peer_manager import PeerManager
    
    peer_manager = PeerManager()
    gossip = GossipProtocol(peer_manager)
    
    print("\n=== Testing Gossip Protocol ===")
    
    for n in [5, 10, 20, 50, 100]:
        k = gossip.calculate_fan_out(n)
        print(f"N={n} peers → fan-out k={k}")
    
    print("\n=== Test Transaction Gossip ===")
    test_tx = {
        'tx_hash': 'abc123',
        'sender': 'addr1',
        'recipient': 'addr2',
        'amount': 100
    }
    gossip.propagate_transaction(test_tx)
