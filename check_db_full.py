import sqlite3
import os

db_path = r'e:\Applications\Workspace\Project\NCKH_BLOCKCHAIN\back_end\app\database\NCKH_educhain.db'
if not os.path.exists(db_path):
    print(f"File not found: {db_path}")
else:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = c.fetchall()
    print(f"Tables found: {tables}")
    for table in tables:
        table_name = table[0]
        try:
            c.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = c.fetchone()[0]
            print(f"--- Table {table_name}: {count} rows ---")
            if table_name.lower() in ['account', 'accounts']:
                 c.execute(f"SELECT address, role, full_name, is_active FROM {table_name}")
                 rows = c.fetchall()
                 for r in rows:
                     print(f"  Account: {r}")
        except Exception as e:
            print(f"Could not read {table_name}: {e}")
    conn.close()
