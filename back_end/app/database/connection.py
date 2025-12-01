import sqlite3

DATABASE_URL = "sqlite:///./NCKH_educhain.db"

def get_connection():
    """Get database connection"""
    conn = sqlite3.connect('NCKH_educhain.db')
    return conn

def close_connection(conn):
    """Close database connection"""
    if conn:
        conn.close()

        
        