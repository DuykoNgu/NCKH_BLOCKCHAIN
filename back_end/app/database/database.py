import sqlite3
import os

# Get database path
DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, 'node_a.db')
schema_sql = """
pragma foreign_keys = ON;
-------------------------------------------------
-- NFT Metadata
-------------------------------------------------
CREATE TABLE IF NOT EXISTS nft_metadata (
    metadata_id INTEGER PRIMARY KEY AUTOINCREMENT,
    degree_type TEXT,
    pdf_url TEXT,
    pdf_hash TEXT,
    student_id TEXT,
    institution TEXT,
    institution_address TEXT,
    issued_at REAL,
    FOREIGN KEY (institution_address) REFERENCES account(address)
);

-------------------------------------------------
-- Account
-------------------------------------------------
CREATE TABLE IF NOT EXISTS account (
    address TEXT PRIMARY KEY,
    public_key TEXT NOT NULL,
    role TEXT NOT NULL,    --'moet', 'validator', 'client'
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
    FOREIGN KEY (owner_address) REFERENCES account(address) on DELETE CASCADE
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
    payload TEXT,
    block_id TEXT,
    tx_status TEXT DEFAULT 'PENDING',  -- 'PENDING', 'COMMITTED', 'FAILED'
    error_reason TEXT,  -- Error message if tx_status = 'FAILED'
    FOREIGN KEY (sender_address) REFERENCES account(address) ON DELETE SET NULL,
    FOREIGN KEY (block_id) REFERENCES block(block_id)
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
-- 6. Peers (P2P Network)
-------------------------------------------------
CREATE TABLE IF NOT EXISTS peers (
    peer_id TEXT PRIMARY KEY,
    ip_address TEXT NOT NULL,
    port INTEGER NOT NULL,
    public_key TEXT,
    node_type TEXT,  -- 'validator', 'observer'
    status TEXT DEFAULT 'PENDING',  -- 'PENDING', 'ACTIVE', 'INACTIVE'
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def init_db():
     conn = sqlite3.connect(DB_PATH)
     cursor = conn.cursor()
     
     cursor.executescript(schema_sql)
     
     # Migration: Add columns if they don't exist
     try:
          cursor.execute("ALTER TABLE account ADD COLUMN full_name TEXT")
     except sqlite3.OperationalError:
          pass # column already exists
          
     try:
          cursor.execute("ALTER TABLE account ADD COLUMN avatar_url TEXT")
     except sqlite3.OperationalError:
          pass
          
     try:
          cursor.execute("ALTER TABLE account ADD COLUMN tax_id TEXT")
     except sqlite3.OperationalError:
          pass
          
     try:
          cursor.execute("ALTER TABLE account ADD COLUMN representative TEXT")
     except sqlite3.OperationalError:
          pass
          
     try:
          cursor.execute("ALTER TABLE account ADD COLUMN email TEXT")
     except sqlite3.OperationalError:
          pass
          
     try:
          cursor.execute("ALTER TABLE account ADD COLUMN phone TEXT")
     except sqlite3.OperationalError:
          pass
          
     try:
          cursor.execute("ALTER TABLE nft ADD COLUMN owner_address TEXT")
     except sqlite3.OperationalError:
          pass
          
     try:
          cursor.execute("ALTER TABLE nft ADD COLUMN issuer_pubkey TEXT")
     except sqlite3.OperationalError:
          pass

     try:
          cursor.execute("ALTER TABLE nft ADD COLUMN issuer_address TEXT")
     except sqlite3.OperationalError:
          pass
          
     try:
          cursor.execute("ALTER TABLE nft ADD COLUMN issuer_signature TEXT")
     except sqlite3.OperationalError:
          pass
     
     # Migration: Convert "system" sender_address to NULL for existing system transactions
     try:
          cursor.execute("""
               UPDATE transactions 
               SET sender_address = NULL 
               WHERE sender_address = 'system'
          """)
          rows_updated = cursor.rowcount
          if rows_updated > 0:
               print(f"✓ Migrated {rows_updated} system transactions (converted sender_address='system' to NULL)")
     except sqlite3.Error as e:
          print(f"⚠ Migration warning: {e}")
          
     conn.commit()
     cursor.close()
     print(f"Database initialized successfully at {DB_PATH}")
     
     # Run database migrations (e.g., add new columns)
     try:
          from app.database.migrations import run_all_migrations
          run_all_migrations()
     except Exception as e:
          print(f"⚠️  Migrations warning: {e}")
     
if __name__ == "__main__":
     init_db()