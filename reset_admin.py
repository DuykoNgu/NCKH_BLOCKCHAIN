"""
Script: Xoá tài khoản MOET cũ & tạo tài khoản MOET mới.
Chạy từ thư mục NCKH_BLOCKCHAIN:  python reset_admin.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'back_end'))

from back_end.app.utils.CryptoUtils import CryptoUtils
from back_end.app.database.database import DB_PATH
import sqlite3

def reset_admin():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Xem tài khoản MOET cũ
    c.execute("SELECT address, full_name FROM account WHERE role = 'moet'")
    old = c.fetchall()
    print(f"\n[1] Tìm thấy {len(old)} tài khoản MOET cũ:")
    for row in old:
        print(f"    - {row[0]}  ({row[1]})")

    # 2. Xoá hết
    c.execute("DELETE FROM account WHERE role = 'moet'")
    conn.commit()
    print(f"\n[2] Đã xoá {c.rowcount} tài khoản MOET.")

    # 3. Tạo mới
    pub, priv = CryptoUtils.generate_key_pair()
    addr = CryptoUtils.get_address_from_pubkey(pub)

    c.execute("""
        INSERT INTO account (address, public_key, role, full_name, email, is_active)
        VALUES (?, ?, 'moet', 'Bộ Giáo dục & Đào tạo (MOET Admin)', 'admin@moet.gov.vn', 1)
    """, (addr, pub))
    conn.commit()
    conn.close()

    print("\n" + "="*60)
    print("  TÀI KHOẢN MOET MỚI ĐÃ ĐƯỢC TẠO")
    print("="*60)
    print(f"  Address    : {addr}")
    print(f"  Public Key : {pub}")
    print(f"  Private Key: {priv}")
    print("="*60)
    print("  ⚠️  Lưu Private Key ở nơi an toàn – không chia sẻ với ai!")
    print("  Dùng Private Key này để đăng nhập lần đầu tại /moet-login")
    print("="*60 + "\n")

if __name__ == "__main__":
    reset_admin()
