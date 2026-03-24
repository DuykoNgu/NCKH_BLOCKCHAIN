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
    
    def activate(self, raw_private_key: str) -> bool:
        """
        Activate validator with decrypted private key
        
        Args:
            raw_private_key: Decrypted private key (hex string)
            
        Returns:
            True if activation successful, False otherwise
        """
        if self.is_active:
            print("⚠ Validator is already active")
            return True
        
        try:
            # Store private key in memory
            self.__private_key = raw_private_key
            self.is_active = True
            
            # Start mining worker
            self.start()
            
            print("✓ Validator activated successfully")
            return True
        except Exception as e:
            print(f"✗ Failed to activate validator: {e}")
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
        if self.is_running:
            print("⚠ Validator worker is already running")
            return
        
        self.is_running = True
        self.worker_thread = threading.Thread(target=self._run, daemon=True)
        self.worker_thread.start()
        
        print(f"✓ Validator Worker started (index={self.my_index}/{self.total_validators})")
        print(f"  Public Key: {self.public_key[:32]}...")
        print(f"  Slot Duration: {self.slot_duration}s")
    
    def stop(self) -> None:
        """Stop the validator worker"""
        if not self.is_running:
            print("⚠ Validator worker is not running")
            return
        
        self.is_running = False
        
        if self.worker_thread:
            self.worker_thread.join(timeout=10)
        
        print(f"✓ Validator Worker stopped (mined {self.blocks_mined} blocks)")
    
    def _run(self) -> None:
        """Main worker loop - runs in background thread"""
        print(f"🚀 Validator Worker running...")
        
        while self.is_running:
            try:
                # Check if it's my turn to create a block
                if self.consensus_timer.is_my_turn(self.my_index, self.total_validators):
                    self._mine_and_broadcast_block()
                    
                    # Wait for next slot to avoid mining multiple blocks in same slot
                    self.consensus_timer.wait_for_next_slot()
                else:
                    # Not my turn, sleep briefly and check again
                    time.sleep(0.5)
            
            except Exception as e:
                print(f"✗ Validator worker error: {e}")
                import traceback
                traceback.print_exc()
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
            
            slot_info = self.consensus_timer.get_slot_info(self.total_validators)
            
            print(f"\n{'='*60}")
            print(f"🟢 MY TURN! Mining block(s)...")
            print(f"  Slot: {slot_info['current_slot']}")
            print(f"  Leader Index: {slot_info['leader_index']}")
            print(f"  Mempool Size: {len(self.blockchain.mempool)} transactions")
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
                block = BlockChainService.mine_block(
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
                
                # Add block to local blockchain (this removes included transactions from mempool)
                BlockChainService.add_block(self.blockchain, block)
                
                # Save to database
                from app.repositories.BlockRepository import BlockRepository
                from app.repositories.TransactionRepository import TransactionRepository
                
                BlockRepository.create_block(block)
                for tx in block.transactions:
                    tx.block_id = block.block_id
                    TransactionRepository.create_transaction(tx)
                
                print(f"✓ Block saved to database")
                
                # Broadcast block to P2P network
                propagated = self.network_service.broadcast_block(block.to_dict(), use_inv=True)
                
                print(f"✓ Block propagated to {propagated} peers")
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
