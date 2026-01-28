import sqlite3
import os

# Get the directory where this file is located
DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, 'NCKH_educhain.db')

def get_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    return conn

def close_connection(conn):
    """Close database connection"""
    if conn:
        conn.close()

        
        