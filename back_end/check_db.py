import sqlite3
import os

DB_DIR = r"d:\NCKH\NCKH_BLOCKCHAIN\back_end\app\database"
DB_PATH = os.path.join(DB_DIR, 'NCKH_educhain.db')

def check_accounts():
    if not os.path.exists(DB_PATH):
        print(f"Database file not found at {DB_PATH}")
        return
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT address, role, full_name FROM account")
    accounts = cursor.fetchall()
    
    print(f"Total accounts: {len(accounts)}")
    for acc in accounts:
        print(f"Address: {acc[0]}, Role: {acc[1]}, Name: {acc[2]}")
        
    conn.close()

if __name__ == "__main__":
    check_accounts()
