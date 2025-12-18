"""UserRepository - Data access layer for User operations"""
from typing import Optional, List
from app.database.connection import get_connection
from app.models.User import User, UserRole


class UserRepository:
    """Repository for User database operations"""

    # =========================================================================
    # HELPER METHODS - Chuyển đổi dữ liệu từ database sang object
    # =========================================================================
    
    @staticmethod
    def user_from_row(row) -> User:
        """
        Tạo User object từ một row database.
        
        Args:
            row: Tuple từ database với format:
                (user_id, pubkey, address, role, password)
        
        Returns:
            User object đã được khởi tạo
        """
        return User(
            user_id=row[0],
            pubkey=row[1],
            address=row[2],
            role=UserRole(row[3]),
            password=row[4]
        )

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
            
            return UserRepository.user_from_row(row) if row else None
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
            
            return UserRepository.user_from_row(row) if row else None
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
            
            return [UserRepository.user_from_row(row) for row in rows]
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

    @staticmethod
    def get_users_by_role(role: UserRole) -> List[User]:
        """
        Get all users with a specific role.
        Dùng cho lấy tất cả validators, admins, etc.
        
        Args:
            role: UserRole enum value
            
        Returns:
            List of User objects with the specified role
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                'SELECT user_id, pubkey, address, role, password FROM user WHERE role = ?',
                (role.value,)
            )
            rows = cursor.fetchall()
            conn.close()
            
            return [UserRepository.user_from_row(row) for row in rows]
        except Exception as e:
            print(f"Error getting users by role: {e}")
            return []
