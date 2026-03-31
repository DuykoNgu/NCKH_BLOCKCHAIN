import sqlite3
import os
from app.database.database import DB_PATH

def get_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    return conn

def close_connection(conn):
    """Close database connection"""
    if conn:
        conn.close()

        
        