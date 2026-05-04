from ecdsa import SigningKey

from app.models.BlockChain import BlockChain
from app.models.Block import Block
from app.models.BlockHeader import BlockHeader
from app.models.Transaction import Transaction
from app.services.BlockService import BlockService
from app.services.TransactionService import TransactionService
from typing import List, Optional, Dict

class BlockChainService:
    @staticmethod
    def cleanup_mempool_from_chain(blockchain: BlockChain) -> int:
        """
        ✅ CRITICAL FIX: Remove all transactions that are already committed in blockchain
        
        Vấn đề: Khi receive block từ gossip, các node khác vẫn có transactions đó trong mempool
        Nếu những transactions đó được include trong block của peer, thì node này không nên mine lại
        
        This function:
        1. Scans all blocks in the chain
        2. Collects all tx_hash from committed transactions
        3. Removes them from mempool
        4. Returns count of removed transactions
        
        Args:
            blockchain: The blockchain instance
            
        Returns:
            int: Number of transactions removed from mempool
        """
        # Collect all tx_hashes that are already in blocks
        committed_tx_hashes = set()
        
        for block in blockchain.chain:
            for tx in block.transactions:
                if tx.tx_hash and tx.tx_hash != "":
                    committed_tx_hashes.add(tx.tx_hash)
        
        # Filter mempool to remove committed transactions
        original_size = len(blockchain.mempool)
        blockchain.mempool = [
            tx for tx in blockchain.mempool 
            if tx.tx_hash not in committed_tx_hashes
        ]
        
        removed = original_size - len(blockchain.mempool)
        if removed > 0:
            print(f"🧹 [MEMPOOL] Cleaned {removed} committed transactions from mempool")
        
        return removed
    
    @staticmethod
    def deduplicate_mempool(blockchain: BlockChain) -> int:
        """
        Remove duplicate transactions from mempool
        Keeps first occurrence, removes duplicates
        """
        seen_hashes = set()
        deduplicated = []
        duplicates = 0
        
        for tx in blockchain.mempool:
            if tx.tx_hash not in seen_hashes:
                seen_hashes.add(tx.tx_hash)
                deduplicated.append(tx)
            else:
                duplicates += 1
        
        blockchain.mempool = deduplicated
        
        if duplicates > 0:
            print(f"🧹 [MEMPOOL] Removed {duplicates} duplicate transactions from mempool")
        
        return duplicates
    
    @staticmethod
    def validate_mempool_transactions(blockchain: BlockChain) -> int:
        """
        Re-validate all mempool transactions
        Remove invalid ones (e.g., invalid signatures, sender not authorized)
        """
        valid_tx = []
        invalid_count = 0
        
        for tx in blockchain.mempool:
            if TransactionService.is_valid(tx):
                valid_tx.append(tx)
            else:
                invalid_count += 1
                print(f"⚠️ [MEMPOOL] Removed invalid transaction {tx.tx_hash[:8]}...")
        
        blockchain.mempool = valid_tx
        
        if invalid_count > 0:
            print(f"🧹 [MEMPOOL] Removed {invalid_count} invalid transactions")
        
        return invalid_count
    
    @staticmethod
    def rebuild_mempool(blockchain: BlockChain) -> None:
        """
        🔧 COMPREHENSIVE MEMPOOL REBUILD
        Called when receiving new blocks to ensure mempool consistency across network
        
        Steps:
        1. Remove transactions already in blockchain
        2. Deduplicate remaining transactions
        3. Validate all remaining transactions
        4. Log results
        """
        print(f"\n📋 [MEMPOOL REBUILD] Before: {len(blockchain.mempool)} transactions")
        
        # Step 1: Clean committed transactions
        BlockChainService.cleanup_mempool_from_chain(blockchain)
        
        # Step 2: Deduplicate
        BlockChainService.deduplicate_mempool(blockchain)
        
        # Step 3: Validate
        BlockChainService.validate_mempool_transactions(blockchain)
        
        print(f"📋 [MEMPOOL REBUILD] After: {len(blockchain.mempool)} transactions\n")
    
    @staticmethod
    def create_genesis_block(blockchain: BlockChain, pubkey_hex: str) -> Block:
        blockchain.super_validator_pubkey = pubkey_hex
        blockchain.authority_set.add(pubkey_hex)

        # Create a genesis transaction (system-initiated, no signature needed)
        genesis_tx = Transaction(
            tx_id="GENESIS_TX",
            sender_pubkey=pubkey_hex,
            sender_address="system",  # lowercase for FK constraint compatibility
            recipient_address="system",  # lowercase for FK constraint compatibility
            payload={"op": "genesis", "message": "System Genesis Block"},
            signature="GENESIS"
        )
        genesis_tx.tx_status = "COMMITTED"
        genesis_tx.tx_hash = "GENESIS_TX_HASH"
        genesis_tx.block_id = "GENESIS"  # Mark as already belonging to GENESIS block

        header = BlockHeader(
            index=0,
            pre_hash="0" * 64,
            merkle_root="",
            validator_pubkey=pubkey_hex,
        )

        genesis_block = Block(
            block_id="GENESIS",
            index=0,
            block_header=header,
            transactions=[genesis_tx]
        )
        
        # Calculate merkle root for genesis block
        merkle_root = BlockService.calculate_merkle_root(genesis_block.transactions)
        genesis_block.block_header.merkle_root = merkle_root
        genesis_block.block_hash = BlockService.calculate_hash(genesis_block)
        genesis_block.validator_signature = "GENESIS"
        
        blockchain.chain.append(genesis_block)
        return genesis_block

    @staticmethod
    def add_transaction_to_mempool(blockchain: BlockChain, tx: Transaction) -> bool:
        # If no signature, we assume it's a server-initiated transaction (like minting)
        # In a real blockchain, the server would sign this with its authority key.
        if not tx.signature:
            blockchain.mempool.append(tx)
            return True
            
        if TransactionService.is_valid(tx):
            blockchain.mempool.append(tx)
            return True
        return False

    @staticmethod
    def execute_transaction(blockchain: BlockChain, tx: Transaction) -> bool:
        """
        Execute transaction and update blockchain state
        Sets tx.tx_status and tx.error_reason on failure
        
        Returns: True if successful, False if failed (logged to tx status)
        """
        payload = tx.payload

        # Genesis transaction (system operation)
        if payload.get("op") == "genesis":
            tx.tx_status = "COMMITTED"
            return True

        # Generic key-value state update
        if payload.get("op") == "set":
            try:
                blockchain.state_db[payload["key"]] = payload["value"]
                tx.tx_status = "COMMITTED"
                return True
            except Exception as e:
                tx.tx_status = "FAILED"
                tx.error_reason = f"State update failed: {str(e)}"
                print(f"✗ [TX] set operation failed: {tx.error_reason}")
                return False

        # Account registration transaction
        if payload.get("op") == "account_register":
            try:
                from app.repositories.AccountRepository import AccountRepository
                from app.models.Account import Account, Role
                import datetime

                # Validate payload structure
                if not isinstance(payload, dict):
                    tx.tx_status = "FAILED"
                    tx.error_reason = f"Invalid payload type: {type(payload).__name__}"
                    print(f"✗ [TX] account_register error: {tx.error_reason}")
                    return False

                address = payload.get("address", "").lower()
                public_key = payload.get("public_key", "")
                role_str = payload.get("role", "client")

                if not address or not public_key:
                    tx.tx_status = "FAILED"
                    tx.error_reason = f"Missing address or public_key. address={bool(address)}, public_key={bool(public_key)}"
                    print(f"✗ [TX] account_register error: {tx.error_reason}")
                    return False

                role_map = {
                    "client": Role.CLIENT,
                    "validator": Role.VALIDATOR,
                    "moet": Role.MOET,
                }
                role = role_map.get(role_str.lower(), Role.CLIENT)

                account = Account(
                    address=address,
                    public_key=public_key,
                    role=role,
                    is_active=1,
                    created_at=payload.get(
                        "created_at",
                        datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
                    ),
                )
                
                # Create account in database (with INSERT OR IGNORE for idempotency)
                success = AccountRepository.create_account(account)
                
                if success:
                    tx.tx_status = "COMMITTED"
                    print(f"✓ [TX] account_register applied: {address} (role={role_str})")
                    return True
                else:
                    # Check if account already exists (this is OK for INSERT OR IGNORE)
                    existing = AccountRepository.get_account_by_address(address)
                    if existing:
                        tx.tx_status = "COMMITTED"  # Mark as committed even if skipped
                        print(f"⚠ [TX] account_register skipped: {address} already exists")
                        return True  # Still return True since account exists
                    else:
                        tx.tx_status = "FAILED"
                        tx.error_reason = "Failed to create account (DB constraint or unknown error)"
                        print(f"✗ [TX] account_register failed: {tx.error_reason}")
                        return False
                        
            except Exception as e:
                tx.tx_status = "FAILED"
                tx.error_reason = str(e)
                print(f"✗ [TX] account_register error: {tx.error_reason}")
                import traceback
                traceback.print_exc()
                return False

        # Account profile update transaction
        if payload.get("op") == "account_update":
            try:
                from app.repositories.AccountRepository import AccountRepository

                address = payload.get("address", "").lower()
                account = AccountRepository.get_account_by_address(address)
                if not account:
                    tx.tx_status = "FAILED"
                    tx.error_reason = f"Account not found: {address}"
                    print(f"✗ [TX] account_update failed: {tx.error_reason}")
                    return False

                if "full_name" in payload:
                    account.full_name = payload["full_name"]
                if "avatar_url" in payload:
                    account.avatar_url = payload["avatar_url"]

                AccountRepository.update_account(account)
                tx.tx_status = "COMMITTED"
                print(f"✓ [TX] account_update applied: {address}")
                return True
            except Exception as e:
                tx.tx_status = "FAILED"
                tx.error_reason = str(e)
                print(f"✗ [TX] account_update error: {tx.error_reason}")
                return False

        # Validator activation transaction
        if payload.get("op") == "validator_activate":
            try:
                ip_address = payload.get("ip_address")
                port = payload.get("port")
                public_key = payload.get("public_key")
                node_type = payload.get("node_type", "validator")
                
                if not ip_address or not port or not public_key:
                    tx.tx_status = "FAILED"
                    tx.error_reason = f"Missing validator activation fields. ip={bool(ip_address)}, port={bool(port)}, pubkey={bool(public_key)}"
                    print(f"✗ [TX] validator_activate error: {tx.error_reason}")
                    return False
                
                # Update peer activation via network service
                from app.services.NetworkService import get_network_service
                network_service = get_network_service()
                
                success = network_service.peer_manager.update_peer_activation_by_ip_port(
                    ip_address=ip_address,
                    port=int(port),
                    public_key=public_key,
                    node_type=node_type
                )
                
                if success:
                    tx.tx_status = "COMMITTED"
                    print(f"✓ [TX] validator_activate applied: {ip_address}:{port}")
                    return True
                else:
                    tx.tx_status = "FAILED"
                    tx.error_reason = f"Failed to activate peer: {ip_address}:{port}"
                    print(f"✗ [TX] validator_activate failed: {tx.error_reason}")
                    return False
                    
            except Exception as e:
                tx.tx_status = "FAILED"
                tx.error_reason = str(e)
                print(f"✗ [TX] validator_activate error: {tx.error_reason}")
                import traceback
                traceback.print_exc()
                return False

        # NFT minting transaction
        if payload.get("op") == "mint_nft":
            try:
                from app.repositories.NFTRepository import NFTRepository
                from app.repositories.AccountRepository import AccountRepository
                from app.models.NFT import NFT
                from app.models.NFTmetadata import NFTmetadata
                from app.models.Account import Account, Role

                # --- Extract fields from payload ---
                token_id        = payload.get("token_id")
                issuer_address  = payload.get("issuer_address", tx.sender_address)
                issuer_pubkey   = payload.get("issuer_pubkey", tx.sender_pubkey or "")
                recipient_addr  = payload.get("recipient_address", tx.recipient_address)
                degree_type     = payload.get("degree_type", "")
                pdf_url         = payload.get("pdf_url", "")
                pdf_hash        = payload.get("pdf_hash", "")
                institution_addr = payload.get("institution_address", "")
                institution     = payload.get("institution", "")
                student_id      = payload.get("student_id", "")
                issued_at       = payload.get("issued_at")
                issuer_sig      = payload.get("issuer_signature", "")
                minted_at       = payload.get("minted_at")

                if not recipient_addr:
                    tx.tx_status = "FAILED"
                    tx.error_reason = "mint_nft: missing recipient_address"
                    print(f"✗ [TX] {tx.error_reason}")
                    return False

                # --- Idempotency: skip if NFT already exists in this node's DB ---
                if token_id:
                    existing_nft = NFTRepository.get_nft_by_id(token_id)
                    if existing_nft:
                        tx.tx_status = "COMMITTED"
                        print(f"⚠ [TX] mint_nft skipped: token_id={token_id[:16]}... already exists")
                        return True

                # --- Reconstruct NFT objects ---
                metadata = NFTmetadata(
                    degree_type=degree_type,
                    pdf_url=pdf_url,
                    pdf_hash=pdf_hash,
                    institution_address=institution_addr,
                    institution=institution,
                    student_id=student_id,
                    issued_at=issued_at
                )

                # Resolve recipient Account (placeholder if not found locally yet)
                recipient_account = AccountRepository.get_account_by_address(recipient_addr)
                if not recipient_account:
                    recipient_account = Account(
                        address=recipient_addr,
                        public_key="",
                        role=Role.CLIENT,
                        is_active=1
                    )

                nft = NFT(
                    issuer_address=issuer_address,
                    issuer_pubkey=issuer_pubkey,
                    metadata=metadata,
                    owner_address=recipient_account,
                    issuer_signature=issuer_sig
                )

                # Override auto-generated token_id with the one from payload for consistency
                if token_id:
                    nft.token_id = token_id
                if minted_at:
                    nft.minted_at = minted_at

                # --- Persist NFT ---
                success = NFTRepository.create_nft(nft)
                if success:
                    tx.tx_status = "COMMITTED"
                    print(f"✓ [TX] mint_nft applied: token_id={nft.token_id[:16]}... → {recipient_addr}")
                    return True
                else:
                    # Might fail due to UNIQUE constraint if record was already inserted
                    # (e.g. originating node already saved it)
                    existing = NFTRepository.get_nft_by_id(nft.token_id)
                    if existing:
                        tx.tx_status = "COMMITTED"
                        print(f"⚠ [TX] mint_nft: NFT already in DB, skipping insert")
                        return True
                    tx.tx_status = "FAILED"
                    tx.error_reason = "mint_nft: failed to save NFT to database"
                    print(f"✗ [TX] {tx.error_reason}")
                    return False

            except Exception as e:
                tx.tx_status = "FAILED"
                tx.error_reason = str(e)
                print(f"✗ [TX] mint_nft error: {tx.error_reason}")
                import traceback
                traceback.print_exc()
                return False

        # Unknown / unrecognised operation – log but do NOT fail the whole block sync
        # Future custom ops or ops added in newer node versions should not break older nodes
        print(f"⚠ [TX] Unknown operation '{payload.get('op', 'UNKNOWN')}' – skipping (tx_hash={tx.tx_hash[:16] if tx.tx_hash else 'N/A'}...)")
        tx.tx_status = "COMMITTED"
        return True

    @staticmethod
    def is_valid_new_block(blockchain: BlockChain, new_block: Block, prev_block: Block) -> bool:
        if new_block.index != prev_block.index + 1:
            return False

        if new_block.block_header.pre_hash != prev_block.block_hash:
            return False

        # if new_block.block_header.validator_pubkey not in blockchain.authority_set:
        #     return False

        return True
   
        
    @staticmethod
    def mine_block(blockchain: BlockChain, private_key: SigningKey, public_key_hex: str, 
                   max_transactions: int = None) -> tuple:
        """
        Mine a new block with transactions from mempool
        
        Logic:
        - Genesis block (index 0): max 1 transaction (already has 1 system transaction)
        - Other blocks: max 100 transactions
        - If last block has < max_transactions: append transactions to it until it reaches max
        - Only create a new block when last block is FULL
        
        Args:
            blockchain: The blockchain instance
            private_key: Private key for signing
            public_key_hex: Public key of the validator
            max_transactions: Maximum number of transactions to include (optional)
        
        Returns:
            Tuple: (block, is_new_block) where is_new_block indicates if it's a new block to be added
        """
        # if public_key_hex not in blockchain.authority_set:
        #     raise PermissionError("Validator ko năm trong uỷ quyền")

        # Get max_transactions from config if not provided
        if max_transactions is None:
            try:
                from network.config_loader import get_config
                config = get_config()
                consensus_config = config.get_consensus_config()
                max_transactions = consensus_config.get('max_transactions_per_block', 100)
            except:
                max_transactions = 100  # Default fallback
        
        last_block = blockchain.get_last_block()

        # Committed blocks must be immutable across the network.
        # Always create a brand new block from the current mempool snapshot.
        if not blockchain.mempool:
            return (last_block, False)

        transactions_to_include = blockchain.mempool[:max_transactions]

        for tx in transactions_to_include:
            BlockChainService.execute_transaction(blockchain, tx)

        header = BlockHeader(
            index=last_block.index + 1,
            pre_hash=last_block.block_hash,
            merkle_root="",
            validator_pubkey=public_key_hex,
        )

        block = Block(
            block_id=f"BLOCK_{header.index}",
            index=header.index,
            block_header=header,
            transactions=transactions_to_include
        )

        # Finalize tx fields before calculating merkle root and block signature.
        for tx in transactions_to_include:
            tx.block_id = block.block_id
            if tx.tx_status == "PENDING":
                tx.tx_status = "COMMITTED"

        block.block_header.merkle_root = BlockService.calculate_merkle_root(block.transactions)

        BlockService.sign_block(block, private_key)

        included_tx_hashes = {tx.tx_hash for tx in transactions_to_include}
        blockchain.mempool = [tx for tx in blockchain.mempool if tx.tx_hash not in included_tx_hashes]

        print(f"â†’ Created new block {block.block_id} with {len(transactions_to_include)} transactions")
        return (block, True)
        current_tx_count = len(last_block.transactions)
        
        # For Genesis block, max is 1 transaction (it starts with 1 system transaction)
        if last_block.index == 0:
            genesis_max_tx = 1
        else:
            genesis_max_tx = max_transactions
        
        # If last block is not full, append transactions to it
        if current_tx_count < genesis_max_tx:
            # Calculate how many transactions we need to fill the block
            transactions_needed = genesis_max_tx - current_tx_count
            
            # Take transactions from mempool
            new_transactions = blockchain.mempool[:transactions_needed]
            
            if new_transactions:
                # Execute new transactions first
                for tx in new_transactions:
                    BlockChainService.execute_transaction(blockchain, tx)
                
                # Append transactions to last block
                last_block.transactions.extend(new_transactions)
                
                # Recalculate merkle root with all transactions
                merkle_root = BlockService.calculate_merkle_root(last_block.transactions)
                last_block.block_header.merkle_root = merkle_root
                
                # Re-sign the block with updated merkle root
                BlockService.sign_block(last_block, private_key)
                
                # Remove the appended transactions from mempool
                included_tx_hashes = {tx.tx_hash for tx in new_transactions}
                blockchain.mempool = [tx for tx in blockchain.mempool if tx.tx_hash not in included_tx_hashes]
                
                print(f"→ Appended {len(new_transactions)} transactions to block {last_block.block_id} (total: {len(last_block.transactions)})")
            
            # Return the block but mark as NOT new (already in chain)
            return (last_block, False)
        
        # Only create a new block when last block is FULL
        # AND there are transactions waiting in mempool
        elif current_tx_count == genesis_max_tx and blockchain.mempool:
            transactions_to_include = blockchain.mempool[:max_transactions]
            
            # Execute new transactions first
            for tx in transactions_to_include:
                BlockChainService.execute_transaction(blockchain, tx)
            
            merkle_root = BlockService.calculate_merkle_root(transactions_to_include)

            header = BlockHeader(
                index=last_block.index + 1,
                pre_hash=last_block.block_hash,
                merkle_root=merkle_root,
                validator_pubkey=public_key_hex,
            )

            block = Block(
                block_id=f"BLOCK_{header.index}",
                index=header.index,
                block_header=header,
                transactions=transactions_to_include
            )

            BlockService.sign_block(block, private_key)
            
            # Remove the transactions that were included in the new block
            included_tx_hashes = {tx.tx_hash for tx in transactions_to_include}
            blockchain.mempool = [tx for tx in blockchain.mempool if tx.tx_hash not in included_tx_hashes]
            
            print(f"→ Created new block {block.block_id} with {len(transactions_to_include)} transactions")

            # Return the block and mark as NEW (to be added to chain)
            return (block, True)
        
        # If last block is full but mempool is empty, return last block (not new)
        return (last_block, False)

    @staticmethod
    def add_block(blockchain: BlockChain, block: Block) -> bool:
        """
        Add block to blockchain and remove included transactions from mempool
        
        ⚠️  IMPORTANT: This is called ONLY after mine_block(), which already executed transactions.
        So we DO NOT execute transactions again here (to avoid double-execution).
        
        For blocks received via gossip (receive_block), transactions ARE executed there.
        This ensures single execution per node:
        - Validator node: mine_block() executes, add_block() skips
        - Non-validator node: receive_block() executes
        
        Args:
            blockchain: The blockchain instance
            block: The block to add
            
        Returns:
            bool: True if successful
        """
        if not BlockChainService.is_valid_new_block(blockchain, block, blockchain.get_last_block()):
            raise ValueError("invalid block")

        # ⚠️  SKIP transaction execution - already done by mine_block()
        # This is called by ValidatorWorker AFTER mine_block(), so transactions are already executed
        # Only remove them from mempool
        print(f"→ Adding {len(block.transactions)} transactions to blockchain (already executed by mine_block)")
        
        # Remove only the transactions that were included in this block
        # This allows remaining transactions to stay in mempool for next block
        included_tx_hashes = {tx.tx_hash for tx in block.transactions}
        blockchain.mempool = [tx for tx in blockchain.mempool if tx.tx_hash not in included_tx_hashes]
        
        # if failed_count > 0:
        #     print(f"⚠ [BLOCK] {failed_count}/{len(block.transactions)} transactions failed in block {block.block_id}")
        
        blockchain.chain.append(block)
        return True
