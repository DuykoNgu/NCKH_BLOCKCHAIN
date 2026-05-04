"""BlockRepository - Data access layer for Block operations"""
from typing import Optional, List
import json
from app.database.connection import get_connection
from app.models.Block import Block
from app.models.BlockHeader import BlockHeader
from app.models.Transaction import Transaction
from app.utils.logger import get_logger
from network.config_loader import get_config
logger = get_logger(__name__)


class BlockRepository:
    """Repository for Block database operations"""

    @staticmethod
    def create_block(block: Block) -> bool:
        """Create a new block in database (idempotent - safe to call multiple times)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Check if block already exists (idempotency)
            cursor.execute('SELECT block_id FROM block WHERE block_id = ?', (block.block_id,))
            if cursor.fetchone():
                logger.info(f"⚠ Block already exists: {block.block_id[:16]}... (skipping)")
                conn.close()
                return True  # Return True since block already saved
            
            # Insert block header
            cursor.execute('''
                INSERT INTO block_header (index_num, pre_hash, merkle_root, validator_pubkey, timestamp)
                VALUES (?, ?, ?, ?, ?)
            ''', (block.index, block.block_header.pre_hash, 
                  block.block_header.merkle_root, block.block_header.validator_pubkey,
                  block.block_header.timestamp))
            
            header_id = cursor.lastrowid
            
            # Insert block
            cursor.execute('''
                INSERT INTO block (block_id, index_num, header_id, block_hash, validator_signature)
                VALUES (?, ?, ?, ?, ?)
            ''', (block.block_id, block.index, header_id, block.block_hash, block.validator_signature))
            
            # Update transactions to associate them with this block
            updated_tx_count = 0
            if(block.block_id == "GENESIS"):
                conn.commit()
                conn.close()
                logger.info(f"✓ Genesis block created: {block.block_id[:16]}...")
                return True
            
            for tx in block.transactions:
                cursor.execute('''
                    UPDATE transactions 
                    SET block_id = ?
                    WHERE tx_hash = ?
                ''', (block.block_id, tx.tx_hash))
                if cursor.rowcount > 0:
                    updated_tx_count += 1
            
            conn.commit()
            conn.close()
            logger.info(f"✓ Block created: {block.block_id[:16]}... with {updated_tx_count} transactions")
            return True
        except Exception as e:
            logger.error(f"✗ Error creating block: {e}")
            return False

    @staticmethod
    def get_block_by_id(block_id: str) -> Optional[Block]:
        """Get block by block_id"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Get block
            cursor.execute('''
                SELECT block_id, index_num, header_id, block_hash, validator_signature 
                FROM block WHERE block_id = ?
            ''', (block_id,))
            block_row = cursor.fetchone()
            
            if not block_row:
                conn.close()
                return None
            
            # Get block header
            cursor.execute('''
                SELECT index_num, pre_hash, merkle_root, validator_pubkey, timestamp 
                FROM block_header WHERE header_id = ?
            ''', (block_row[2],))  # header_id is at index 2
            header_row = cursor.fetchone()
            
            # Get transactions from transactions table with this block_id
            cursor.execute('''
                SELECT tx_id, tx_hash, sender_pubkey, sender_address, recipient_address, 
                       payload, signature, timestamp, block_id, tx_status, error_reason
                FROM transactions WHERE block_id = ?
            ''', (block_id,))
            tx_rows = cursor.fetchall()
            
            conn.close()
            
            # Build Block object
            block_header = BlockHeader(
                index=header_row[0],
                pre_hash=header_row[1],
                merkle_root=header_row[2],
                validator_pubkey=header_row[3],
                timestamp=header_row[4]
            )
            
            # Build Transaction objects from rows
            transactions = []
            for row in tx_rows:
                tx = Transaction(
                    tx_id=row[0],
                    tx_hash=row[1],
                    sender_pubkey=row[2],
                    sender_address=row[3] if row[3] is not None else "system",
                    recipient_address=row[4],
                    payload=json.loads(row[5]) if row[5] else {},
                    signature=row[6],
                    timestamp=row[7],
                    block_id=row[8],
                    tx_status=row[9] if len(row) > 9 else "PENDING",
                    error_reason=row[10] if len(row) > 10 else ""
                )
                transactions.append(tx)
            
            block = Block(
                index=block_row[1],
                block_id=block_row[0],
                block_header=block_header,
                transactions=transactions
            )
            block.block_hash = block_row[3]
            block.validator_signature = block_row[4]
            
            return block
        except Exception as e:
            print(f"Error getting block by id: {e}")
            return None

    @staticmethod
    def get_block_by_index(index: int) -> Optional[Block]:
        """Get block by index"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT block_id FROM block WHERE index_num = ?', (index,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return BlockRepository.get_block_by_id(row[0])
            return None
        except Exception as e:
            print(f"Error getting block by index: {e}")
            return None

    @staticmethod
    def get_all_blocks() -> List[Block]:
        """Get all blocks"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT block_id FROM block ORDER BY index_num ASC')
            rows = cursor.fetchall()
            conn.close()
            
            blocks = []
            for row in rows:
                block = BlockRepository.get_block_by_id(row[0])
                if block:
                    blocks.append(block)
            return blocks
        except Exception as e:
            print(f"Error getting all blocks: {e}")
            return []

    @staticmethod
    def get_blocks_by_range(start_index: int, end_index: int) -> List[Block]:
        """Get blocks in index range"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT block_id FROM block 
                WHERE index_num >= ? AND index_num <= ? 
                ORDER BY index_num ASC
            ''', (start_index, end_index))
            rows = cursor.fetchall()
            conn.close()
            
            blocks = []
            for row in rows:
                block = BlockRepository.get_block_by_id(row[0])
                if block:
                    blocks.append(block)
            return blocks
        except Exception as e:
            print(f"Error getting blocks by range: {e}")
            return []

    @staticmethod
    def get_latest_block() -> Optional[Block]:
        """Get the latest block"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT block_id FROM block ORDER BY index DESC LIMIT 1')
            row = cursor.fetchone()

            conn.close()
            
            if row:
                return BlockRepository.get_block_by_id(row[0])
            return None
        except Exception as e:
            print(f"Error getting latest block: {e}")
            return None

    @staticmethod
    def update_block(block: Block) -> bool:
        """Update block"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE block 
                SET block_hash = ?, validator_signature = ?
                WHERE block_id = ?
            ''', (block.block_hash, block.validator_signature, block.block_id))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating block: {e}")
            return False

    @staticmethod
    def delete_block(block_id: str) -> bool:
        """Delete block by block_id"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Delete transactions first
            cursor.execute('DELETE FROM block_transactions WHERE block_id = ?', (block_id,))
            
            # Delete header
            cursor.execute('DELETE FROM block_header WHERE block_id = ?', (block_id,))
            
            # Delete block
            cursor.execute('DELETE FROM block WHERE block_id = ?', (block_id,))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error deleting block: {e}")
            return False

    @staticmethod
    def count_blocks() -> int:
        """Get total number of blocks"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) FROM block')
            count = cursor.fetchone()[0]
            conn.close()
            return count
        except Exception as e:
            print(f"Error counting blocks: {e}")
            return 0
