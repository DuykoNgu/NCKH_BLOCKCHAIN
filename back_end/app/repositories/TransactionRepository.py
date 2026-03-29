"""TransactionRepository - Data access layer for Transaction operations"""
from typing import Optional, List
from app.database.connection import get_connection
from app.models.Transaction import Transaction
from json import dumps
BASE_TRANSACTION_SELECT = """
    SELECT tx_hash, sender_address, recipient_address, 
           payload, signature, timestamp, block_id
    FROM transactions
"""
class TransactionRepository:
    """Repository for Transaction database operations"""
    
    @staticmethod
    def create_transaction(transaction: Transaction) -> bool:
        """Tạo transaction mới (Đã sửa lỗi dấu ? và khớp schema)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # 7 cột tương ứng với 7 dấu chấm hỏi
            cursor.execute('''
                INSERT INTO transactions 
                (tx_hash, sender_address, recipient_address, payload, signature, timestamp, block_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                transaction.tx_hash, 
                transaction.sender_address,
                transaction.recipient_address, 
                dumps(transaction.payload), 
                transaction.signature,
                transaction.timestamp, 
                transaction.block_id
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error creating transaction: {e}")
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
            query = f"{TransactionRepository.BASE_TRANSACTION_SELECT} WHERE recipient_address = ? ORDER BY timestamp DESC"
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
            query = f"{TransactionRepository.BASE_TRANSACTION_SELECT} ORDER BY timestamp DESC"
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
            query = f"{TransactionRepository.BASE_TRANSACTION_SELECT} WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC"
            
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
