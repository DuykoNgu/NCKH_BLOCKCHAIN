"""
Validator Worker - Automatic Block Mining Daemon
Monitors consensus timer and creates blocks when it's the validator's turn
"""
import time
import threading
from typing import Optional

from app.services.BlockChainService import BlockChainService
from app.services.NetworkService import get_network_service
from app.blockchain_instance import get_blockchain_instance
from network.ntp_sync import ConsensusTimer
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ValidatorWorker:
    """
    Background worker that automatically mines blocks when it's the validator's turn
    Implements Round Robin PoA consensus
    """
    
    def __init__(
        self, 
        my_validator_index: int,
        total_validators: int,
        public_key: str,
        slot_duration: int = 5
    ):
        """
        Initialize Validator Worker
        
        Args:
            my_validator_index: Index of this validator (0-based)
            total_validators: Total number of validators in the network
            public_key: Public key of this validator (hex string)
            slot_duration: Duration of each slot in seconds (default: 5)
        """
        self.my_index = my_validator_index
        self.total_validators = total_validators
        self.__private_key: Optional[str] = None  # Private key stored securely in memory
        self.public_key = public_key
        self.slot_duration = slot_duration
        self.is_active = False  # Validator activation status
        
        # Get blockchain and network instances
        self.blockchain = get_blockchain_instance()
        self.network_service = get_network_service()
        self.consensus_timer = ConsensusTimer()
        
        # Worker state
        self.is_running = False
        self.worker_thread: Optional[threading.Thread] = None
        
        # Statistics
        self.blocks_mined = 0
        self.last_block_time = 0
        self.last_mine_attempt_time = 0  # Track when we last tried to mine
    
    def activate(self, raw_private_key: str) -> bool:
        """
        Activate validator with decrypted private key
        
        Args:
            raw_private_key: Decrypted private key (hex string)
            
        Returns:
            True if activation successful, False otherwise
        """
        logger.info(f"→ [activate()] Activating validator #{self.my_index}/{self.total_validators}")
        print(f"→ [activate()] Activating validator #{self.my_index}/{self.total_validators}")
        
        if self.is_active:
            logger.warning("⚠ Validator is already active")
            return True
        
        try:
            # Store private key in memory
            logger.info("→ [activate()] Storing private key in memory")
            self.__private_key = raw_private_key
            self.is_active = True
            
            # Start mining worker
            logger.info("→ [activate()] Calling start() to spawn background thread")
            print(f"→ [activate()] Calling start() to spawn background thread")
            self.start()
            
            logger.info(f"✓ Validator activated successfully (is_running={self.is_running}, thread={self.worker_thread})")
            print(f"✓ Validator activated successfully")
            return True
        except Exception as e:
            logger.error(f"✗ Failed to activate validator: {e}")
            print(f"✗ Failed to activate validator: {e}")
            import traceback
            traceback.print_exc()
            logger.error(traceback.format_exc())
            self.__private_key = None
            self.is_active = False
            return False
    
    def deactivate(self) -> None:
        """
        Deactivate validator and clear private key from memory
        """
        if not self.is_active:
            print("⚠ Validator is not active")
            return
        
        # Stop mining worker
        self.stop()
        
        # Securely clear private key from memory
        if self.__private_key:
            self.__private_key = '0' * len(self.__private_key)
            self.__private_key = None
        
        self.is_active = False
        print("✓ Validator deactivated and private key cleared from memory")
    
    def start(self) -> None:
        """Start the validator worker in a background thread"""
        logger.info(f"→ [start()] Attempting to start validator worker (is_running={self.is_running})")
        print(f"→ [start()] Attempting to start validator worker (is_running={self.is_running})")
        
        if self.is_running:
            logger.warning("⚠ Validator worker is already running")
            print("⚠ Validator worker is already running")
            return
        
        logger.info(f"→ [start()] Setting is_running=True")
        self.is_running = True
        
        logger.info(f"→ [start()] Creating daemon thread...")
        self.worker_thread = threading.Thread(target=self._run, daemon=True, name=f"ValidatorWorker-{self.my_index}")
        
        logger.info(f"→ [start()] Calling thread.start()...")
        self.worker_thread.start()
        
        logger.info(f"✓ Validator Worker started (index={self.my_index}/{self.total_validators})")
        logger.info(f"  Public Key: {self.public_key[:32]}...")
        logger.info(f"  Slot Duration: {self.slot_duration}s")
        logger.info(f"  Thread Name: {self.worker_thread.name}")
        logger.info(f"  Thread Alive: {self.worker_thread.is_alive()}")
        logger.info("→ Worker thread is now running in background, monitoring blockchain for mining opportunities")
        
        print(f"✓ Validator Worker started (index={self.my_index}/{self.total_validators})")
        print(f"✓ Thread is now running in background (name={self.worker_thread.name})")
    
    def stop(self) -> None:
        """Stop the validator worker"""
        if not self.is_running:
            print("⚠ Validator worker is not running")
            return
        
        self.is_running = False
        
        if self.worker_thread:
            self.worker_thread.join(timeout=10)
        
        print(f"✓ Validator Worker stopped (mined {self.blocks_mined} blocks)")
    
    def _should_mine_block(self) -> bool:
        """
        Determine if we should attempt to mine a block.
        
        Mining happens when:
        1. Mempool has at least 1 transaction (min_transactions_to_mine)
        
        The max_transactions_per_block is a SIZE LIMIT, not a mining condition.
        We mine immediately when we have transactions, creating multiple blocks if needed.
        
        Returns:
            bool: True if we should mine, False otherwise
        """
        mempool_size = len(self.blockchain.mempool)
        
        # Only condition: Mempool not empty
        if mempool_size > 0:
            logger.info(f"✓ _should_mine_block(): YES - mempool_size={mempool_size} >= 1 (MINE NOW!)")
            return True
        
        # Mempool is empty - wait for transactions
        logger.debug(f"→ _should_mine_block(): SKIP - mempool is empty, waiting for transactions")
        return False
    
    def _run(self) -> None:
        """Main worker loop - runs in background thread"""
        print(f"🚀 Validator Worker running...")
        logger.info(f"🚀 Validator Worker running... (validator #{self.my_index}/{self.total_validators})")
        
        loop_count = 0
        while self.is_running:
            try:
                loop_count += 1
                
                # Check if it's my turn to create a block
                is_my_turn = self.consensus_timer.is_my_turn(self.my_index, self.total_validators)
                
                if is_my_turn:
                    
                    if self._should_mine_block():
                        self.last_mine_attempt_time = time.time()  # Update attempt time
                        logger.info(f"→ [Loop #{loop_count}] MY TURN! Starting to mine block...")
                        self._mine_and_broadcast_block()
                        
                        # Wait for next slot to avoid mining multiple blocks in same slot
                        self.consensus_timer.wait_for_next_slot()
                    else:
                        # Not ready to mine yet, check again soon
                        logger.debug(f"→ [Loop #{loop_count}] MY TURN but mempool not ready, retrying in 1s")
                        time.sleep(1)
                else:
                    # Not my turn, sleep briefly and check again
                    # Only log every 20 loops to avoid spam
                    if loop_count % 20 == 0:
                        slot_info = self.consensus_timer.get_slot_info(self.total_validators)
                        logger.debug(f"→ [Loop #{loop_count}] Not my turn (slot={slot_info['current_slot']}, leader={slot_info['leader_index']}, me={self.my_index})")
                    time.sleep(0.5)
            
            except Exception as e:
                logger.error(f"✗ Validator worker error (Loop #{loop_count}): {e}")
                print(f"✗ Validator worker error: {e}")
                import traceback
                traceback.print_exc()
                logger.error(traceback.format_exc())
                time.sleep(5)  # Wait before retrying
    
    def _mine_and_broadcast_block(self) -> None:
        """Mine a new block and broadcast it to the network"""
        try:
            # Check if validator is active
            if not self.is_active or self.__private_key is None:
                print("⚠ Validator not active, skipping block creation")
                return
            
            # Get max transactions per block from config
            from network.config_loader import get_config
            config = get_config()
            consensus_config = config.get_consensus_config()
            max_tx_per_block = consensus_config.get('max_transactions_per_block', 100)
            mining_timeout = consensus_config.get('mining_timeout_seconds', 30)
            
            slot_info = self.consensus_timer.get_slot_info(self.total_validators)
            
            # 🔥 CRITICAL FIX #1: Wait for gossip propagation
            # When it's my turn, other nodes might have just broadcast their blocks
            # Give them time to reach us (typically 500ms-2s)
            print(f"\n⏳ Waiting 1.5s for gossip propagation of recent blocks...")
            time.sleep(1.5)
            
            # 🔥 CRITICAL FIX #2: Rebuild mempool before mining
            # This removes transactions that were already committed in gossip blocks
            print(f"🔧 Rebuilding mempool to ensure consistency...")
            from app.services.BlockChainService import BlockChainService
            BlockChainService.rebuild_mempool(self.blockchain)
            
            # 🔥 CRITICAL FIX #3: Verify chain is not too far behind
            # If there's a big gap, sync first before mining
            from network.chain_sync import ChainSync
            local_height = len(self.blockchain.chain) - 1
            
            # Query random peers for height
            active_peers = self.network_service.peer_manager.get_active_peers()
            if active_peers:
                import random
                sample_peers = random.sample(active_peers, min(3, len(active_peers)))
                max_peer_height = 0
                
                for peer in sample_peers:
                    try:
                        peer_height = self.network_service.peer_manager.query_peer_height(peer)
                        if peer_height and peer_height > max_peer_height:
                            max_peer_height = peer_height
                    except:
                        pass
                
                if max_peer_height > local_height + 2:
                    print(f"⚠️  Chain gap detected: me={local_height}, peers={max_peer_height}")
                    print(f"→ Syncing chain before mining...")
                    chain_sync = ChainSync(
                        peer_manager=self.network_service.peer_manager,
                        blockchain=self.blockchain
                    )
                    synced = chain_sync.sync()
                    if synced > 0:
                        print(f"✅ Synced {synced} blocks before mining")
                        # Rebuild mempool again after sync
                        BlockChainService.rebuild_mempool(self.blockchain)
            
            mempool_size = len(self.blockchain.mempool)
            
            print(f"\n{'='*60}")
            print(f"🟢 MY TURN! Mining block...")
            print(f"  Slot: {slot_info['current_slot']}")
            print(f"  Leader Index: {slot_info['leader_index']}")
            print(f"  Mempool Size: {mempool_size} transactions")
            print(f"  Max TX per Block: {max_tx_per_block}")
            print(f"{'='*60}")
            
            # Check if there are transactions to mine
            if len(self.blockchain.mempool) == 0:
                print("⚠ No transactions in mempool, skipping block creation")
                return
            
            # Calculate how many blocks we need to create
            total_transactions = len(self.blockchain.mempool)
            blocks_needed = (total_transactions + max_tx_per_block - 1) // max_tx_per_block  # Ceiling division
            
            if blocks_needed > 1:
                print(f"📦 Creating {blocks_needed} blocks to process all {total_transactions} transactions")
            
            blocks_created = 0
            
            # Create multiple blocks if needed
            while len(self.blockchain.mempool) > 0 and blocks_created < blocks_needed:
                blocks_created += 1
                
                print(f"\n--- Block {blocks_created}/{blocks_needed} ---")
                
                # Mine the block with size limit using private key from memory
                block, is_new_block = BlockChainService.mine_block(
                    self.blockchain,
                    self.__private_key,
                    self.public_key,
                    max_transactions=max_tx_per_block
                )
                
                print(f"✓ Block mined:")
                print(f"  Block Hash: {block.block_hash[:32]}...")
                print(f"  Block Index: {block.index}")
                print(f"  Block Size: {block.block_size} transactions")
                print(f"  Merkle Root: {block.block_header.merkle_root[:32]}...")
                print(f"  New Block: {is_new_block}")
                
                # Only add block if it's a NEW block (not already in chain)
                if is_new_block:
                    # Add block to local blockchain (this removes included transactions from mempool)
                    BlockChainService.add_block(self.blockchain, block)
                    
                    # Save to database
                    from app.repositories.BlockRepository import BlockRepository
                    from app.repositories.TransactionRepository import TransactionRepository
                    
                    BlockRepository.create_block(block)
                    for tx in block.transactions:
                        tx.block_id = block.block_id
                        tx.tx_status = "COMMITTED"
                        TransactionRepository.create_transaction(tx)
                    
                    print(f"✓ Block saved to database")
                    
                    # Broadcast block to P2P network
                    propagated = self.network_service.broadcast_block(block.to_dict(), use_inv=True)
                    
                    print(f"✓ Block propagated to {propagated} peers")
                else:
                    # Block was updated (not new), save only newly appended transactions
                    # Transactions that were already in the block (like genesis tx) already have block_id set
                    from app.repositories.TransactionRepository import TransactionRepository
                    
                    # Only save transactions that don't have block_id set yet
                    appended_tx_count = 0
                    for tx in block.transactions:
                        # Skip if transaction already has block_id (genesis tx)
                        if not tx.block_id or tx.block_id == "":
                            tx.block_id = block.block_id
                            tx.tx_status = "COMMITTED"
                            TransactionRepository.create_transaction(tx)
                            appended_tx_count += 1
                    
                    print(f"✓ Block updated ({appended_tx_count} new transaction(s) saved)")
                
                print(f"✓ Remaining in mempool: {len(self.blockchain.mempool)} transactions")
                
                # Update statistics
                self.blocks_mined += 1
                self.last_block_time = time.time()
                
                # Small delay between blocks to allow network propagation
                if len(self.blockchain.mempool) > 0:
                    time.sleep(0.5)
            
            print(f"\n✓ Completed mining {blocks_created} block(s)")
            print(f"✓ Mempool now has {len(self.blockchain.mempool)} transactions")
            print(f"{'='*60}\n")
        
        except Exception as e:
            print(f"✗ Failed to mine and broadcast block: {e}")
            import traceback
            traceback.print_exc()
    
    def get_stats(self) -> dict:
        """Get validator worker statistics"""
        return {
            "is_active": self.is_active,
            "is_running": self.is_running,
            "validator_index": self.my_index,
            "total_validators": self.total_validators,
            "blocks_mined": self.blocks_mined,
            "last_block_time": self.last_block_time,
            "mempool_size": len(self.blockchain.mempool),
            "blockchain_height": len(self.blockchain.chain)
        }


# Global validator worker instance
_validator_worker: Optional[ValidatorWorker] = None


def get_validator_worker() -> Optional[ValidatorWorker]:
    """Get the global validator worker instance"""
    return _validator_worker


def start_validator_worker(
    my_validator_index: int,
    total_validators: int,
    public_key: str
) -> ValidatorWorker:
    """
    Initialize the global validator worker (without activation)
    
    Args:
        my_validator_index: Index of this validator (0-based)
        total_validators: Total number of validators
        public_key: Public key of this validator
        
    Returns:
        ValidatorWorker: The initialized worker instance (not yet activated)
    """
    global _validator_worker
    
    if _validator_worker is not None:
        print("⚠ Validator worker already exists, stopping old one...")
        _validator_worker.stop()
    
    _validator_worker = ValidatorWorker(
        my_validator_index=my_validator_index,
        total_validators=total_validators,
        public_key=public_key
    )
    
    print("✓ Validator worker initialized (not yet activated)")
    print("  Use POST /api/v1/auth/activate to activate with passphrase")
    
    return _validator_worker


def stop_validator_worker() -> None:
    """Stop the global validator worker"""
    global _validator_worker
    
    if _validator_worker is not None:
        _validator_worker.stop()
        _validator_worker = None
