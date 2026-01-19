from flask import Blueprint, request, jsonify
import redis
import datetime
import jwt
from app.repositories.UserRepository import UserRepository
import uuid
from ecdsa import VerifyingKey, SECP256k1, BadSignatureError
user_bp = Blueprint('user_bp', __name__, url_prefix='/api/v1/users')
SECRET_KEY = "your_super_secret_key"
r = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)
@user_bp.route('/auth/get_nonce', methods=['GET'])
def get_nonce():
    address = request.args.get('address').lower()
    nonce = uuid.uuid4().hex
    r.set(f"nonce:{address}",nonce, ex=300) 
    return jsonify({"nonce": nonce})

@user_bp.route('/auth/verify', methods=['POST'])
def verify():
    data = request.json
    address = data.get('address')
    signature = data.get('signature')
    msg_hash = data.get('msg_hash')

    stored_nonce = r.get(f"nonce:{address}")
    if not stored_nonce:
        return jsonify({"Status":"fail", "message":"Nonce expired"},401)
    
    try:
        user = UserRepository.get_account_by_address(address)
        if not user:
            return jsonify({"status":"fail", "message":"user not found"},404)
        
        public_key = user.public_key

        vk = VerifyingKey.from_string(bytes.fromhex(public_key), curve=SECP256k1)
        is_valid = vk.verify(bytes.fromhex(signature), bytes.fromhex(msg_hash))
        if is_valid:
            r.delete(f"nonce:{address}")
            token = jwt.encode({
                'address': address,
                'role': user.role,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, SECRET_KEY, algorithm="HS256")
            return jsonify({{
                "status": "success",
                "token": token,
                "user":{"user_id": user.id, "address": user.address, "public_key": user.public_key}
            }})
    
    except Exception as e:
        return jsonify({"status":"fail", "message": "Invalid signature"}),401
