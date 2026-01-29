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
    
    Args:
        super_validator_pubkey: Public key of the super validator
        
    Returns:
        BlockChain: The initialized blockchain instance
    """
    from app.services.BlockChainService import BlockChainService
    
    blockchain = get_blockchain_instance()
    
    # Only create genesis if chain is empty
    if len(blockchain.chain) == 0 and super_validator_pubkey:
        BlockChainService.create_genesis_block(blockchain, super_validator_pubkey)
        print(f"✓ Genesis block created with validator: {super_validator_pubkey[:16]}...")
    
    return blockchain


def reset_blockchain() -> None:
    """Reset the blockchain instance (for testing purposes)"""
    global _blockchain_instance
    _blockchain_instance = None
    print("✓ Blockchain instance reset")
