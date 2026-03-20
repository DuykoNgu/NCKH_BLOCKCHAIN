"""
TransactionRepository - Web3 pattern

Thay đổi so với cũ:
- Thêm tx_type + nonce vào schema
- Index theo tx_type để query nhanh (MINT_NFT, ASSIGN_ROLE...)
- sender_pubkey lưu để verify offline, không phải để làm identity
"""
import json
from typing import Optional, List
from app.database.connection import get_connection
from app.models.Transaction import Transaction, TxType
from app.utils.logger import get_logger

logger = get_logger(__name__)

BASE_SELECT = """
    SELECT tx_hash, tx_id, tx_type, sender_address, sender_pubkey,
           recipient_address, payload, nonce, signature, timestamp, block_id
    FROM transactions
"""


class TransactionRepository:
    @staticmethod
    def create(tx: Transaction) -> bool:
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO transactions
                    (tx_hash, tx_id, tx_type, sender_address, sender_pubkey,
                     recipient_address, payload, nonce, signature, timestamp, block_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                tx.tx_hash,
                tx.tx_id,
                tx.tx_type.value,
                tx.sender_address,
                tx.sender_pubkey,
                tx.recipient_address,
                json.dumps(tx.payload),
                tx.nonce,
                tx.signature,
                tx.timestamp,
                tx.block_id,
            ))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"[TxRepo] create error: {e}")
            return False

    @staticmethod
    def update_block_id(tx_hash: str, block_id: str) -> bool:
        """Gắn block_id sau khi tx được confirm vào block."""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                'UPDATE transactions SET block_id = ? WHERE tx_hash = ?',
                (block_id, tx_hash)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"[TxRepo] update_block_id error: {e}")
            return False
        
    @staticmethod
    def get_by_hash(tx_hash: str) -> Optional[Transaction]:
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(f"{BASE_SELECT} WHERE tx_hash = ?", (tx_hash,))
            row = cursor.fetchone()
            conn.close()
            return TransactionRepository._parse(row)
        except Exception as e:
            logger.error(f"[TxRepo] get_by_hash error: {e}")
            return None

    @staticmethod
    def get_by_sender(sender_address: str) -> List[Transaction]:
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                f"{BASE_SELECT} WHERE sender_address = ? ORDER BY timestamp DESC",
                (sender_address.lower(),)
            )
            rows = cursor.fetchall()
            conn.close()
            return [TransactionRepository._parse(r) for r in rows if r]
        except Exception as e:
            logger.error(f"[TxRepo] get_by_sender error: {e}")
            return []

    @staticmethod
    def get_by_recipient(recipient_address: str) -> List[Transaction]:
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                f"{BASE_SELECT} WHERE recipient_address = ? ORDER BY timestamp DESC",
                (recipient_address.lower(),)
            )
            rows = cursor.fetchall()
            conn.close()
            return [TransactionRepository._parse(r) for r in rows if r]
        except Exception as e:
            logger.error(f"[TxRepo] get_by_recipient error: {e}")
            return []

    @staticmethod
    def get_by_type(tx_type: TxType) -> List[Transaction]:
        """
        Query theo loại tx — ví dụ lấy tất cả MINT_NFT để index NFTs.
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                f"{BASE_SELECT} WHERE tx_type = ? ORDER BY timestamp DESC",
                (tx_type.value,)
            )
            rows = cursor.fetchall()
            conn.close()
            return [TransactionRepository._parse(r) for r in rows if r]
        except Exception as e:
            logger.error(f"[TxRepo] get_by_type error: {e}")
            return []

    @staticmethod
    def get_by_address_and_type(address: str, tx_type: TxType) -> List[Transaction]:
        """Lấy tx theo sender + type — ví dụ: tất cả MINT_NFT của một MOET."""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                f"{BASE_SELECT} WHERE sender_address = ? AND tx_type = ? ORDER BY timestamp DESC",
                (address.lower(), tx_type.value)
            )
            rows = cursor.fetchall()
            conn.close()
            return [TransactionRepository._parse(r) for r in rows if r]
        except Exception as e:
            logger.error(f"[TxRepo] get_by_address_and_type error: {e}")
            return []

    @staticmethod
    def get_pending() -> List[Transaction]:
        """Lấy transactions chưa được confirm vào block (block_id rỗng)."""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                f"{BASE_SELECT} WHERE block_id = '' OR block_id IS NULL ORDER BY timestamp ASC"
            )
            rows = cursor.fetchall()
            conn.close()
            return [TransactionRepository._parse(r) for r in rows if r]
        except Exception as e:
            logger.error(f"[TxRepo] get_pending error: {e}")
            return []

    @staticmethod
    def count() -> int:
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions')
            count = cursor.fetchone()[0]
            conn.close()
            return count
        except Exception as e:
            logger.error(f"[TxRepo] count error: {e}")
            return 0

    @staticmethod
    def _parse(row) -> Optional[Transaction]:
        if not row:
            return None
        try:
            return Transaction(
                tx_hash=row[0],
                tx_id=row[1],
                tx_type=TxType(row[2]),
                sender_address=row[3],
                sender_pubkey=row[4],
                recipient_address=row[5],
                payload=json.loads(row[6]) if row[6] else {},
                nonce=row[7],
                signature=row[8],
                timestamp=row[9],
                block_id=row[10],
            )
        except Exception as e:
            logger.error(f"[TxRepo] _parse error: {e}")
            return None
