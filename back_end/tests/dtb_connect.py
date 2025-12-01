import sqlite3
import os
import sys
import unittest
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.connection import get_connection, close_connection


class TestDatabaseConnection(unittest.TestCase):
    """Test suite for database connection"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test database connection"""
        cls.db_path = "NCKH_educhain.db"
    
    def test_database_connection(self):
        """Test if database connection is successful"""
        try:
            test_conn = get_connection()
            self.assertIsNotNone(test_conn, "Database connection failed")
            close_connection(test_conn)
            print("✓ Database connection successful")
        except Exception as e:
            self.fail(f"Database connection failed: {str(e)}")
    
    def test_database_file_exists(self):
        """Test if database file exists"""
        db_exists = os.path.exists(self.db_path)
        self.assertTrue(db_exists, f"Database file not found at {self.db_path}")
        print(f"✓ Database file exists at {self.db_path}")
    
    def test_cursor_creation(self):
        """Test if cursor can be created"""
        try:
            test_conn = get_connection()
            test_cursor = test_conn.cursor()
            self.assertIsNotNone(test_cursor, "Cursor creation failed")
            close_connection(test_conn)
            print("✓ Cursor creation successful")
        except Exception as e:
            self.fail(f"Cursor creation failed: {str(e)}")
    
    def test_list_tables(self):
        """Test if we can list existing tables"""
        try:
            test_conn = get_connection()
            test_cursor = test_conn.cursor()
            
            test_cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = test_cursor.fetchall()
            self.assertIsNotNone(tables, "Failed to retrieve tables")
            print(f"✓ Tables found: {len(tables)} table(s)")
            
            close_connection(test_conn)
        except Exception as e:
            self.fail(f"Failed to list tables: {str(e)}")


def run_quick_test():
    """Quick connection test"""
    print("\n" + "="*50)
    print("Database Connection Quick Test")
    print("="*50 + "\n")
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        print("✓ Connected to database successfully")
        print(f"✓ Database file: NCKH_educhain.db")
        
        # List existing tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"✓ Existing tables: {len(tables)} table(s)")
        for table in tables:
            print(f"  - {table[0]}")
        
        close_connection(conn)
        print("\n✓ All quick tests passed!")
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False
    
    return True




if __name__ == "__main__":
    # Run quick test first
    run_quick_test()
    
    print("\n" + "="*50)
    print("Running Full Test Suite")
    print("="*50 + "\n")
    
    # Run full unit tests
    unittest.main(verbosity=2)
