"""
Blockchain Singleton Instance Manager
Provides global access to the blockchain instance for P2P network integration
"""
from typing import Optional
from app.models.BlockChain import BlockChain


# Global blockchain instance
_blockchain_instance: Optional[BlockChain] = None


def get_blockchain_instance() -> BlockChain:
    """
    Get the global blockchain instance (singleton pattern)
    
    Returns:
        BlockChain: The global blockchain instance
    """
    global _blockchain_instance
    
    if _blockchain_instance is None:
        _blockchain_instance = BlockChain()
        print("✓ Blockchain instance created")
    
    return _blockchain_instance


def initialize_blockchain(super_validator_pubkey: str = None) -> BlockChain:
    """
    Initialize the global blockchain instance with genesis block
    Creates genesis block, saves to DB, and broadcasts to peers
    
    Args:
        super_validator_pubkey: Public key of the super validator
        
    Returns:
        BlockChain: The initialized blockchain instance
    """
    from app.services.BlockChainService import BlockChainService
    from app.repositories.BlockRepository import BlockRepository
    from app.repositories.TransactionRepository import TransactionRepository
    from app.models.Transaction import Transaction
    import datetime
    
    blockchain = get_blockchain_instance()
    
    # Only create genesis if chain is empty
    if len(blockchain.chain) == 0 and super_validator_pubkey:
        # Step 0: Check if genesis block already exists in database
        print("→ Checking if genesis block already exists in database...")
        existing_genesis = BlockRepository.get_block_by_id("GENESIS")
        
        if existing_genesis:
            print(f"✓ Genesis block already exists in database (index={existing_genesis.index})")
            blockchain.chain.append(existing_genesis)
            blockchain.super_validator_pubkey = super_validator_pubkey
            blockchain.authority_set.add(super_validator_pubkey)
            return blockchain
        
        # Step 1: Create genesis block in memory
        genesis_block = BlockChainService.create_genesis_block(blockchain, super_validator_pubkey)
        

        print("→ Saving genesis block to database...")
        try:
            from app.database.connection import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            
            # Insert block header
            cursor.execute('''
                INSERT INTO block_header (index_num, pre_hash, merkle_root, validator_pubkey, timestamp)
                VALUES (?, ?, ?, ?, ?)
            ''', (genesis_block.index, genesis_block.block_header.pre_hash, 
                  genesis_block.block_header.merkle_root, genesis_block.block_header.validator_pubkey,
                  genesis_block.block_header.timestamp))
            
            header_id = cursor.lastrowid
            
            # Insert block (genesis block)
            cursor.execute('''
                INSERT INTO block (block_id, index_num, header_id, block_hash, validator_signature)
                VALUES (?, ?, ?, ?, ?)
            ''', (genesis_block.block_id, genesis_block.index, header_id, 
                  genesis_block.block_hash, genesis_block.validator_signature))
            
            conn.commit()
            conn.close()
            print(f"✓ Genesis block saved to database")
        except Exception as e:
            print(f"⚠ Failed to save genesis block to database: {e}")
        
        # Step 2: Save genesis transaction (inside genesis block) to database
        print("→ Saving genesis block transaction to database...")
        try:
            # Get the genesis transaction from the genesis block
            genesis_tx = genesis_block.transactions[0]  # The one created in create_genesis_block
            
            TransactionRepository.create_transaction(genesis_tx)
            print(f"✓ Genesis transaction saved to database (tx_hash={genesis_tx.tx_hash[:16]}...)")
            try:
                from app.services.NetworkService import get_network_service
                network_service = get_network_service()
                propagated = network_service.broadcast_transaction(genesis_tx.to_dict())
                print(f"✓ Genesis block broadcast to {propagated} peers")
               
            except Exception as bcast_err:
                print(f"⚠ Failed to broadcast genesis block: {bcast_err}")
        except Exception as tx_err:
            print(f"⚠ Failed to save genesis transaction: {tx_err}")
            import traceback
            traceback.print_exc()
    
    return blockchain


def reset_blockchain() -> None:
    """Reset the blockchain instance (for testing purposes)"""
    global _blockchain_instance
    _blockchain_instance = None
    print("✓ Blockchain instance reset")
