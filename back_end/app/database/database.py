import sqlite3
conn = sqlite3.connect('NCKH_educhain.db')
schema_sql = """
pragma foreign_keys = ON;
-------------------------------------------------
-- NFT Metadata
-------------------------------------------------
CREATE TABLE IF NOT EXISTS nft_metadata (
    metadata_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    degree_type TEXT,
    pdf_url TEXT,
    pdf_hash TEXT,
    institution TEXT,
    issued_at INTEGER
);

-------------------------------------------------
-- Client
-------------------------------------------------
CREATE TABLE IF NOT EXISTS client (
    client_id TEXT PRIMARY KEY,
    public_key TEXT NOT NULL,
    address TEXT UNIQUE NOT NULL
);

-------------------------------------------------
-- NFT
-------------------------------------------------
CREATE TABLE IF NOT EXISTS nft (
    nft_id TEXT PRIMARY KEY,
    issuer_pubkey TEXT NOT NULL,
    issuer_address TEXT NOT NULL,

    metadata_id INTEGER,
    recipient_id TEXT,

    issuer_signature TEXT,
    is_valid INTEGER DEFAULT 1,
    minted_at INTEGER,

    FOREIGN KEY (metadata_id) REFERENCES nft_metadata(metadata_id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES client(client_id)
);

-------------------------------------------------
-- Transaction
-------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    tx_id TEXT PRIMARY KEY,
    sender_pubkey TEXT,
    sender_address TEXT,
    recipient_address TEXT,

    signature TEXT,
    timestamp REAL,
    tx_hash TEXT,

    payload TEXT
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
-- Block - Transaction (many-to-many)
-------------------------------------------------
CREATE TABLE IF NOT EXISTS block_transactions (
    block_id TEXT,
    tx_id TEXT,

    PRIMARY KEY (block_id, tx_id),

    FOREIGN KEY (block_id) REFERENCES block(block_id) ON DELETE CASCADE,
    FOREIGN KEY (tx_id) REFERENCES transactions(tx_id) ON DELETE CASCADE
);

-------------------------------------------------
-- Node
-------------------------------------------------
CREATE TABLE IF NOT EXISTS node (
    node_id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_role TEXT,
    validator_private_key TEXT,
    pub_key TEXT
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