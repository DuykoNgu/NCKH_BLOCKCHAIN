import sqlite3
import os
from app.database.database import DB_PATH

def get_connection():
    """Get database connection with proper timeout and isolation level"""
    conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False)
    # Set WAL mode for better concurrency
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA foreign_keys=ON')
    return conn

def close_connection(conn):
    """Close database connection"""
    if conn:
        try:
            conn.close()
        except Exception:
            pass