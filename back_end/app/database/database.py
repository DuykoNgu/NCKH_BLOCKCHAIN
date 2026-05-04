import sqlite3
import os

# Get database path
DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, 'NCKH_educhain.db')

schema_sql = """
pragma foreign_keys = ON;

-------------------------------------------------
-- Account
-------------------------------------------------
CREATE TABLE IF NOT EXISTS account (
    address TEXT PRIMARY KEY,
    public_key TEXT NOT NULL,
    role TEXT NOT NULL,
    org_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    tax_id TEXT,
    representative TEXT,
    email TEXT,
    phone TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-------------------------------------------------
-- Block Header
-------------------------------------------------
CREATE TABLE IF NOT EXISTS block_header (
    header_id INTEGER PRIMARY KEY AUTOINCREMENT,
    index_num INTEGER,
    pre_hash TEXT,
    merkle_root TEXT,
    validator_pubkey TEXT,
    timestamp REAL
);

-------------------------------------------------
-- Block
-------------------------------------------------
CREATE TABLE IF NOT EXISTS block (
    block_id TEXT PRIMARY KEY,
    index_num INTEGER,
    header_id INTEGER,
    block_hash TEXT,
    validator_signature TEXT,
    FOREIGN KEY (header_id) REFERENCES block_header(header_id) ON DELETE CASCADE
);

-------------------------------------------------
-- Transaction
-------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    tx_id TEXT PRIMARY KEY,
    sender_address TEXT,
    recipient_address TEXT,
    signature TEXT,
    timestamp REAL,
    tx_hash TEXT,
    payload TEXT,
    block_id TEXT,
    FOREIGN KEY (sender_address) REFERENCES account(address),
    FOREIGN KEY (block_id) REFERENCES block(block_id)
);

-------------------------------------------------
-- Block Transactions (Junction table)
-------------------------------------------------
CREATE TABLE IF NOT EXISTS block_transactions (
    block_id TEXT,
    tx_id TEXT,
    PRIMARY KEY (block_id, tx_id),
    FOREIGN KEY (block_id) REFERENCES block(block_id) ON DELETE CASCADE,
    FOREIGN KEY (tx_id) REFERENCES transactions(tx_id) ON DELETE CASCADE
);

-------------------------------------------------
-- NFT Metadata
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
-- NFT
-------------------------------------------------
CREATE TABLE IF NOT EXISTS nft (
    nft_id TEXT PRIMARY KEY,
    issuer_pubkey TEXT NOT NULL,
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
-- Peers (P2P Network)
-------------------------------------------------
CREATE TABLE IF NOT EXISTS peers (
    peer_id TEXT PRIMARY KEY,
    ip_address TEXT NOT NULL,
    port INTEGER NOT NULL,
    public_key TEXT,
    node_type TEXT,
    status TEXT DEFAULT 'PENDING',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # Execute full schema
    cursor.executescript(schema_sql)
    
    # Individual Migrations/Check columns
    tables_to_check = {
        "account": ["full_name", "avatar_url", "tax_id", "representative", "email", "phone"],
        "nft": ["owner_address", "issuer_pubkey", "issuer_address", "issuer_signature"]
    }
    
    for table, columns in tables_to_check.items():
        for col in columns:
            try:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} TEXT")
            except sqlite3.OperationalError:
                pass # column already exists
                
    conn.commit()
    cursor.close()
    conn.close()
    print("Database initialized successfully.")

if __name__ == "__main__":
    init_db()