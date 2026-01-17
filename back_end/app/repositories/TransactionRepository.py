"""TransactionRepository - Data access layer for Transaction operations"""
from typing import Optional, List
from app.database import get_connection
from app.models.Transaction import Transaction


class TransactionRepository:
    """Repository for Transaction database operations"""

    @staticmethod
    def create_transaction(transaction: Transaction) -> bool:
        """Create a new transaction in database"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO transactions 
                (tx_id, sender_pubkey, sender_address, recipient_address, payload, signature, timestamp, tx_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (transaction.tx_id, transaction.sender_pubkey, transaction.sender_address,
                  transaction.recipient_address, str(transaction.payload), transaction.signature,
                  transaction.timestamp, transaction.tx_hash))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error creating transaction: {e}")
            return False

    @staticmethod
    def get_transaction_by_id(tx_id: str) -> Optional[Transaction]:
        """Get transaction by tx_id"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT tx_id, sender_pubkey, sender_address, recipient_address, 
                       payload, signature, timestamp, tx_hash 
                FROM transactions WHERE tx_id = ?
            ''', (tx_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                import json
                try:
                    payload = json.loads(row[4])
                except:
                    payload = {}
                
                return Transaction(
                    tx_id=row[0],
                    sender_pubkey=row[1],
                    sender_address=row[2],
                    recipient_address=row[3],
                    payload=payload,
                    signature=row[5],
                    timestamp=row[6],
                    tx_hash=row[7]
                )
            return None
        except Exception as e:
            print(f"Error getting transaction by id: {e}")
            return None

    @staticmethod
    def get_transactions_by_sender(sender_address: str) -> List[Transaction]:
        """Get all transactions by sender address"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT tx_id, sender_pubkey, sender_address, recipient_address, 
                       payload, signature, timestamp, tx_hash 
                FROM transactions WHERE sender_address = ?
                ORDER BY timestamp DESC
            ''', (sender_address,))
            rows = cursor.fetchall()
            conn.close()
            
            import json
            transactions = []
            for row in rows:
                try:
                    payload = json.loads(row[4])
                except:
                    payload = {}
                
                tx = Transaction(
                    tx_id=row[0],
                    sender_pubkey=row[1],
                    sender_address=row[2],
                    recipient_address=row[3],
                    payload=payload,
                    signature=row[5],
                    timestamp=row[6],
                    tx_hash=row[7]
                )
                transactions.append(tx)
            return transactions
        except Exception as e:
            print(f"Error getting transactions by sender: {e}")
            return []

    @staticmethod
    def get_transactions_by_recipient(recipient_address: str) -> List[Transaction]:
        """Get all transactions by recipient address"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT tx_id, sender_pubkey, sender_address, recipient_address, 
                       payload, signature, timestamp, tx_hash 
                FROM transactions WHERE recipient_address = ?
                ORDER BY timestamp DESC
            ''', (recipient_address,))
            rows = cursor.fetchall()
            conn.close()
            
            import json
            transactions = []
            for row in rows:
                try:
                    payload = json.loads(row[4])
                except:
                    payload = {}
                
                tx = Transaction(
                    tx_id=row[0],
                    sender_pubkey=row[1],
                    sender_address=row[2],
                    recipient_address=row[3],
                    payload=payload,
                    signature=row[5],
                    timestamp=row[6],
                    tx_hash=row[7]
                )
                transactions.append(tx)
            return transactions
        except Exception as e:
            print(f"Error getting transactions by recipient: {e}")
            return []

    @staticmethod
    def get_all_transactions() -> List[Transaction]:
        """Get all transactions"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT tx_id, sender_pubkey, sender_address, recipient_address, 
                       payload, signature, timestamp, tx_hash 
                FROM transactions ORDER BY timestamp DESC
            ''')
            rows = cursor.fetchall()
            conn.close()
            
            import json
            transactions = []
            for row in rows:
                try:
                    payload = json.loads(row[4])
                except:
                    payload = {}
                
                tx = Transaction(
                    tx_id=row[0],
                    sender_pubkey=row[1],
                    sender_address=row[2],
                    recipient_address=row[3],
                    payload=payload,
                    signature=row[5],
                    timestamp=row[6],
                    tx_hash=row[7]
                )
                transactions.append(tx)
            return transactions
        except Exception as e:
            print(f"Error getting all transactions: {e}")
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
    def update_transaction(transaction: Transaction) -> bool:
        """Update transaction"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE transactions 
                SET sender_pubkey = ?, sender_address = ?, recipient_address = ?,
                    payload = ?, signature = ?, tx_hash = ?
                WHERE tx_id = ?
            ''', (transaction.sender_pubkey, transaction.sender_address,
                  transaction.recipient_address, str(transaction.payload),
                  transaction.signature, transaction.tx_hash, transaction.tx_id))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating transaction: {e}")
            return False

    @staticmethod
    def delete_transaction(tx_id: str) -> bool:
        """Delete transaction by tx_id"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM transactions WHERE tx_id = ?', (tx_id,))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error deleting transaction: {e}")
            return False

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
        """Get transactions in date range"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT tx_id, sender_pubkey, sender_address, recipient_address, 
                       payload, signature, timestamp, tx_hash 
                FROM transactions 
                WHERE timestamp >= ? AND timestamp <= ?
                ORDER BY timestamp DESC
            ''', (start_timestamp, end_timestamp))
            rows = cursor.fetchall()
            conn.close()
            
            import json
            transactions = []
            for row in rows:
                try:
                    payload = json.loads(row[4])
                except:
                    payload = {}
                
                tx = Transaction(
                    tx_id=row[0],
                    sender_pubkey=row[1],
                    sender_address=row[2],
                    recipient_address=row[3],
                    payload=payload,
                    signature=row[5],
                    timestamp=row[6],
                    tx_hash=row[7]
                )
                transactions.append(tx)
            return transactions
        except Exception as e:
            print(f"Error getting transactions by date range: {e}")
            return []
