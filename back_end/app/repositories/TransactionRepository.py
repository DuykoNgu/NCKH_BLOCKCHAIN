"""TransactionRepository - Data access layer for Transaction operations"""
from typing import Optional, List
from app.database.connection import get_connection
from app.models.Transaction import Transaction
from app.utils.logger import get_logger
from json import dumps
import time

logger = get_logger(__name__)

BASE_TRANSACTION_SELECT = """
    SELECT tx_hash, sender_address, recipient_address, 
           payload, signature, timestamp, block_id
    FROM transactions
"""
class TransactionRepository:
    """Repository for Transaction database operations"""
    
    @staticmethod
    def create_transaction(transaction: Transaction, conn=None) -> bool:
        """Tạo transaction mới với retry logic, bao gồm status tracking
        
        Args:
            transaction: Transaction object to create
            conn: Optional existing database connection. If provided, uses it instead of creating new one.
                 Caller is responsible for commit/close.
        """
        max_retries = 3
        retry_delay = 0.5
        should_close = conn is None  # Only close if we created the connection
        
        for attempt in range(max_retries):
            try:
                if conn is None:
                    conn = get_connection()
                cursor = conn.cursor()
                
                # Handle NULL sender_address for system transactions (both lowercase and uppercase)
                sender_addr = None if transaction.sender_address and transaction.sender_address.lower() == "system" else transaction.sender_address
                
                # Convert empty string to None for FK constraints
                block_id = transaction.block_id if transaction.block_id else None
            
                
                cursor.execute('''
                    INSERT OR IGNORE INTO transactions 
                    (tx_id, tx_hash, sender_address, recipient_address, payload, signature, timestamp, block_id, tx_status, error_reason)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    transaction.tx_id,
                    transaction.tx_hash, 
                    sender_addr,
                    transaction.recipient_address, 
                    dumps(transaction.payload), 
                    transaction.signature,
                    transaction.timestamp, 
                    block_id,
                    transaction.tx_status,
                    transaction.error_reason
                ))
                
                if should_close:
                    conn.commit()   
                    conn.close()
                logger.info(f"✓ Transaction created: {transaction.tx_hash[:16]}...")
                return True
            except Exception as e:
                if "locked" in str(e).lower() and attempt < max_retries - 1:
                    # Retry on database lock
                    logger.warning(f"⚠ Database locked, retry #{attempt + 1}/{max_retries} for TX {transaction.tx_hash[:16]}...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                
                # Detailed FK constraint error logging
                if "FOREIGN KEY" in str(e):
                    logger.error(f"✗ FOREIGN KEY Constraint Error for TX {transaction.tx_hash[:16]}...")
                    logger.error(f"  SQL Values: tx_id={transaction.tx_id[:16]}, sender_addr={sender_addr}, recipient_addr={transaction.recipient_address}, block_id={block_id}")
                    logger.error(f"  Check: Does account '{sender_addr}' exist? Does block '{block_id}' exist?")
                
                logger.error(f"✗ Error creating transaction {transaction.tx_hash[:16]}...: {e}")
                if should_close:
                    try:
                        conn.close()
                    except:
                        pass
                return False
        
        return False

    @staticmethod
    def get_transaction_by_id(tx_id: str) -> Optional[Transaction]:
        """Lấy transaction theo hash (Đã sửa lỗi tên cột và index)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Sửa thành tx_hash = ?
            query = f"{BASE_TRANSACTION_SELECT} WHERE tx_hash = ?"
            cursor.execute(query, (tx_id,))
            row = cursor.fetchone()
            conn.close()
            
            return TransactionRepository._parse_transaction_row(row)
        except Exception as e:
            print(f"Error getting transaction: {e}")
            return None

    @staticmethod
    def get_transactions_by_sender(sender_address: str) -> List[Transaction]:
        """Lấy danh sách transaction theo người gửi (Đã rút gọn bằng helper)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            query = f"{BASE_TRANSACTION_SELECT} WHERE sender_address = ? ORDER BY timestamp DESC"
            cursor.execute(query, (sender_address,))
            rows = cursor.fetchall()
            conn.close()
            
            return [TransactionRepository._parse_transaction_row(row) for row in rows if row]
        except Exception as e:
            print(f"Error getting transactions: {e}")
            return []

    @staticmethod
    def get_transactions_by_recipient(recipient_address: str) -> List[Transaction]:
        """Lấy tất cả giao dịch theo người nhận"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            query = f"{BASE_TRANSACTION_SELECT} WHERE recipient_address = ? ORDER BY timestamp DESC"
            cursor.execute(query, (recipient_address,))
            rows = cursor.fetchall()
            conn.close()
            return [TransactionRepository._parse_transaction_row(row) for row in rows]
        except Exception as e:
            print(f"Error fetching recipient txs: {e}")
            return []

    @staticmethod
    def get_all_transactions() -> List[Transaction]:
        """Lấy toàn bộ lịch sử giao dịch"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            query = f"{BASE_TRANSACTION_SELECT} ORDER BY timestamp DESC"
            cursor.execute(query)
            rows = cursor.fetchall()
            conn.close()
            return [TransactionRepository._parse_transaction_row(row) for row in rows]
        except Exception as e:
            print(f"Error fetching all txs: {e}")
            return []

    @staticmethod
    def get_transactions_by_type(tx_type: str) -> List[Transaction]:
        """Get transactions by type (from payload)"""
        try:
            all_txs = TransactionRepository.get_all_transactions()
            return [tx for tx in all_txs if tx.payload.get('type') == tx_type]
        except Exception as e:
            print(f"Error getting transactions by type: {e}")
            return []

    @staticmethod
    def count_transactions() -> int:
        """Get total number of transactions"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) FROM transactions')
            count = cursor.fetchone()[0]
            conn.close()
            return count
        except Exception as e:
            print(f"Error counting transactions: {e}")
            return 0

    @staticmethod
    def get_transactions_by_date_range(start_timestamp: float, end_timestamp: float) -> List[Transaction]:
        """Lấy danh sách giao dịch trong khoảng thời gian xác định"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Sử dụng biến BASE_TRANSACTION_SELECT đã thống nhất ở các hàm trước
            # Toán tử BETWEEN giúp truy vấn ngắn gọn và tối ưu hơn >= AND <=
            query = f"{BASE_TRANSACTION_SELECT} WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC"
            
            cursor.execute(query, (start_timestamp, end_timestamp))
            rows = cursor.fetchall()
            conn.close()
            
            # Sử dụng List Comprehension và hàm helper để parse dữ liệu sạch sẽ
            return [TransactionRepository._parse_transaction_row(row) for row in rows if row]
            
        except Exception as e:
            print(f"Error getting transactions by date range: {e}")
            return []
    
    @staticmethod
    def _parse_transaction_row(row) -> Optional[Transaction]:
        """Helper method to parse database row into Transaction object"""
        if not row:
            return None
        
        import json
        
        try:
            return Transaction(
                tx_hash=row[0],
                sender_address=row[1],
                recipient_address=row[2],
                payload=json.loads(row[3]) if row[3] else {},
                signature=row[4],
                timestamp=row[5],
                block_id=row[6]
            )
        except Exception as e:
            print(f"Error parsing transaction row: {e}")
            return None
    
    @staticmethod
    def get_transaction_by_hash(tx_hash: str) -> Optional[Transaction]:
        """Get transaction by hash (idempotency check)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            query = f"{BASE_TRANSACTION_SELECT} WHERE tx_hash = ?"
            cursor.execute(query, (tx_hash,))
            row = cursor.fetchone()
            conn.close()
            
            return TransactionRepository._parse_transaction_row(row)
        except Exception as e:
            logger.error(f"Error getting transaction by hash: {e}")
            return None
    
    @staticmethod
    def update_transaction_block_id(tx_hash: str, block_id: str) -> bool:
        """Update transaction with block_id (idempotent linking)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE transactions
                SET block_id = ?
                WHERE tx_hash = ? AND (block_id IS NULL OR block_id = '')
            ''', (block_id, tx_hash))
            
            conn.commit()
            conn.close()
            
            if cursor.rowcount > 0:
                logger.info(f"✓ Updated transaction {tx_hash[:16]}... with block_id {block_id[:16]}...")
                return True
            else:
                logger.debug(f"⚠ Transaction {tx_hash[:16]}... already has block_id")
                return True  # Still OK, already updated
        except Exception as e:
            logger.error(f"✗ Error updating transaction block_id: {e}")
            return False
