import sqlite3
import os
import threading
import time
from app.database import database

_db_write_lock = threading.RLock()
_lock_file_path = os.path.join(os.path.dirname(database.DB_PATH), ".db_lock")

def get_connection():
    conn = sqlite3.connect(database.DB_PATH, timeout=60.0, check_same_thread=False)
    conn.isolation_level = None
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA busy_timeout=60000')
    conn.execute('PRAGMA synchronous=NORMAL')
    conn.execute('PRAGMA cache_size=10000')
    conn.execute('PRAGMA foreign_keys=ON')
    return conn

def close_connection(conn):
    if conn:
        try:
            conn.close()
        except Exception:
            pass

def get_write_lock():
    return _db_write_lock

def acquire_write_lock(timeout=30):
    return _db_write_lock.acquire(timeout=timeout)

def release_write_lock():
    try:
        _db_write_lock.release()
    except RuntimeError:
        pass
