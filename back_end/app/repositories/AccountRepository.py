"""
AccountRepository - Web3 + Backend API pattern

Schema thay đổi:
- Bỏ public_key khỏi PRIMARY data (không dùng làm identity)
- Thêm profile_tx_hash → trỏ đến tx on-chain chứa profile data
- Bảng accounts chỉ lưu: address, role, is_active, profile_tx_hash
  (index/cache cho query nhanh — source of truth là chain)
"""
from typing import Optional, List
from app.database.connection import get_connection
from app.models.Account import Account, Role
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AccountRepository:

    @staticmethod
    def create_account(account: Account) -> bool:
        """
        Tạo account lần đầu khi REGISTER_IDENTITY tx được confirm.
        Không lưu public_key — address là identity duy nhất.
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            role_value = account.role.value if hasattr(account.role, 'value') else str(account.role)

            cursor.execute('''
                INSERT INTO accounts
                    (address, role, org_name, is_active, created_at, profile_tx_hash)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                account.address,
                role_value,
                account.org_name,
                account.is_active,
                account.created_at,
                account.profile_tx_hash,
            ))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"[AccountRepo] create_account error: {e}")
            return False

    @staticmethod
    def update_role(address: str, role: Role) -> bool:
        """
        Cập nhật role sau khi ASSIGN_ROLE tx được confirm on-chain.
        Chỉ được gọi bởi ChainIndexer, KHÔNG phải từ API request trực tiếp.
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                'UPDATE accounts SET role = ? WHERE address = ?',
                (role.value if hasattr(role, 'value') else str(role), address)
            )
            conn.commit()
            conn.close()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"[AccountRepo] update_role error: {e}")
            return False

    @staticmethod
    def update_profile_tx_hash(address: str, tx_hash: str,
                                full_name: str = None, avatar_url: str = None) -> bool:
        """
        Cập nhật profile_tx_hash sau khi UPDATE_PROFILE tx confirm.
        Cache full_name + avatar_url để frontend không cần fetch chain mỗi lần.
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE accounts
                SET profile_tx_hash = ?, full_name = ?, avatar_url = ?
                WHERE address = ?
            ''', (tx_hash, full_name, avatar_url, address))
            conn.commit()
            conn.close()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"[AccountRepo] update_profile_tx_hash error: {e}")
            return False

    @staticmethod
    def deactivate(address: str) -> bool:
        """Deactivate account — không xóa để giữ audit trail."""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                'UPDATE accounts SET is_active = 0 WHERE address = ?', (address,)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"[AccountRepo] deactivate error: {e}")
            return False

    @staticmethod
    def get_by_address(address: str) -> Optional[Account]:
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT address, role, org_name, full_name, avatar_url,
                       profile_tx_hash, is_active, created_at
                FROM accounts WHERE address = ?
            ''', (address.lower(),))
            row = cursor.fetchone()
            conn.close()

            if not row:
                return None

            return Account(
                address=row[0],
                role=row[1],  # from_dict sẽ convert string → Role enum
                org_name=row[2],
                full_name=row[3],
                avatar_url=row[4],
                profile_tx_hash=row[5],
                is_active=row[6],
                created_at=row[7],
            )
        except Exception as e:
            logger.error(f"[AccountRepo] get_by_address error: {e}")
            return None

    @staticmethod
    def get_all() -> List[Account]:
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT address, role, org_name, full_name, avatar_url,
                       profile_tx_hash, is_active, created_at
                FROM accounts ORDER BY created_at DESC
            ''')
            rows = cursor.fetchall()
            conn.close()

            return [Account(
                address=r[0],
                role=r[1],
                org_name=r[2],
                full_name=r[3],
                avatar_url=r[4],
                profile_tx_hash=r[5],
                is_active=r[6],
                created_at=r[7],
            ) for r in rows]
        except Exception as e:
            logger.error(f"[AccountRepo] get_all error: {e}")
            return []

    @staticmethod
    def exists(address: str) -> bool:
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT 1 FROM accounts WHERE address = ?', (address.lower(),))
            result = cursor.fetchone()
            conn.close()
            return result is not None
        except Exception as e:
            logger.error(f"[AccountRepo] exists error: {e}")
            return False
