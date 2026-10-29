from typing import Optional, List
from app.models.BlockChain import BlockChain


_blockchain_instance: Optional[BlockChain] = None


def get_blockchain_instance() -> BlockChain:
    global _blockchain_instance
    
    if _blockchain_instance is None:
        _blockchain_instance = BlockChain()
        print("✓ Blockchain instance created")
    
    return _blockchain_instance


def _check_moet_pin(moet_pubkey: str) -> bool:
    from network.config_loader import get_config
    pinned = get_config().get_moet_public_key()
    if pinned and pinned != moet_pubkey:
        print(f"✗ Genesis của MOET ({moet_pubkey[:16]}...) không khớp moet_public_key trong config ({pinned[:16]}...)")
        return False
    return True


def initialize_blockchain(own_pubkey: str, is_moet: bool, seed_nodes: list = None) -> BlockChain:
    from app.services.BlockChainService import BlockChainService
    from app.repositories.BlockRepository import BlockRepository
    from app.repositories.TransactionRepository import TransactionRepository
    import time
    
    blockchain = get_blockchain_instance()
    
    if len(blockchain.chain) == 0:
        if BlockRepository.get_block_by_id("GENESIS"):
            print("→ Loading chain from database...")
            load_chain_from_db(blockchain)
            BlockChainService.rebuild_authority_set(blockchain)
            if not _check_moet_pin(blockchain.super_validator_pubkey):
                raise RuntimeError("Chain trong DB không thuộc mạng đã cấu hình")
            print(f"✓ Chain restored: {len(blockchain.chain)} block(s)")
            return blockchain
        
        if not is_moet:
            if not seed_nodes:
                raise RuntimeError("Node không phải MOET cần seed node để lấy genesis (SEED_NODES / config.json)")
            while not _fetch_genesis_from_seed_node(blockchain, seed_nodes):
                print("⏳ Chưa lấy được genesis từ seed node, thử lại sau 5s...")
                time.sleep(5)
            BlockChainService.rebuild_authority_set(blockchain)
            print(f"✓ Genesis fetched from seed node (MOET = {blockchain.super_validator_pubkey[:16]}...)")
            return blockchain
        
        if not own_pubkey:
            raise RuntimeError("Node MOET cần keystore để tạo genesis")
        if not _check_moet_pin(own_pubkey):
            raise RuntimeError("Keystore của node MOET không khớp moet_public_key trong config")
        
        print("→ Creating genesis block...")
        genesis_block = BlockChainService.create_genesis_block(blockchain, own_pubkey)
        
        print("→ Saving genesis block to database...")
        try:
            from app.database.connection import get_connection, acquire_write_lock, release_write_lock
            lock_acquired = False
            try:
                if not acquire_write_lock(timeout=30):
                    print(f"⚠ Could not acquire lock for genesis block")
                    return
                lock_acquired = True
                
                conn = get_connection()
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO block_header (index_num, pre_hash, merkle_root, validator_pubkey, timestamp)
                    VALUES (?, ?, ?, ?, ?)
                ''', (genesis_block.index, genesis_block.block_header.pre_hash, 
                      genesis_block.block_header.merkle_root, genesis_block.block_header.validator_pubkey,
                      genesis_block.block_header.timestamp))
                
                header_id = cursor.lastrowid
                
                cursor.execute('''
                    INSERT INTO block (block_id, index_num, header_id, block_hash, validator_signature)
                    VALUES (?, ?, ?, ?, ?)
                ''', (genesis_block.block_id, genesis_block.index, header_id, 
                      genesis_block.block_hash, genesis_block.validator_signature))
                
                conn.commit()
                conn.close()
                print(f"✓ Genesis block saved to database")
            finally:
                if lock_acquired:
                    release_write_lock()
        except Exception as e:
            print(f"⚠ Failed to save genesis block to database: {e}")
        
        print("→ Saving genesis block transaction to database...")
        try:
            genesis_tx = genesis_block.transactions[0]
            
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


def _fetch_genesis_from_seed_node(blockchain: BlockChain, seed_nodes: list) -> bool:
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
            
            url = f"http://{seed_ip}:{seed_port}/api/v1/block/genesis"
            print(f"    → GET {url}")
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                print(f"    ✓ Response status 200")
                genesis_data = response.json()
                print(f"    → Genesis data received, block_id: {genesis_data.get('block_id')}")
                
                genesis_block = _create_genesis_from_dict(genesis_data, "")
                
                if genesis_block is None:
                    print(f"    ✗ Failed to create genesis block object from seed data")
                    continue
                if not _check_moet_pin(genesis_block.block_header.validator_pubkey):
                    continue
                
                try:
                    from app.database.connection import get_connection, acquire_write_lock, release_write_lock
                    lock_acquired = False
                    try:
                        if not acquire_write_lock(timeout=30):
                            print(f"    ⚠ Could not acquire lock for genesis from {seed_name}")
                            continue
                        lock_acquired = True
                        
                        conn = get_connection()
                        cursor = conn.cursor()
                        
                        cursor.execute('''
                            INSERT INTO block_header (index_num, pre_hash, merkle_root, validator_pubkey, timestamp)
                            VALUES (?, ?, ?, ?, ?)
                        ''', (genesis_block.index, genesis_block.block_header.pre_hash, 
                              genesis_block.block_header.merkle_root, genesis_block.block_header.validator_pubkey,
                              genesis_block.block_header.timestamp))
                        
                        header_id = cursor.lastrowid
                        
                        cursor.execute('''
                            INSERT INTO block (block_id, index_num, header_id, block_hash, validator_signature)
                            VALUES (?, ?, ?, ?, ?)
                        ''', (genesis_block.block_id, genesis_block.index, header_id, 
                              genesis_block.block_hash, genesis_block.validator_signature))
                        
                        for tx in genesis_block.transactions:
                            TransactionRepository.create_transaction(tx, conn=conn)
                        
                        conn.commit()
                        conn.close()
                        
                        blockchain.chain.append(genesis_block)
                        
                        print(f"    ✓ Genesis block fetched and saved from {seed_name}")
                        return True
                    finally:
                        if lock_acquired:
                            release_write_lock()
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
            continue
    
    return False


def _create_genesis_from_dict(data: dict, validator_pubkey: str):
    from app.models.Block import Block
    from app.models.BlockHeader import BlockHeader
    from app.models.Transaction import Transaction
    import json
    
    try:
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
    from app.repositories.BlockRepository import BlockRepository
    
    try:
        from app.database.connection import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT block_id FROM block ORDER BY index_num ASC')
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            print("⚠ No blocks found in DB to load")
            return 0
        
        block_ids = [row[0] for row in rows]
        
        blockchain.chain.clear()
        loaded = 0
        
        for block_id in block_ids:
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
    global _blockchain_instance
    _blockchain_instance = None
    print("✓ Blockchain instance reset")
