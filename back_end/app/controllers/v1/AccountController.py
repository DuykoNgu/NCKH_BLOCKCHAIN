"""
user_routes.py - Web3 + Backend API pattern

Flow:
  GET  /auth/get_nonce       → client lấy nonce để ký
  POST /auth/verify          → verify sig → get_or_create account → JWT
  POST /transactions/submit  → nhận signed tx → verify → mempool → broadcast
  GET  /profile/<address>    → trả account info + profile_tx_hash
  GET  /transactions/<addr>  → lịch sử tx của address
"""
import redis
import datetime
import uuid
import jwt

from flask import Blueprint, request, jsonify

from app.core.config import SECRET_KEY, REDIS_HOST, REDIS_PORT, REDIS_DB
from app.services.AccountService import AccountService
from app.services.TransactionService import TransactionService
from app.models.Transaction import Transaction, TxType
from app.models.Account import Role
from app.utils.logger import get_logger

logger = get_logger(__name__)

user_bp = Blueprint('user_bp', __name__, url_prefix='/api/v1/users')
r = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)


# ─────────────────────────────────────────────────────────────
# HELPER: decode JWT
# ─────────────────────────────────────────────────────────────
def _decode_token(request) -> tuple:
    """Returns (payload, error_response)"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return None, (jsonify({"error": "Missing token"}), 401)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, (jsonify({"error": "Token expired"}), 401)
    except jwt.InvalidTokenError:
        return None, (jsonify({"error": "Invalid token"}), 401)


# ─────────────────────────────────────────────────────────────
# 1. GET /auth/get_nonce
# ─────────────────────────────────────────────────────────────
@user_bp.route('/auth/get_nonce', methods=['GET'])
def get_nonce():
    """
    Bước 1 của login flow.
    Client cần nonce để tạo tx REGISTER_IDENTITY + ký.
    """
    address = request.args.get('address', '').lower()
    if not address:
        return jsonify({"error": "Missing address"}), 400

    nonce = uuid.uuid4().hex
    r.set(f"nonce:{address}", nonce, ex=300)  # 5 phút
    return jsonify({"nonce": nonce})


# ─────────────────────────────────────────────────────────────
# 2. POST /auth/verify
# ─────────────────────────────────────────────────────────────
@user_bp.route('/auth/verify', methods=['POST'])
def verify():
    """
    Bước 2 của login flow.

    Client gửi:
    {
        "address":   "0xabc...",
        "pubkey":    "04abc...",   ← uncompressed SECP256k1 pubkey
        "signature": "hex...",    ← ký tx REGISTER_IDENTITY chứa nonce
    }

    Backend:
    1. Verify signature (recover address từ sig, không DB lookup)
    2. get_or_create account
    3. Cấp JWT stateless
    """
    data = request.json or {}
    address = data.get('address', '').lower()
    pubkey = data.get('pubkey', '')
    signature = data.get('signature', '')

    if not address or not pubkey or not signature:
        return jsonify({"status": "fail", "message": "Missing address, pubkey or signature"}), 400

    # 1. Kiểm tra nonce
    stored_nonce = r.get(f"nonce:{address}")
    if not stored_nonce:
        return jsonify({"status": "fail", "message": "Nonce expired or not found"}), 401

    # 2. Verify signature — AccountService không cần DB lookup
    is_valid, message = AccountService.verify_login_signature(
        address, signature, pubkey, stored_nonce
    )
    if not is_valid:
        return jsonify({"status": "fail", "message": message}), 401

    # 3. Xóa nonce (one-time use)
    r.delete(f"nonce:{address}")

    # 4. Get or create account — login lần đầu tự tạo, không cần /register
    account, is_new = AccountService.get_or_create(address, pubkey)
    role_val = account.role.value if hasattr(account.role, 'value') else account.role

    # 5. Cấp JWT stateless — backend không lưu session
    token = jwt.encode({
        'address': address,
        'role': role_val,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({
        "status": "success",
        "token": token,
        "is_new": is_new,  # client biết có cần submit REGISTER_IDENTITY tx không
        "user": {
            "address": account.address,
            "role": role_val,
            "full_name": account.full_name,
            "avatar_url": account.avatar_url,
            "profile_tx_hash": account.profile_tx_hash,  # client verify on-chain
        }
    })


# ─────────────────────────────────────────────────────────────
# 3. POST /transactions/submit
# ─────────────────────────────────────────────────────────────
@user_bp.route('/transactions/submit', methods=['POST'])
def submit_transaction():
    """
    Nhận signed transaction từ client → verify → đưa vào mempool → broadcast.

    Client gửi:
    {
        "transaction": { tx_type, sender_address, sender_pubkey, payload, nonce, timestamp },
        "signature":   "hex..."
    }

    Backend KHÔNG tạo transaction — chỉ verify và forward lên chain.
    """
    payload_data, err = _decode_token(request)
    if err:
        return err

    data = request.json or {}
    tx_dict = data.get('transaction')
    signature = data.get('signature', '')

    if not tx_dict or not signature:
        return jsonify({"error": "Missing transaction or signature"}), 400

    # Parse tx
    try:
        tx = Transaction.from_dict(tx_dict)
        tx.signature = signature
    except Exception as e:
        return jsonify({"error": f"Invalid transaction format: {str(e)}"}), 400

    # Đảm bảo chỉ submit tx của chính mình
    if tx.sender_address != payload_data['address']:
        return jsonify({"error": "Sender address mismatch with token"}), 403

    # Role check: chỉ MOET mới submit ASSIGN_ROLE
    if tx.tx_type == TxType.ASSIGN_ROLE:
        if payload_data.get('role') != Role.MOET.value:
            return jsonify({"error": "Only MOET can assign roles"}), 403

    # Verify signature — TransactionService không cần DB
    is_valid, message = TransactionService.verify(tx)
    if not is_valid:
        return jsonify({"error": f"Invalid signature: {message}"}), 400

    # Đưa vào mempool (BlockChainService sẽ mine vào block)
    from app.services.BlockChainService import BlockChainService
    from app.core.blockchain_instance import get_blockchain  # singleton
    blockchain = get_blockchain()
    success, msg = BlockChainService.add_transaction_to_mempool(blockchain, tx)

    if not success:
        return jsonify({"error": msg}), 400

    # Broadcast đến validator nodes qua NetworkService
    try:
        from app.services.NetworkService import get_network_service
        get_network_service().broadcast_transaction(tx.to_dict())
    except Exception as e:
        logger.warning(f"[user_routes] Broadcast warning: {e}")

    return jsonify({
        "status": "pending",
        "tx_hash": tx.compute_hash(),
        "message": "Transaction submitted to mempool"
    }), 202


@user_bp.route('/profile/<address>', methods=['GET'])
def get_profile(address):
    """
    Trả về account info từ DB index.
    profile_tx_hash → client có thể verify on-chain nếu muốn.
    """
    account = AccountService.get_by_address(address.lower())
    if not account:
        return jsonify({"error": "Account not found"}), 404

    return jsonify({
        "address": account.address,
        "role": account.role.value if hasattr(account.role, 'value') else account.role,
        "org_name": account.org_name,
        "full_name": account.full_name,
        "avatar_url": account.avatar_url,
        "profile_tx_hash": account.profile_tx_hash,  # ← on-chain anchor
        "is_active": account.is_active,
    })

@user_bp.route('/transactions/<address>', methods=['GET'])
def get_transaction_history(address):
    """
    Lịch sử tx của address — từ DB index.
    Client có thể dùng tx_hash để verify trực tiếp on-chain.
    """
    txs = AccountService.get_transaction_history(address.lower())
    return jsonify({
        "address": address.lower(),
        "transactions": [tx.to_dict() for tx in txs],
        "total": len(txs),
    })
