import sqlite3
import os

# Use absolute path for database
DB_PATH = os.path.join(os.path.dirname(__file__), 'NCKH_educhain.db')
DATABASE_URL = f"sqlite:///{DB_PATH}"

def get_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    return conn

def close_connection(conn):
    """Close database connection"""
    if conn:
        conn.close()

        
        