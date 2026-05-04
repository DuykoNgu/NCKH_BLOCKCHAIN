import sqlite3
import os

DB_DIR = r"d:\NCKH\NCKH_BLOCKCHAIN\back_end\app\database"
DB_PATH = os.path.join(DB_DIR, 'NCKH_educhain.db')

def promote_to_moet(address):
    if not os.path.exists(DB_PATH):
        print(f"Database file not found at {DB_PATH}")
        return
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if account exists
    address = address.lower()
    cursor.execute("SELECT address, role FROM account WHERE address = ?", (address,))
    row = cursor.fetchone()
    
    if not row:
        print(f"Account {address} not found in database.")
        # Optional: List existing accounts to help debugging
        cursor.execute("SELECT address FROM account")
        all_accounts = cursor.fetchall()
        print("Existing accounts:")
        for acc in all_accounts:
            print(f" - {acc[0]}")
        conn.close()
        return

    # Update role to moet
    cursor.execute("UPDATE account SET role = 'moet', is_active = 1 WHERE address = ?", (address,))
    conn.commit()
    
    print(f"Successfully promoted {address} to MOET role.")
    conn.close()

if __name__ == "__main__":
    # The address from the user's previous error log
    target_address = "0xa2f11e5579b0e55926b7379bac223e7f1cd26178"
    promote_to_moet(target_address)
