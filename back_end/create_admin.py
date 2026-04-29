import sys
import os
import sqlite3

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.utils.CryptoUtils import CryptoUtils
from app.database.database import DB_PATH

def create_admin():
    pub, priv = CryptoUtils.generate_key_pair()
    addr = CryptoUtils.get_address_from_pubkey(pub)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Xóa admin cũ nếu có
        cursor.execute("SELECT address FROM account WHERE role = 'moet'")
        old = cursor.fetchone()
        if old:
            print(f"⚠️  Đang xóa admin cũ: {old[0]}")
            cursor.execute("DELETE FROM account WHERE role = 'moet'")

        # Tạo admin mới
        cursor.execute('''
            INSERT INTO account (address, public_key, role, full_name, email, vault, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            addr,
            pub,
            'moet',
            'Bộ Giáo Dục (Admin)',
            'admin@moet.gov.vn',
            None,
            1
        ))
        conn.commit()

        print("\n✅ TÀI KHOẢN ADMIN MOET ĐÃ ĐƯỢC TẠO THÀNH CÔNG")
        print("=" * 60)
        print(f"Địa chỉ ví:  {addr}")
        print(f"Public Key:  {pub[:40]}...")
        print("=" * 60)
        print("\n🔑 MÃ PRIVATE KEY CỦA ADMIN:")
        print("BẠN HÃY COPY MÃ DƯỚI ĐÂY ĐỂ ĐĂNG NHẬP VÀO TRANG QUẢN TRỊ:")
        print(f"\n{priv}\n")
        print("=" * 60)

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_admin()
