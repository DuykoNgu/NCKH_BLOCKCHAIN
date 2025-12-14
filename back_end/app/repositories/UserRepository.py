"""UserRepository - Data access layer for User operations"""
from typing import Optional, List
from app.database.connection import get_connection
from app.models.User import User, UserRole


class UserRepository:
    """Repository for User database operations"""

    @staticmethod
    def create_user(user: User) -> bool:
        """Create a new user in database"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO user (user_id, pubkey, address, role, password)
                VALUES (?, ?, ?, ?, ?)
            ''', (user.user_id, user.pubkey, user.address, user.role.value, user.password))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error creating user: {e}")
            return False

    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[User]:
        """Get user by user_id"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT user_id, pubkey, address, role, password FROM user WHERE user_id = ?', (user_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return User(
                    user_id=row[0],
                    pubkey=row[1],
                    address=row[2],
                    role=UserRole(row[3]),
                    password=row[4]
                )
            return None
        except Exception as e:
            print(f"Error getting user by id: {e}")
            return None

    @staticmethod
    def get_user_by_address(address: str) -> Optional[User]:
        """Get user by address"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT user_id, pubkey, address, role, password FROM user WHERE address = ?', (address,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return User(
                    user_id=row[0],
                    pubkey=row[1],
                    address=row[2],
                    role=UserRole(row[3]),
                    password=row[4]
                )
            return None
        except Exception as e:
            print(f"Error getting user by address: {e}")
            return None

    @staticmethod
    def get_all_users() -> List[User]:
        """Get all users"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT user_id, pubkey, address, role, password FROM user')
            rows = cursor.fetchall()
            conn.close()
            
            users = []
            for row in rows:
                users.append(User(
                    user_id=row[0],
                    pubkey=row[1],
                    address=row[2],
                    role=UserRole(row[3]),
                    password=row[4]
                ))
            return users
        except Exception as e:
            print(f"Error getting all users: {e}")
            return []

    @staticmethod
    def update_user(user: User) -> bool:
        """Update user"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE user 
                SET pubkey = ?, address = ?, role = ?, password = ?
                WHERE user_id = ?
            ''', (user.pubkey, user.address, user.role.value, user.password, user.user_id))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating user: {e}")
            return False

    @staticmethod
    def delete_user(user_id: str) -> bool:
        """Delete user by user_id"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('DELETE FROM user WHERE user_id = ?', (user_id,))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False
