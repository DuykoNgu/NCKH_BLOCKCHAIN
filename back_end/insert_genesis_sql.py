import sqlite3
import os

DB_PATH = os.path.join("app", "database", "NCKH_educhain.db")

def insert_genesis():
    print(f"Connecting to {DB_PATH}...")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if genesis already exists
        cursor.execute("SELECT COUNT(*) FROM block WHERE block_id = 'GENESIS'")
        if cursor.fetchone()[0] > 0:
            print("Genesis block already exists.")
            return

        print("Inserting genesis block...")
        cursor.execute("""
            INSERT INTO block_header (header_id, index_num, pre_hash, merkle_root, validator_pubkey, timestamp) 
            VALUES (1, 0, '0000000000000000000000000000000000000000000000000000000000000000', '', 'GENESIS_PUBKEY', 1600000000.0)
        """)
        
        cursor.execute("""
            INSERT INTO block (block_id, index_num, header_id, block_hash, validator_signature) 
            VALUES ('GENESIS', 0, 1, '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f', 'GENESIS_SIG')
        """)
        
        conn.commit()
        conn.close()
        print("Genesis block inserted successfully!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    insert_genesis()
