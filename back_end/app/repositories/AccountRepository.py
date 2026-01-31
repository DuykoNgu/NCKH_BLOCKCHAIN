"""AccountRepository - Data access layer for account operations"""
from typing import Optional, List
from app.database.connection import get_connection
from app.models.Account import Account
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AccountRepository:
    """Repository for account database operations"""

    @staticmethod
    def create_account(account: Account) -> bool:
        """Create a new account in database"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Convert role enum to string value
            role_value = account.role.value if hasattr(account.role, 'value') else str(account.role)
            
            cursor.execute('''
                INSERT INTO account (public_key, address,role,org_name,is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (account.public_key, account.address, role_value, account.org_name, account.is_active, account.created_at))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error creating account: {e}")
            return False
        
    @staticmethod
    def get_account_by_address(address: str) -> Optional[Account]:
        """Get account by address"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT public_key, address,role,org_name,is_active, created_at FROM account WHERE address = ?', (address,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return Account(
                    public_key=row[0],
                    address=row[1],
                    role=row[2],
                    org_name=row[3],
                    is_active=row[4],
                    created_at=row[5]
                )
            return None
        except Exception as e:
            logger.error(f"Error getting account by address: {e}")
            return None

    @staticmethod
    def get_all_accounts() -> List[Account]:
        """Get all accounts"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT public_key, address,role,org_name,is_active, created_at FROM account')
            rows = cursor.fetchall()
            conn.close()
            
            clients = []
            for row in rows:
                clients.append(Account(
                    public_key=row[0],
                    address=row[1],
                    role=row[2],
                    org_name=row[3],
                    is_active=row[4],
                    created_at=row[5]
                ))
            return clients
        except Exception as e:
            logger.error(f"Error getting all clients: {e}")
            return []

    @staticmethod
    def update_account(account: Account) -> bool:
        """Update account by address"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE account 
                SET public_key = ?, role = ?, org_name = ?, is_active = ?
                WHERE address = ?
            ''', (account.public_key, account.role.value if hasattr(account.role, 'value') else account.role, 
                  account.org_name, account.is_active, account.address))
            conn.commit()
            conn.close()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating account: {e}")
            return False

    @staticmethod
    def delete_account(address: str) -> bool:
        """Delete account by address"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('DELETE FROM account WHERE address = ?', (address,))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error deleting account: {e}")
            return False
