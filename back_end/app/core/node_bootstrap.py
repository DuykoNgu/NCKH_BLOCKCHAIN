import os
import sys
import time
import datetime
import getpass

from app.core.config import MOET_ADMIN_KEY_PATH
from app.utils.KeystoreManager import KeystoreManager
from app.utils.CryptoUtils import CryptoUtils


def _ask_passphrase(prompt: str, confirm: bool):
    env_passphrase = os.getenv('NODE_PASSPHRASE')
    if env_passphrase:
        ok, err = KeystoreManager.validate_passphrase(env_passphrase)
        if not ok:
            print(f"  ✗ NODE_PASSPHRASE không hợp lệ: {err}")
            return None
        return env_passphrase

    if not sys.stdin.isatty():
        return None

    while True:
        passphrase = getpass.getpass(f"  {prompt} (Enter để bỏ qua → observer): ")
        if not passphrase:
            return None
        ok, err = KeystoreManager.validate_passphrase(passphrase)
        if not ok:
            print(f"  ✗ {err}")
            continue
        if confirm and getpass.getpass("  Nhập lại passphrase: ") != passphrase:
            print("  ✗ Passphrase không khớp")
            continue
        return passphrase


def load_node_identity(keystore_path: str):
    if os.path.exists(keystore_path):
        keystore_data = KeystoreManager.load_keystore(keystore_path)
        if not keystore_data:
            return "", None
        public_key = keystore_data['public_key']
        while True:
            passphrase = _ask_passphrase("Passphrase để kích hoạt validator", confirm=False)
            if not passphrase:
                return public_key, None
            private_key = KeystoreManager.decrypt_private_key(keystore_data, passphrase)
            if private_key:
                return public_key, private_key
            print("  ✗ Sai passphrase")
            if os.getenv('NODE_PASSPHRASE'):
                return public_key, None

    print(f"  Chưa có keystore tại {keystore_path} → tạo mới")
    passphrase = _ask_passphrase("Đặt passphrase cho keystore mới", confirm=True)
    if not passphrase:
        return "", None

    public_key, private_key = CryptoUtils.generate_key_pair()
    keystore_data = KeystoreManager.encrypt_private_key(private_key, passphrase)
    keystore_data['public_key'] = public_key
    keystore_data['address'] = CryptoUtils.get_address_from_pubkey(public_key)
    keystore_data['created_at'] = int(time.time())
    if not KeystoreManager.save_keystore(keystore_path, keystore_data):
        return "", None
    print(f"  ✅ Đã tạo keystore (address: {keystore_data['address']})")
    return public_key, private_key


def submit_system_tx(payload: dict, public_key: str, private_key: str):
    from app.models.Transaction import Transaction
    from app.services.TransactionService import TransactionService
    from app.services.BlockChainService import BlockChainService
    from app.services.NetworkService import get_network_service
    from app.repositories.TransactionRepository import TransactionRepository
    from app.blockchain_instance import get_blockchain_instance

    tx = Transaction(
        sender_pubkey=public_key,
        sender_address="system",
        recipient_address="system",
        payload=payload,
        timestamp=datetime.datetime.now().timestamp(),
        block_id=None
    )
    TransactionService.sign(tx, private_key)

    if not BlockChainService.add_transaction_to_mempool(get_blockchain_instance(), tx):
        print(f"✗ Không thêm được giao dịch {payload.get('op')} vào mempool")
        return None
    TransactionRepository.create_transaction(tx)
    try:
        get_network_service().broadcast_transaction(tx.to_dict())
    except Exception as e:
        print(f"⚠ Không broadcast được giao dịch {payload.get('op')}: {e}")
    print(f"✓ Đã gửi giao dịch {payload.get('op')} ({tx.tx_hash[:16]}...)")
    return tx


def activate_validator(public_key: str, private_key: str) -> bool:
    from consensus.validator_worker import get_validator_worker
    from app.controllers.v1.AuthController import try_update_peer_after_activation

    worker = get_validator_worker()
    if worker is None or not worker.activate(private_key):
        return False
    try_update_peer_after_activation(worker, public_key, private_key)
    return True


def ensure_moet_admin(moet_public_key: str, moet_private_key: str) -> None:
    from app.database.connection import get_connection, close_connection

    conn = get_connection()
    try:
        if conn.execute("SELECT 1 FROM account WHERE role = 'moet'").fetchone():
            return
    finally:
        close_connection(conn)

    if os.path.exists(MOET_ADMIN_KEY_PATH):
        with open(MOET_ADMIN_KEY_PATH) as f:
            private_key = dict(line.strip().split('=', 1) for line in f if '=' in line)['private_key']
        public_key = CryptoUtils.get_public_key_from_private(private_key)
    else:
        public_key, private_key = CryptoUtils.generate_key_pair()
    address = CryptoUtils.get_address_from_pubkey(public_key)

    with open(MOET_ADMIN_KEY_PATH, 'w') as f:
        f.write(f"address={address}\nprivate_key={private_key}\n")
    os.chmod(MOET_ADMIN_KEY_PATH, 0o600)

    submit_system_tx({
        "op": "account_register",
        "address": address,
        "public_key": public_key,
        "role": "moet",
        "full_name": "Bộ Giáo Dục (Admin)",
        "email": "admin@moet.gov.vn",
        "created_at": datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
    }, moet_public_key, moet_private_key)
    print(f"  ✅ Đã gửi đăng ký admin MOET lên chain ({address})")
    print(f"     Private key để đăng nhập trang admin: {MOET_ADMIN_KEY_PATH}")
