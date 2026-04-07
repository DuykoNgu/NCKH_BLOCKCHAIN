import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'NCKH_educhain.db')

def check_admin():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT public_key, role, is_active FROM account WHERE address = '0x857007889bf518d354646c844c560cc37dbc312a'")
    row = cursor.fetchone()
    if row:
        print(f"Public Key: {row[0]} (Length: {len(row[0])})")
        print(f"Role: {row[1]}")
        print(f"Is Active: {row[2]}")
    else:
        print("Admin account not found in DB.")
    conn.close()

if __name__ == "__main__":
    check_admin()
