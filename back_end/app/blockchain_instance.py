"""
Blockchain Singleton Instance Manager
Provides global access to the blockchain instance for P2P network integration
"""
from typing import Optional, List
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


def initialize_blockchain(super_validator_pubkey: str = None, listen_port: int = 5000, seed_nodes: list = None) -> BlockChain:
    """
    Initialize the global blockchain instance with genesis block
    
    Logic:
    - If genesis exists in DB: Load it (shared genesis)
    - If genesis doesn't exist:
      - If this node IS a seed node: Create genesis (only seed node creates)
      - If this node is NOT a seed node: Fetch genesis from seed node
    
    Args:
        super_validator_pubkey: Public key of the super validator
        listen_port: Port this node is listening on (to identify if it's a seed node)
        seed_nodes: List of seed nodes from config
        
    Returns:
        BlockChain: The initialized blockchain instance
    """
    from app.services.BlockChainService import BlockChainService
    from app.repositories.BlockRepository import BlockRepository
    from app.repositories.TransactionRepository import TransactionRepository
    from app.models.Transaction import Transaction
    import datetime
    
    # DEBUG LOGGING
    print(f"\n=== GENESIS BLOCK INITIALIZATION DEBUG ===")
    print(f"listen_port: {listen_port}")
    print(f"seed_nodes: {seed_nodes}")
    print(f"seed_nodes type: {type(seed_nodes)}")
    if seed_nodes:
        print(f"seed_nodes count: {len(seed_nodes)}")
        for i, seed in enumerate(seed_nodes):
            print(f"  seed[{i}]: port={seed.get('port')}, ip={seed.get('ip')}")
    else:
        print(f"seed_nodes is EMPTY or None!")
    print(f"========================================\n")
    
    blockchain = get_blockchain_instance()
    
    # Only process if chain is empty
    if len(blockchain.chain) == 0 and super_validator_pubkey:
        # Step 0: Check if genesis block already exists in database (shared genesis)
        print("→ Checking if genesis block already exists in database...")
        existing_genesis = BlockRepository.get_block_by_id("GENESIS")
        
        if existing_genesis:
            print(f"✓ Genesis block already exists in database (index={existing_genesis.index})")
            blockchain.super_validator_pubkey = super_validator_pubkey
            blockchain.authority_set.add(super_validator_pubkey)
            
            # 🔥 Load FULL chain from DB (not just genesis) to restore RAM state on restart
            print("→ Loading full chain from database into memory...")
            load_chain_from_db(blockchain)
            print(f"✓ Chain restored: {len(blockchain.chain)} block(s) loaded from DB")
            
            return blockchain
        
        # Step 1: Determine if this node is a seed node
        is_seed_node = False
        print(f"→ [DEBUG] Determining if node is seed node...")
        print(f"  listen_port={listen_port}, seed_nodes={seed_nodes}")
        
        if seed_nodes:
            print(f"  Checking {len(seed_nodes)} seed nodes...")
            for seed in seed_nodes:
                seed_port = seed.get('port')
                print(f"    Comparing: listen_port={listen_port} vs seed_port={seed_port}")
                if seed_port == listen_port:
                    is_seed_node = True
                    print(f"    ✓ MATCH! This node is a SEED NODE (port {listen_port})")
                    break
        else:
            print(f"  seed_nodes is empty/None - cannot determine seed node")
        
        print(f"  Final: is_seed_node={is_seed_node}")
        
        if is_seed_node:
            print(f"✓ This node is a SEED NODE (port {listen_port})")
        
        if not is_seed_node and seed_nodes:
            # This is not a seed node - try to fetch genesis from seed nodes
            print(f"→ This is a non-seed node. Attempting to fetch genesis block from seed node...")
            genesis_fetched = _fetch_genesis_from_seed_node(blockchain, super_validator_pubkey, seed_nodes)
            if genesis_fetched:
                print(f"✓ Genesis block fetched and initialized from seed node")
                print(f"✓ Chain now has {len(blockchain.chain)} block(s)")
                return blockchain
            else:
                print(f"⚠ ERROR: Could not fetch genesis from any seed node!")
                print(f"⚠ This node cannot continue without genesis from seed node.")
                print(f"⚠ Make sure seed node is running and accessible.")
 # Exit with error - cannot proceed without genesis
        
        # At this point: either is_seed_node=True OR seed_nodes is empty
        # Step 2: Create genesis block (only seed node or standalone mode)
        print("→ Creating genesis block...")
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
        
        # Step 3: Save genesis transaction (inside genesis block) to database
        print("→ Saving genesis block transaction to database...")
        try:
            # Get the genesis transaction from the genesis block
            genesis_tx = genesis_block.transactions[0]  # The one created in create_genesis_block
            
            TransactionRepository.create_transaction(genesis_tx)
            print(f"✓ Genesis transaction saved to database (tx_hash={genesis_tx.tx_hash[:16]}...)")
            
            # Broadcast genesis to peers
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


def _fetch_genesis_from_seed_node(blockchain: BlockChain, super_validator_pubkey: str, seed_nodes: list) -> bool:
    """
    Fetch genesis block and transactions from a seed node
    
    Args:
        blockchain: The blockchain instance to populate
        super_validator_pubkey: Public key of validator
        seed_nodes: List of seed nodes to try
        
    Returns:
        bool: True if genesis was successfully fetched, False otherwise
    """
    from app.services.BlockChainService import BlockChainService
    from app.repositories.BlockRepository import BlockRepository
    from app.repositories.TransactionRepository import TransactionRepository
    import requests
    
    for seed in seed_nodes:
        try:
            seed_ip = seed.get('ip', '127.0.0.1')
            seed_port = seed.get('port', 5001)
            seed_name = seed.get('name', f'{seed_ip}:{seed_port}')
            
            print(f"  → Trying seed node: {seed_name}")
            
            # Request genesis block from seed node
            url = f"http://{seed_ip}:{seed_port}/api/v1/block/genesis"
            print(f"    → GET {url}")
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                print(f"    ✓ Response status 200")
                genesis_data = response.json()
                print(f"    → Genesis data received, block_id: {genesis_data.get('block_id')}")
                
                # Create block from received data
                genesis_block = _create_genesis_from_dict(genesis_data, super_validator_pubkey)
                
                if genesis_block is None:
                    print(f"    ✗ Failed to create genesis block object from seed data")
                    continue
                
                # Save to database
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
                    
                    # Insert block
                    cursor.execute('''
                        INSERT INTO block (block_id, index_num, header_id, block_hash, validator_signature)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (genesis_block.block_id, genesis_block.index, header_id, 
                          genesis_block.block_hash, genesis_block.validator_signature))
                    
                    # Insert transactions using same connection to avoid lock
                    for tx in genesis_block.transactions:
                        TransactionRepository.create_transaction(tx, conn=conn)
                    
                    conn.commit()
                    conn.close()
                    
                    # Add to blockchain
                    blockchain.chain.append(genesis_block)
                    blockchain.super_validator_pubkey = super_validator_pubkey
                    blockchain.authority_set.add(super_validator_pubkey)
                    
                    print(f"    ✓ Genesis block fetched and saved from {seed_name}")
                    return True
                except Exception as e:
                    print(f"    ✗ Failed to save genesis from {seed_name}: {e}")
                    import traceback
                    traceback.print_exc()
                    continue
            else:
                print(f"    ✗ Seed node {seed_name} returned status {response.status_code}")
                print(f"      Response text: {response.text[:200]}")
        except Exception as e:
            print(f"    ✗ Could not connect to seed node {seed_name}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    return False


def _create_genesis_from_dict(data: dict, validator_pubkey: str):
    """Reconstruct Genesis block from dict received from seed node"""
    from app.models.Block import Block
    from app.models.BlockHeader import BlockHeader
    from app.models.Transaction import Transaction
    import json
    
    try:
        # Reconstruct block header
        header_data = data.get('block_header', {})
        print(f"    → Reconstructing block header from seed node data...")
        header = BlockHeader(
            index=header_data.get('index', 0),
            pre_hash=header_data.get('pre_hash', ''),
            merkle_root=header_data.get('merkle_root', ''),
            validator_pubkey=header_data.get('validator_pubkey', validator_pubkey),
            timestamp=header_data.get('timestamp', 0)
        )
        print(f"    ✓ Block header reconstructed")
        
        # Reconstruct transactions
        transactions = []
        tx_count = len(data.get('transactions', []))
        print(f"    → Reconstructing {tx_count} transaction(s)...")
        for tx_data in data.get('transactions', []):
            tx = Transaction(
                tx_id=tx_data.get('tx_id', ''),
                tx_hash=tx_data.get('tx_hash', ''),
                sender_pubkey=tx_data.get('sender_pubkey', ''),
                sender_address=tx_data.get('sender_address'),
                recipient_address=tx_data.get('recipient_address', ''),
                payload=tx_data.get('payload', {}),
                signature=tx_data.get('signature', ''),
                timestamp=tx_data.get('timestamp', 0),
                block_id=tx_data.get('block_id', 'GENESIS'),
                tx_status=tx_data.get('tx_status', 'COMMITTED'),
                error_reason=tx_data.get('error_reason', '')
            )
            transactions.append(tx)
        print(f"    ✓ All {tx_count} transaction(s) reconstructed")
        
        # Create block
        print(f"    → Creating block object...")
        block = Block(
            block_id=data.get('block_id', 'GENESIS'),
            index=data.get('index', 0),
            block_header=header,
            transactions=transactions
        )
        block.block_hash = data.get('block_hash', '')
        block.validator_signature = data.get('validator_signature', '')
        print(f"    ✓ Block object created successfully (id={block.block_id}, index={block.index})")
        
        return block
    except Exception as e:
        print(f"  ✗ Failed to create genesis from data: {e}")
        import traceback
        traceback.print_exc()
        return None


def load_chain_from_db(blockchain: BlockChain) -> int:
    """
    Load all blocks from DB into blockchain.chain (RAM).
    Called on node restart so that get_local_height() returns the correct
    persisted height instead of 0.
    
    Returns:
        Number of blocks loaded
    """
    from app.repositories.BlockRepository import BlockRepository
    
    try:
        # Query all block IDs ordered by index
        from app.database.connection import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT block_id FROM block ORDER BY index_num ASC')
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            print("⚠ No blocks found in DB to load")
            return 0
        
        # Clear chain and reload entirely from DB
        blockchain.chain.clear()
        loaded = 0
        
        for (block_id,) in rows:
            block = BlockRepository.get_block_by_id(block_id)
            if block:
                blockchain.chain.append(block)
                loaded += 1
            else:
                print(f"⚠ Could not load block_id={block_id} from DB, stopping chain load")
                break
        
        print(f"✓ load_chain_from_db: loaded {loaded} block(s) from DB (height={loaded - 1})")
        return loaded
    
    except Exception as e:
        print(f"✗ load_chain_from_db error: {e}")
        import traceback
        traceback.print_exc()
        return 0


def get_local_db_height() -> int:
    """
    Get the current blockchain height by querying the database directly.
    This is the reliable source of truth — works even after node restart
    when blockchain.chain may not be fully loaded.
    
    Returns:
        Height (max index_num) or -1 if no blocks exist
    """
    try:
        from app.database.connection import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT MAX(index_num) FROM block')
        row = cursor.fetchone()
        conn.close()
        
        if row and row[0] is not None:
            return int(row[0])
        return -1
    except Exception as e:
        print(f"✗ get_local_db_height error: {e}")
        return -1


def reset_blockchain() -> None:
    """Reset the blockchain instance (for testing purposes)"""
    global _blockchain_instance
    _blockchain_instance = None
    print("✓ Blockchain instance reset")
