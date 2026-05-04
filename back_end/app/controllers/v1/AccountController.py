from flask import Blueprint, request, jsonify
import redis
import datetime
import jwt
from app.repositories.AccountRepository import AccountRepository
from app.services.AccountService import AccountService
from app.core.config import SECRET_KEY, REDIS_HOST, REDIS_PORT, REDIS_DB
import uuid
from app.models.Account import Role
from ecdsa import VerifyingKey, SECP256k1, BadSignatureError
from ecdsa.util import sigdecode_string

user_bp = Blueprint('user_bp', __name__, url_prefix='/api/v1/users')

# Fallback in-memory store if Redis is unavailable
_nonce_cache = {}

try:
    r = redis.StrictRedis(
        host=REDIS_HOST, 
        port=REDIS_PORT, 
        db=REDIS_DB, 
        decode_responses=True,
        socket_timeout=2
    )
    r.ping()
    HAS_REDIS = True
except:
    HAS_REDIS = False
    print("WARNING: Redis unavailable, using in-memory nonce cache")

@user_bp.route('/auth/get_nonce', methods=['GET'])
def get_nonce():
    address_arg = request.args.get('address')
    if not address_arg:
        return jsonify({"error": "address is required"}), 400
        
    address = address_arg.lower()
    nonce = uuid.uuid4().hex
    
    if HAS_REDIS:
        try:
            r.set(f"nonce:{address}", nonce, ex=300)
        except:
            _nonce_cache[f"nonce:{address}"] = (nonce, datetime.datetime.now() + datetime.timedelta(minutes=5))
    else:
        # Store with expiration
        _nonce_cache[f"nonce:{address}"] = (nonce, datetime.datetime.now() + datetime.timedelta(minutes=5))
        
    return jsonify({"nonce": nonce})

@user_bp.route('/auth/register', methods=['POST']) 
def register():
    data = request.json
    if not data:
        return {"error": "Missing data"}, 400

    address = data.get('address')
    public_key = data.get('public_key')
    role_str = data.get('role', 'client')
    
    # Convert string to Role enum
    role_map = {
        'client': Role.CLIENT,
        'validator': Role.VALIDATOR,
        'moet': Role.MOET
    }
    role = role_map.get(role_str.lower(), Role.CLIENT)

    success, account, message = AccountService.register_account(address, public_key, role)

    if success:
        return {
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
    address = data.get('address')
    signature = data.get('signature')
    msg_hash = data.get('msg_hash')

    nonce_key = f"nonce:{address}"
    stored_nonce = None
    
    if HAS_REDIS:
        try:
            stored_nonce = r.get(nonce_key)
        except:
            pass
            
    if not stored_nonce and nonce_key in _nonce_cache:
        val, expiry = _nonce_cache[nonce_key]
        if datetime.datetime.now() < expiry:
            stored_nonce = val
        else:
            del _nonce_cache[nonce_key]

    if not stored_nonce:
        return jsonify({"status":"fail", "message":"Nonce expired"}), 401
    
    try:
        account = AccountService.get_account_by_address(address)
        if not account:
            return jsonify({"status":"fail", "message":"account not found"}), 404
        
        public_key = account.public_key

        # Load public key
        vk = VerifyingKey.from_string(bytes.fromhex(public_key), curve=SECP256k1)
        
        # Verify signature using pre-computed hash (verify_digest)
        # sigdecode_string is for 64-byte compact signatures
        is_valid = vk.verify_digest(
            bytes.fromhex(signature), 
            bytes.fromhex(msg_hash), 
            sigdecode=sigdecode_string
        )
        
        if is_valid:
            if HAS_REDIS:
                try:
                    r.delete(nonce_key)
                except:
                    pass
            if nonce_key in _nonce_cache:
                del _nonce_cache[nonce_key]
                
            token = jwt.encode({
                'address': address,
                'role': account.role.value if hasattr(account.role, 'value') else account.role,
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
                    "avatar_url": account.avatar_url
                }
            })
    
    except Exception as e:
        print(f"Verify error: {e}")
        return jsonify({"status":"fail", "message": "Invalid signature"}), 401
        
@user_bp.route('/profile/update', methods=['POST'])
def update_profile():
    data = request.json
    address = data.get('address')
    full_name = data.get('full_name')
    avatar_url = data.get('avatar_url')
    
    if not address:
        return jsonify({"error": "Missing address"}), 400
        
    success, account, message = AccountService.update_profile(address, full_name, avatar_url)
    
    if success:
        return jsonify({
            "status": "success",
            "message": message,
            "user": account.to_dict()
        }), 200
    else:
        return jsonify({
            "status": "fail",
            "error": message
        }), 400

@user_bp.route('/all', methods=['GET'])
def get_all_accounts():
    """Lấy danh sách tất cả tài khoản (cho admin dashboard)"""
    try:
        accounts = AccountRepository.get_all_accounts()
        return jsonify({
            "success": True,
            "total": len(accounts),
            "accounts": [acc.to_dict() for acc in accounts]
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
