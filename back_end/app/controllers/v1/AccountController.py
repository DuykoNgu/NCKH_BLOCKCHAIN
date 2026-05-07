from flask import Blueprint, request, jsonify
import redis
import datetime
import jwt
from app.repositories.AccountRepository import AccountRepository
from app.services.AccountService import AccountService
from app.core.config import SECRET_KEY, REDIS_HOST, REDIS_PORT, REDIS_DB
import uuid
from app.models.Account import Role, TransactionAcount, TransactionUpdateAccount
from ecdsa import VerifyingKey, SECP256k1, BadSignatureError
from app.utils.CryptoUtils import CryptoUtils
from app.utils.logger import get_logger
user_bp = Blueprint('user_bp', __name__, url_prefix='/api/v1/users')
logger = get_logger(__name__)
# --- Redis & Fallback Storage Configuration ---
nonce_fallback = {}
_redis_available = False

# Initialize Redis client with very short timeout for the initial check
r = redis.StrictRedis(
    host=REDIS_HOST, 
    port=REDIS_PORT, 
    db=REDIS_DB, 
    decode_responses=True, 
    socket_connect_timeout=0.5, 
    socket_timeout=0.5,
    retry_on_timeout=False
)

try:
    # Force disable Redis for debugging performance issues
    # r.ping()
    _redis_available = False
    logger.info("ℹ️ Redis is manually disabled. Using In-Memory fallback for nonces.")
except Exception as e:
    _redis_available = False
    logger.warning(f"⚠️ Redis unavailable ({e}). Using In-Memory fallback for nonces.")

def set_nonce(address, nonce):
    if _redis_available:
        try:
            r.set(f"nonce:{address}", nonce, ex=300)
            return
        except Exception as e:
            logger.warning(f"Redis set failed: {e}")
    
    # Fallback to dictionary
    nonce_fallback[address] = (nonce, datetime.datetime.now() + datetime.timedelta(seconds=300))

def get_nonce_from_storage(address):
    if _redis_available:
        try:
            val = r.get(f"nonce:{address}")
            if val: return val
        except Exception as e:
            logger.warning(f"Redis get failed: {e}")

    # Check fallback
    if address in nonce_fallback:
        nonce, expiry = nonce_fallback[address]
        if datetime.datetime.now() < expiry:
            return nonce
        else:
            del nonce_fallback[address]
    return None

def delete_nonce(address):
    if _redis_available:
        try:
            r.delete(f"nonce:{address}")
            return
        except Exception:
            pass
            
    if address in nonce_fallback:
        del nonce_fallback[address]

# --- Routes ---

@user_bp.route('/auth/get_nonce', methods=['GET'])
def get_nonce():
    addr_raw = request.args.get('address')
    if not addr_raw:
        return jsonify({"error": "address is required"}), 400
    address = addr_raw.lower()
    nonce = uuid.uuid4().hex
    set_nonce(address, nonce)
    return jsonify({"nonce": nonce})

@user_bp.route('/auth/register', methods=['POST']) 
def register():
    data = request.json
    if not data:
        return {"error": "Missing data"}, 400
    
    address = data.get('address')
    public_key = data.get('public_key')
    role_str = data.get('role', 'client')
    signature = data.get('signature')
    # Thông tin bổ sung (dành cho validator/trường học)
    full_name = data.get('full_name')
    tax_id = data.get('tax_id')
    representative = data.get('representative')
    email = data.get('email')
    phone = data.get('phone')
    vault = data.get('vault')
    timestamp = data.get('timestamp')

    transactionAccount = TransactionAcount(
        address=address,
        public_key=public_key,
        role=role_str,
        timestamp=timestamp
    )

    message_to_verify = transactionAccount.get_signing_data()

    is_valid_signature = CryptoUtils.verify_signature(message_to_verify, signature, public_key)
    if not is_valid_signature:
        return jsonify({"error": "Invalid digital signature."}), 401
    
    # Convert string to Role enum
    role_map = {
        'client': Role.CLIENT,
        'validator': Role.VALIDATOR,
        'moet': Role.MOET
    }
    role = role_map.get(role_str.lower(), Role.CLIENT)

    success, account, message = AccountService.register_account(
        address=address, 
        public_key=public_key, 
        role=role, 
        vault=vault,
        signature=signature,
        reg_timestamp=timestamp,
        full_name=full_name,
        tax_id=tax_id,
        representative=representative,
        email=email,
        phone=phone
    )

    if success:
        return {
            "status": "success",
            "message": message,
            "data": {
                "address": account.address,
                "role": account.role.value if hasattr(account.role, 'value') else str(account.role)
            }
        }, 201
    else:
        return {"error": message}, 400

@user_bp.route('/auth/verify', methods=['POST'])
def verify():
    data = request.json
    address = data.get('address').lower()
    signature = data.get('signature')
    msg_hash = data.get('msg_hash')

    stored_nonce = get_nonce_from_storage(address)
    if not stored_nonce:
        return jsonify({"Status":"fail", "message":"Nonce expired"}), 401
    
    try:
        account = AccountService.get_account_by_address(address)
        if not account:
            return jsonify({"status":"fail", "message":"account not found"}), 404
        
        public_key = account.public_key

        # Use centralized signature verification
        is_valid = CryptoUtils.verify_signature(msg_hash, signature, public_key)
        
        if is_valid:
            delete_nonce(address)
            token = jwt.encode({
                'address': address,
                'role': account.role.value if hasattr(account.role, 'value') else str(account.role),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, SECRET_KEY, algorithm="HS256")
            return jsonify({
                "status": "success",
                "token": token,
                "user": {
                    "address": account.address, 
                    "public_key": account.public_key, 
                    "role": account.role.value if hasattr(account.role, 'value') else account.role,
                    "full_name": account.full_name,
                    "avatar_url": account.avatar_url,
                    "is_active": account.is_active
                }
            })
        else:
            return jsonify({
                "status":"fail", 
                "message": "Invalid signature",
                "debug": {
                    "nonce_used": msg_hash,
                    "pubkey_used": public_key,
                    "sig_provided": signature[:20] + "..."
                }
            }), 401
    
    except Exception as e:
        return jsonify({"status":"fail", "message": "Invalid signature"}),401

@user_bp.route('/auth/check_unique', methods=['POST'])
def check_unique():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Missing email"}), 400
        
    exists = AccountRepository.check_email_exists(email)
    return jsonify({
        "status": "success",
        "exists": exists
    }), 200

@user_bp.route('/profile/update', methods=['POST'])
def update_profile():
    data = request.json
    address = data.get('address')
    full_name = data.get('full_name')
    avatar_url = data.get('avatar_url')
    tax_id = data.get('tax_id')
    representative = data.get('representative')
    email = data.get('email')
    phone = data.get('phone')
    signature = data.get('signature')
    if not address:
        return jsonify({"error": "Missing address"}), 400
    account = AccountRepository.get_account_by_address(address)
    if not account:
        logger.warning(f"Profile update failed: Account {address} not found")
        return jsonify({"status":"fail", "message":"Account not found"}), 401  

    transactionUpdateAccount = TransactionUpdateAccount(
        address=address,
        full_name=full_name,
        avatar_url=avatar_url,
        tax_id=tax_id,
        representative=representative,
        email=email,
        phone=phone,
        timestamp=data.get('timestamp')
    )  
   
    message_to_verify = transactionUpdateAccount.get_signing_data()

    is_valid_signature = CryptoUtils.verify_signature(message_to_verify, signature, account.public_key)
    if not is_valid_signature:
            return jsonify({"error": "Invalid digital signature. "}), 401
    success, account, message = AccountService.update_profile(account, address, full_name, avatar_url, tax_id, representative, email, phone)
    

    if success:
        return jsonify({
            "status": "success",
            "message": message,
            "user": account.to_dict()
        }), 200

@user_bp.route('/auth/update_vault', methods=['POST'])
def update_vault():
    data = request.json
    address = data.get('address')
    vault = data.get('vault')
    
    if not address or not vault:
        return jsonify({"error": "Missing address or vault"}), 400
        
    success, message = AccountService.update_vault(address, vault)
    if success:
        return jsonify({"status": "success", "message": message}), 200
    else:
        return jsonify({"status": "fail", "error": message}), 400

@user_bp.route('/pending_validators', methods=['GET'])
def get_pending_validators():
    # Lấy query param 'all'
    get_all = request.args.get('all', 'false').lower() == 'true'
    
    # Fetch all accounts
    all_accounts = AccountService.get_all_account()
    
    if get_all:
        # Lấy tất cả validator
        validators = [acc for acc in all_accounts if 
                    (hasattr(acc.role, 'value') and acc.role.value == 'validator' or acc.role == 'validator')]
    else:
        # Chỉ lấy validator đang chờ phê duyệt (is_active == 0)
        validators = [acc for acc in all_accounts if 
                    (hasattr(acc.role, 'value') and acc.role.value == 'validator' or acc.role == 'validator') 
                    and acc.is_active == 0]
    
    return jsonify({
        "status": "success",
        "data": [acc.to_dict() for acc in validators]
    }), 200

@user_bp.route('/approve_validator', methods=['POST'])
def approve_validator():
    data = request.json
    address = data.get('address')
    
    if not address:
        return jsonify({"error": "Missing address"}), 400
        
    account = AccountService.get_account_by_address(address)
    if not account:
        return jsonify({"error": "Account not found"}), 404
        
    account.is_active = 1
    
    success = AccountRepository.update_account(account)
    if success:
        return jsonify({
            "status": "success",
            "success": True,
            "message": "Validator approved successfully",
            "user": account.to_dict()
        }), 200
    else:
        return jsonify({
            "status": "fail",
            "error": "Failed to update validator"
        }), 500

@user_bp.route('/reject_validator', methods=['POST'])
def reject_validator():
    data = request.json
    address = data.get('address')
    
    if not address:
        return jsonify({"error": "Missing address"}), 400
        
    success, message = AccountService.delete_account(address)
    if success:
        return jsonify({
            "status": "success",
            "success": True,
            "message": "Validator rejected and removed successfully"
        }), 200
    else:
        return jsonify({
            "status": "fail",
            "error": message
        }), 500

@user_bp.route('/all', methods=['GET'])
def get_all_users():
    try:
        accounts = AccountService.get_all_account()
        return jsonify({
            "status": "success",
            "data": [acc.to_dict() for acc in accounts]
        }), 200
    except Exception as e:
        return jsonify({"status": "fail", "message": str(e)}), 500

@user_bp.route('/profile/<address>', methods=['GET'])
def get_profile(address):
    account = AccountService.get_account_by_address(address)
    if not account:
        return jsonify({"error": "Account not found"}), 404
        
    return jsonify({
        "status": "success",
        "user": {
            "address": account.address,
            "public_key": account.public_key,
            "role": account.role.value if hasattr(account.role, 'value') else str(account.role),
            "full_name": account.full_name,
            "avatar_url": account.avatar_url,
            "is_active": int(account.is_active), # Cast to int for consistency
            "tax_id": account.tax_id,
            "representative": account.representative,
            "email": account.email,
            "phone": account.phone,
            "vault": account.vault
        }
    }), 200
