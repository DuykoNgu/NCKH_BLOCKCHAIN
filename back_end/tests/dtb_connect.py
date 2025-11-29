import sqlite3
import os
import sys
import unittest
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestDatabaseConnection(unittest.TestCase):
    """Test suite for database connection"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test database connection"""
        cls.db_path = "./app/database/NCKH_educhain.db"
    
    def test_database_connection(self):
        """Test if database connection is successful"""
        try:
            test_conn = sqlite3.connect(self.db_path)
            self.assertIsNotNone(test_conn, "Database connection failed")
            test_conn.close()
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
            test_conn = sqlite3.connect(self.db_path)
            test_cursor = test_conn.cursor()
            self.assertIsNotNone(test_cursor, "Cursor creation failed")
            test_conn.close()
            print("✓ Cursor creation successful")
        except Exception as e:
            self.fail(f"Cursor creation failed: {str(e)}")
    
    def test_create_table(self):
        """Test if table creation works"""
        try:
            test_conn = sqlite3.connect(self.db_path)
            test_cursor = test_conn.cursor()
            
            query = """CREATE TABLE IF NOT EXISTS test_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE
            )"""
            
            test_cursor.execute(query)
            test_conn.commit()
            print("✓ Table creation successful")
            
            test_conn.close()
        except Exception as e:
            self.fail(f"Table creation failed: {str(e)}")
        except Exception as e:
            self.fail(f"Table creation failed: {str(e)}")
    
    def test_insert_data(self):
        """Test if data insertion works"""
        try:
            test_conn = sqlite3.connect(self.db_path)
            test_cursor = test_conn.cursor()
            
            # Create table first
            test_cursor.execute("""CREATE TABLE IF NOT EXISTS test_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE
            )""")
            
            # Insert test data
            test_cursor.execute(
                "INSERT INTO test_users (name, email) VALUES (?, ?)",
                ("Test User", "test@example.com")
            )
            test_conn.commit()
            
            # Verify insertion
            test_cursor.execute("SELECT * FROM test_users WHERE name = ?", ("Test User",))
            result = test_cursor.fetchone()
            self.assertIsNotNone(result, "Data insertion verification failed")
            print("✓ Data insertion successful")
            
            test_conn.close()
        except Exception as e:
            self.fail(f"Data insertion failed: {str(e)}")


def run_quick_test():
    """Quick connection test"""
    print("\n" + "="*50)
    print("Database Connection Quick Test")
    print("="*50 + "\n")
    
    db_path = "./app/database/NCKH_educhain.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        print("✓ Connected to database successfully")
        print(f"✓ Database file: {db_path}")
        
        # Create users table if not exists
        cursor.execute("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT
        )""")
        conn.commit()
        print("✓ Users table ready")
        
        conn.close()
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
