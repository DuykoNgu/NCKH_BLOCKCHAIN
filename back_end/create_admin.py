import sys
import os
import sqlite3

# Add app folder to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.utils.CryptoUtils import CryptoUtils
from app.database.database import DB_PATH

def create_admin():
    pub, priv = CryptoUtils.generate_key_pair()
    addr = CryptoUtils.get_address_from_pubkey(pub)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if already has admin
        cursor.execute("SELECT * FROM account WHERE role = 'moet'")
        existing = cursor.fetchone()
        if existing:
            print(f"Warning: Existing MOET admin found with address {existing[0]}")
            
        # Delete if any exists or just insert
        cursor.execute('''
            INSERT INTO account (address, public_key, role, full_name, email, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            addr,
            pub,
            'moet', # Admin role
            'Bộ Giáo Dục (Admin)',
            'admin@moet.gov.vn',
            1
        ))
        conn.commit()
        
        print("\n=== ADMIN ACCOUNT CREATED ===")
        print(f"Address:     {addr}")
        print(f"Public Key:  {pub}")
        print(f"Private Key: {priv}")
        print("Role:        moet")
        print("=============================\n")
        
    except Exception as e:
        print(f"Error creating admin: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    create_admin()
