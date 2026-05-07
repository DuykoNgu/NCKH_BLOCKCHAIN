"""AccountRepository - Data access layer for account operations"""
from typing import Optional, List
import time
from app.database.connection import get_connection, acquire_write_lock, release_write_lock
from app.models.Account import Account
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AccountRepository:
    """Repository for account database operations"""

    @staticmethod
    def create_account(account: Account, max_retries: int = 3) -> bool:
        """Create a new account in database
        
        Uses global write lock to serialize database writes and prevent lock contention
        """
        retry_delay = 0.1
        
        for attempt in range(max_retries):
            lock_acquired = False
            try:
                # Acquire global write lock
                if not acquire_write_lock(timeout=30):
                    logger.warning(f"⚠ Could not acquire lock, retry #{attempt + 1}/{max_retries} for account {account.address}")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                
                lock_acquired = True
                
                conn = get_connection()
                cursor = conn.cursor()
                
                # Convert role enum to string value
                role_value = account.role.value if hasattr(account.role, 'value') else str(account.role)
                
                cursor.execute('''
                    INSERT INTO account (public_key, address, role, org_name, full_name, avatar_url, tax_id, representative, email, phone, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (account.public_key, account.address, role_value, account.org_name, 
                      account.full_name, account.avatar_url, account.tax_id, account.representative, account.email, account.phone, account.is_active, account.created_at))
                conn.commit()
                
                # Check if insert was successful (rowcount > 0) or skipped (duplicate)
                inserted = cursor.rowcount > 0
                conn.close()
                
                if inserted:
                    logger.info(f"✓ Account created: {account.address} (role={role_value})")
                    return True
                else:
                    logger.warning(f"⚠ Account not created (may already exist): {account.address}")
                    return False
                    
            except Exception as e:
                if "locked" in str(e).lower() and attempt < max_retries - 1:
                    logger.warning(f"⚠ Database locked, retry #{attempt + 1}/{max_retries} for account {account.address}")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                else:
                    logger.error(f"✗ Error creating account {account.address}: {e}")
                    return False
            finally:
                if lock_acquired:
                    release_write_lock()
        
        return False
        
    @staticmethod
    def get_account_by_address(address: str) -> Optional[Account]:
        """Get account by address"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT public_key, address, role, org_name, is_active, created_at, full_name, avatar_url, tax_id, representative, email, phone, vault FROM account WHERE address = ?', (address,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return Account(
                    public_key=row[0],
                    address=row[1],
                    role=row[2],
                    org_name=row[3],
                    full_name=row[6] if len(row) > 6 else None,
                    avatar_url=row[7] if len(row) > 7 else None,
                    tax_id=row[8] if len(row) > 8 else None,
                    representative=row[9] if len(row) > 9 else None,
                    email=row[10] if len(row) > 10 else None,
                    phone=row[11] if len(row) > 11 else None,
                    vault=row[12] if len(row) > 12 else None,
                    is_active=row[4],
                    created_at=row[5]
                )
            return None
        except Exception as e:
            logger.error(f"Error getting account by address: {e}")
            return None

    @staticmethod
    def get_account_by_identifier(identifier: str) -> Optional[Account]:
        """Get account by address or full_name (helper for login)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            identifier_lower = identifier.lower().strip()

            # Try address first
            cursor.execute('SELECT public_key, address, role, org_name, is_active, created_at, full_name, avatar_url, tax_id, representative, email, phone, vault FROM account WHERE address = ?', (identifier_lower,))
            row = cursor.fetchone()

            # If not found, do Python-side case-insensitive full_name search
            # (SQLite LOWER() doesn't handle Vietnamese Unicode correctly)
            if not row:
                cursor.execute('SELECT public_key, address, role, org_name, is_active, created_at, full_name, avatar_url, tax_id, representative, email, phone, vault FROM account WHERE full_name IS NOT NULL')
                all_rows = cursor.fetchall()

                # 1st pass: exact match (lowercased)
                for r in all_rows:
                    db_name = r[6] or ''
                    if db_name.lower().strip() == identifier_lower:
                        row = r
                        break

                # 2nd pass: partial/contains match
                if not row:
                    for r in all_rows:
                        db_name = r[6] or ''
                        if identifier_lower in db_name.lower():
                            row = r
                            break

            conn.close()

            if row:
                return Account(
                    public_key=row[0], address=row[1], role=row[2], org_name=row[3],
                    full_name=row[6] if len(row) > 6 else None,
                    avatar_url=row[7] if len(row) > 7 else None,
                    tax_id=row[8] if len(row) > 8 else None,
                    representative=row[9] if len(row) > 9 else None,
                    email=row[10] if len(row) > 10 else None,
                    phone=row[11] if len(row) > 11 else None,
                    vault=row[12] if len(row) > 12 else None,
                    is_active=row[4], created_at=row[5]
                )
            return None
        except Exception as e:
            logger.error(f"Error getting account by identifier: {e}")
            return None

    @staticmethod
    def get_all_accounts() -> List[Account]:
        """Get all accounts"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT public_key, address, role, org_name, is_active, created_at, full_name, avatar_url, tax_id, representative, email, phone, vault FROM account')
            rows = cursor.fetchall()
            conn.close()
            
            clients = []
            for row in rows:
                clients.append(Account(
                    public_key=row[0],
                    address=row[1],
                    role=row[2],
                    org_name=row[3],
                    full_name=row[6] if len(row) > 6 else None,
                    avatar_url=row[7] if len(row) > 7 else None,
                    tax_id=row[8] if len(row) > 8 else None,
                    representative=row[9] if len(row) > 9 else None,
                    email=row[10] if len(row) > 10 else None,
                    phone=row[11] if len(row) > 11 else None,
                    vault=row[12] if len(row) > 12 else None,
                    is_active=row[4],
                    created_at=row[5]
                ))
            return clients
        except Exception as e:
            logger.error(f"Error getting all accounts: {e}")
            return []

    @staticmethod
    def update_account(account: Account) -> bool:
        """Update account by address"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Convert role enum to string value safely
            role_value = account.role.value if hasattr(account.role, 'value') else str(account.role)
            
            cursor.execute('''
                UPDATE account 
                SET public_key = ?, role = ?, org_name = ?, full_name = ?, avatar_url = ?, tax_id = ?, representative = ?, email = ?, phone = ?, vault = ?, is_active = ?
                WHERE address = ?
            ''', (account.public_key, role_value, 
                  account.org_name, account.full_name, account.avatar_url, account.tax_id, account.representative, account.email, account.phone, account.vault, account.is_active, account.address))
            conn.commit()
            updated = cursor.rowcount > 0
            conn.close()
            
            if updated:
                logger.info(f"Successfully updated account: {account.address}, is_active: {account.is_active}")
            else:
                logger.warning(f"No account found to update with address: {account.address}")
            
            return updated
        except Exception as e:
            logger.error(f"Error updating account {account.address}: {e}")
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

    @staticmethod
    def check_email_exists(email: str) -> bool:
        """Check if an account with this email already exists"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT 1 FROM account WHERE email = ?', (email,))
            row = cursor.fetchone()
            conn.close()
            return row is not None
        except Exception as e:
            logger.error(f"Error checking email: {e}")
            return False
