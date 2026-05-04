import sqlite3
import os

DB_DIR = r"d:\NCKH\NCKH_BLOCKCHAIN\back_end\app\database"
DB_PATH = os.path.join(DB_DIR, 'NCKH_educhain.db')

def check_schema():
    if not os.path.exists(DB_PATH):
        print(f"Database file not found at {DB_PATH}")
        return
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("PRAGMA table_info(account)")
    columns = cursor.fetchall()
    
    print("Columns in 'account' table:")
    for col in columns:
        print(f"ID: {col[0]}, Name: {col[1]}, Type: {col[2]}, NotNull: {col[3]}, Default: {col[4]}, PK: {col[5]}")
        
    conn.close()

if __name__ == "__main__":
    check_schema()
