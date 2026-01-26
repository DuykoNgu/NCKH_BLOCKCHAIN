import sqlite3
conn = sqlite3.connect('NCKH_educhain.db')
schema_sql = """
pragma foreign_keys = ON;

-------------------------------------------------
-- 1. Account (Phải tạo trước để các bảng khác tham chiếu)
-------------------------------------------------
CREATE TABLE IF NOT EXISTS account (
    address TEXT PRIMARY KEY,
    public_key TEXT NOT NULL,
    role TEXT NOT NULL,    -- 'moet', 'validator', 'client'
    org_name TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-------------------------------------------------
-- 2. NFT Metadata
-------------------------------------------------
CREATE TABLE IF NOT EXISTS nft_metadata (
    metadata_id INTEGER PRIMARY KEY AUTOINCREMENT,
    degree_type TEXT,
    pdf_url TEXT,
    pdf_hash TEXT,
    institution_address TEXT,
    issued_at REAL,
    FOREIGN KEY (institution_address) REFERENCES account(address)
);

-------------------------------------------------
-- 3. NFT
-------------------------------------------------
CREATE TABLE IF NOT EXISTS nft (
    nft_id TEXT PRIMARY KEY,
    issuer_address TEXT NOT NULL, 
    metadata_id INTEGER,
    owner_address TEXT,
    issuer_signature TEXT,
    is_valid INTEGER DEFAULT 1,
    minted_at INTEGER,
    FOREIGN KEY (metadata_id) REFERENCES nft_metadata(metadata_id) ON DELETE CASCADE,
    FOREIGN KEY (owner_address) REFERENCES account(address) ON DELETE CASCADE
);

-------------------------------------------------
-- 4. Block Header & Block (Tạo trước Transaction)
-------------------------------------------------
CREATE TABLE IF NOT EXISTS block_header (
    header_id INTEGER PRIMARY KEY AUTOINCREMENT,
    index_num INTEGER,
    pre_hash TEXT,
    merkle_root TEXT,
    validator_pubkey TEXT,
    timestamp REAL
);

CREATE TABLE IF NOT EXISTS block (
    block_id TEXT PRIMARY KEY,
    index_num INTEGER,
    header_id INTEGER,
    block_hash TEXT,
    validator_signature TEXT,
    FOREIGN KEY (header_id) REFERENCES block_header(header_id) ON DELETE CASCADE
);

-------------------------------------------------
-- 5. Transaction
-------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    tx_hash TEXT PRIMARY KEY,
    sender_address TEXT,
    recipient_address TEXT,
    signature TEXT,
    timestamp REAL,
    payload TEXT,
    block_id TEXT,
    FOREIGN KEY (sender_address) REFERENCES account(address),
    FOREIGN KEY (block_id) REFERENCES block(block_id) 
);
"""

def init_db():
     conn = sqlite3.connect('NCKH_educhain.db')
     cursor = conn.cursor()
     
     cursor.executescript(schema_sql)
     conn.commit()
     
     cursor.close()
     print("Database initialized successfully.")
     
if __name__ == "__main__":
     init_db()