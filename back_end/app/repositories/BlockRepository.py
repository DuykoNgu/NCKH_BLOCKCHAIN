"""BlockRepository - Data access layer for Block operations"""
from typing import Optional, List
from app.database.connection import get_connection
from app.models.Block import Block
from app.models.BlockHeader import BlockHeader
from app.models.Transaction import Transaction


class BlockRepository:
    """Repository for Block database operations"""

    @staticmethod
    def create_block(block: Block) -> bool:
        """Create a new block in database"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Insert block header first
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
            
            # Insert transactions for this block
            for tx in block.transactions:
                cursor.execute('''
                    INSERT INTO block_transactions (block_id, tx_id)
                    VALUES (?, ?)
                ''', (block.block_id, tx.tx_id))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error creating block: {e}")
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
            
            # Get transactions
            cursor.execute('''
                SELECT tx_id FROM block_transactions WHERE block_id = ?
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
            
            transactions = [Transaction(tx_id=row[0]) for row in tx_rows]
            
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

    # =========================================================================
    # VAL-06: CHỐNG XỬ LÝ TRÙNG BLOCK
    # =========================================================================
    # Hàm này được sử dụng để kiểm tra block đã tồn tại trong database chưa
    # trước khi xử lý block nhận từ validator khác.
    #
    # Mục đích:
    #   - Tránh xử lý lại block đã có (duplicate processing)
    #   - Chống replay attack (kẻ tấn công gửi lại block cũ)
    #   - Đảm bảo tính nhất quán của blockchain
    #
    # Cách sử dụng:
    #   - block_exists(block_id="BLOCK_1") → Kiểm tra theo block ID
    #   - block_exists(block_hash="0x...") → Kiểm tra theo block hash
    # =========================================================================
    @staticmethod
    def block_exists(block_id: str = None, block_hash: str = None) -> bool:
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Kiểm tra theo block_id (unique identifier)
            if block_id:
                cursor.execute('SELECT 1 FROM block WHERE block_id = ?', (block_id,))
            # Kiểm tra theo block_hash (chống replay attack)
            elif block_hash:
                cursor.execute('SELECT 1 FROM block WHERE block_hash = ?', (block_hash,))
            else:
                # Không có tham số nào được truyền
                return False
            
            # Nếu fetchone() trả về giá trị → block tồn tại
            exists = cursor.fetchone() is not None
            conn.close()
            return exists
        except Exception as e:
            print(f"Error checking block existence: {e}")
            return False
