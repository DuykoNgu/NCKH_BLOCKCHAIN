"""
Chain Synchronization Protocol for EduChain
Syncs blockchain data from peers when a node starts up or falls behind
"""
import time
import requests
from typing import List, Dict, Optional

from network.peer_manager import PeerManager, Peer
from network.config_loader import get_config


class ChainSync:
    """
    Handles blockchain synchronization between nodes.
    
    On startup, a node needs to:
    1. Query peers for their chain height
    2. Compare with local chain height
    3. Download missing blocks from the peer with the longest valid chain
    4. Validate and add each block to the local chain
    """
    
    def __init__(self, peer_manager: PeerManager, blockchain):
        self.peer_manager = peer_manager
        self.blockchain = blockchain
        self.config = get_config()
    
    def get_local_height(self) -> int:
        """Get local blockchain height"""
        return len(self.blockchain.chain) - 1  # -1 because genesis is index 0
    
    def query_peer_height(self, peer: Peer, timeout: int = 5) -> Optional[int]:
        """
        Query a peer for its blockchain height
        
        Args:
            peer: Peer to query
            timeout: Request timeout in seconds
            
        Returns:
            Chain height or None if query failed
        """
        try:
            url = f"{peer.get_url()}/api/v1/network/blocks/height"
            response = requests.get(url, timeout=timeout)
            
            if response.status_code == 200:
                data = response.json()
                return data.get('height', 0)
            else:
                print(f"✗ Failed to get height from {peer.ip_address}:{peer.port}: "
                      f"HTTP {response.status_code}")
                return None
        
        except requests.exceptions.RequestException as e:
            print(f"✗ Error querying height from {peer.ip_address}:{peer.port}: {e}")
            return None
    
    def find_best_peer(self) -> Optional[tuple]:
        """
        Find the peer with the longest chain
        
        Returns:
            Tuple of (peer, height) or None if no peers available
        """
        active_peers = self.peer_manager.get_active_peers()
        
        if not active_peers:
            print("⚠ No active peers available for chain sync")
            return None
        
        best_peer = None
        best_height = self.get_local_height()
        
        for peer in active_peers:
            height = self.query_peer_height(peer)
            if height is not None and height > best_height:
                best_peer = peer
                best_height = height
                print(f"  Found peer {peer.ip_address}:{peer.port} "
                      f"with height {height}")
        
        if best_peer:
            return (best_peer, best_height)
        
        return None
    
    def download_blocks(self, peer: Peer, start_index: int, end_index: int, 
                        timeout: int = 30) -> Optional[List[Dict]]:
        """
        Download a range of blocks from a peer
        
        Args:
            peer: Peer to download from
            start_index: Starting block index (inclusive)
            end_index: Ending block index (inclusive)
            timeout: Request timeout
            
        Returns:
            List of block dicts or None if download failed
        """
        try:
            url = (f"{peer.get_url()}/api/v1/network/blocks/range"
                   f"?start={start_index}&end={end_index}")
            response = requests.get(url, timeout=timeout)
            
            if response.status_code == 200:
                data = response.json()
                blocks = data.get('blocks', [])
                print(f"✓ Downloaded {len(blocks)} blocks from "
                      f"{peer.ip_address}:{peer.port} "
                      f"(index {start_index}-{end_index})")
                return blocks
            else:
                print(f"✗ Failed to download blocks from "
                      f"{peer.ip_address}:{peer.port}: HTTP {response.status_code}")
                return None
        
        except requests.exceptions.RequestException as e:
            print(f"✗ Error downloading blocks from "
                  f"{peer.ip_address}:{peer.port}: {e}")
            return None
    
    def validate_and_add_block(self, block_data: Dict) -> bool:
        """
        Validate a downloaded block and add it to the local chain
        
        Args:
            block_data: Block dictionary from peer
            
        Returns:
            True if block was added successfully
        """
        from app.models.Block import Block
        from app.services.BlockService import BlockService
        from app.services.BlockChainService import BlockChainService
        from app.repositories.BlockRepository import BlockRepository
        from app.repositories.TransactionRepository import TransactionRepository
        
        try:
            # Parse block
            block = Block.from_dict(block_data)
            
            # 1. Verify validator signature
            if not BlockService.verify_block(block, block.block_header.validator_pubkey):
                print(f"✗ Block #{block.index}: invalid signature")
                return False
            
            # 2. Verify chain continuity (skip for genesis)
            if block.index > 0 and len(self.blockchain.chain) > 0:
                prev_block = self.blockchain.get_last_block()
                if not BlockChainService.is_valid_new_block(
                    self.blockchain, block, prev_block
                ):
                    print(f"✗ Block #{block.index}: chain continuity check failed")
                    return False
            
            # 3. Verify merkle root
            calculated_merkle = BlockService.calculate_merkle_root(block.transactions)
            if calculated_merkle != block.block_header.merkle_root:
                print(f"✗ Block #{block.index}: merkle root mismatch")
                return False
            
            # 4. Add to blockchain
            BlockChainService.add_block(self.blockchain, block)
            
            # 5. Save to database
            try:
                BlockRepository.create_block(block)
                for tx in block.transactions:
                    tx.block_id = block.block_id
                    TransactionRepository.create_transaction(tx)
            except Exception as db_err:
                print(f"⚠ Block #{block.index}: saved to chain but DB error: {db_err}")
            
            return True
        
        except Exception as e:
            print(f"✗ Failed to process block: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def sync(self) -> int:
        """
        Main sync method - synchronize blockchain from peers
        
        Returns:
            Number of blocks synced
        """
        print("\n" + "=" * 50)
        print("🔄 Starting Chain Synchronization")
        print("=" * 50)
        
        local_height = self.get_local_height()
        print(f"  Local chain height: {local_height}")
        
        # Find best peer
        result = self.find_best_peer()
        
        if result is None:
            print("✓ Chain is up to date (no peers have longer chain)")
            return 0
        
        best_peer, remote_height = result
        blocks_needed = remote_height - local_height
        
        print(f"\n→ Syncing {blocks_needed} blocks from "
              f"{best_peer.ip_address}:{best_peer.port}")
        print(f"  Local: {local_height} → Remote: {remote_height}")
        
        # Download blocks in batches
        batch_size = 20
        total_synced = 0
        current_index = local_height + 1
        
        while current_index <= remote_height:
            end_index = min(current_index + batch_size - 1, remote_height)
            
            # Download batch
            blocks = self.download_blocks(best_peer, current_index, end_index)
            
            if blocks is None:
                print(f"✗ Failed to download blocks {current_index}-{end_index}")
                break
            
            # Sort blocks by index to ensure correct order
            blocks.sort(key=lambda b: b.get('index', 0))
            
            # Validate and add each block
            for block_data in blocks:
                if self.validate_and_add_block(block_data):
                    total_synced += 1
                else:
                    block_idx = block_data.get('index', '?')
                    print(f"✗ Sync stopped at block #{block_idx} "
                          f"(validation failed)")
                    break
            else:
                # All blocks in batch were valid, continue
                current_index = end_index + 1
                continue
            
            # If inner loop broke, stop syncing
            break
        
        print(f"\n{'=' * 50}")
        if total_synced > 0:
            print(f"✅ Chain sync complete: {total_synced} blocks synced")
            print(f"  New chain height: {self.get_local_height()}")
        else:
            print("✓ No blocks to sync")
        print("=" * 50 + "\n")
        
        return total_synced
