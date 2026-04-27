import sys
import os
import sqlite3
import hashlib
import secrets
import json
import getpass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.utils.CryptoUtils import CryptoUtils
from app.database.database import DB_PATH


def encrypt_vault(private_key_hex: str, password: str) -> str:
    """
    Tạo vault theo đúng format của Frontend (cryptoVault.ts):
    - key = SHA-256(password)
    - AES-256-GCM encrypt
    - vault = { encrypted: hex, iv: hex }
    """
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    # key = SHA-256(password) — giống frontend
    key = hashlib.sha256(password.encode()).digest()
    iv = secrets.token_bytes(12)

    aesgcm = AESGCM(key)
    private_key_bytes = bytes.fromhex(private_key_hex)
    ciphertext = aesgcm.encrypt(iv, private_key_bytes, None)

    vault = {
        "encrypted": ciphertext.hex(),
        "iv": iv.hex()
    }
    return json.dumps(vault)


def create_admin():
    password = getpass.getpass("Nhập mật khẩu cho admin mới (tối thiểu 8 ký tự): ")
    if len(password) < 8:
        print("❌ Mật khẩu phải tối thiểu 8 ký tự!")
        return

    confirm = getpass.getpass("Xác nhận mật khẩu: ")
    if password != confirm:
        print("❌ Mật khẩu không khớp!")
        return

    pub, priv = CryptoUtils.generate_key_pair()
    addr = CryptoUtils.get_address_from_pubkey(pub)

    # Tạo vault
    vault_str = encrypt_vault(priv, password)

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
            vault_str,
            1
        ))
        conn.commit()

        print("\n✅ ADMIN ACCOUNT CREATED")
        print("=" * 50)
        print(f"Address:     {addr}")
        print(f"Public Key:  {pub[:40]}...")
        print(f"Role:        moet")
        print("Vault:       ✅ Đã tạo (mã hóa bằng mật khẩu)")
        print("=" * 50)
        print("\n⚠️  Lưu lại địa chỉ ví để đăng nhập trên thiết bị mới:")
        print(f"   {addr}")
        print("\n🔑 Private Key (lưu an toàn – dùng khi khôi phục):")
        print(f"   {priv}")

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    create_admin()
