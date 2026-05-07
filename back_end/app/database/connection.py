import sqlite3
import os
import threading
import time
from app.database import database

# Global lock for serializing database writes
_db_write_lock = threading.RLock()
_lock_file_path = os.path.join(os.path.dirname(database.DB_PATH), ".db_lock")

def get_connection():
    """Get database connection with proper timeout and isolation level"""
    conn = sqlite3.connect(database.DB_PATH, timeout=60.0, check_same_thread=False)
    # CRITICAL: Use autocommit mode (isolation_level=None) to avoid holding transactions
    # This prevents readers from blocking writers in SQLite WAL mode
    conn.isolation_level = None
    # Set WAL mode for better concurrency
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA busy_timeout=60000')  # 60 second busy timeout
    conn.execute('PRAGMA synchronous=NORMAL')  # Balance safety and performance
    conn.execute('PRAGMA cache_size=10000')    # Increase cache
    conn.execute('PRAGMA foreign_keys=ON')
    return conn

def close_connection(conn):
    """Close database connection"""
    if conn:
        try:
            conn.close()
        except Exception:
            pass

def get_write_lock():
    """Get the global write lock for serializing database writes"""
    return _db_write_lock

def acquire_write_lock(timeout=30):
    """Acquire the global write lock with timeout
    
    Returns True if lock acquired, False if timeout
    """
    return _db_write_lock.acquire(timeout=timeout)

def release_write_lock():
    """Release the global write lock"""
    try:
        _db_write_lock.release()
    except RuntimeError:
        pass  # Lock was not acquired
