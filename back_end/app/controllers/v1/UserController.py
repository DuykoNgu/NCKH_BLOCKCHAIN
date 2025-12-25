"""UserController - REST API endpoints for User operations"""
from flask import Blueprint, request, jsonify
from app.services.UserService import UserService
from app.repositories.UserRepository import UserRepository
from app.models.User import UserRole


user_bp = Blueprint('user', __name__, url_prefix='/api/v1/user')


@user_bp.route('/register', methods=['POST'])
def register_user():
    """
    Register new user
    
    Request body:
    {
        "user_id": "student_001",
        "password": "password123",
        "role": "client"  // optional: "client", "admin", "validator"
    }
    
    Response (success):
    {
        "success": true,
        "user": {...},
        "private_key": "abc123...",  // ⚠️ CHỈ TRẢ VỀ 1 LẦN - CLIENT PHẢI LƯU LẠI!
        "message": "User registered successfully",
        "warning": "Save your private_key! It will NOT be shown again."
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('user_id') or not data.get('password'):
            return jsonify({"error": "Missing user_id or password"}), 400
        
        user_id = data['user_id']
        password = data['password']
        role = UserRole(data.get('role', 'client'))
        
        success, user, message, private_key = UserService.register_user(user_id, password, role)
        
        if success:
            response = UserService.success_response(user, message)
            # ⚠️ Trả private_key CHỈ 1 LẦN DUY NHẤT
            response["private_key"] = private_key
            response["warning"] = "IMPORTANT: Save your private_key securely! It will NOT be shown again."
            return jsonify(response), 201
        else:
            return jsonify({"error": message}), 400
            
    except ValueError as e:
        return jsonify({"error": f"Invalid role: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Registration error: {str(e)}"}), 500


@user_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user
    
    Request body:
    {
        "user_id": "student_001",
        "password": "password123"
    }
    """
    try:
        data = request.get_json()
        
        if not data.get('user_id') or not data.get('password'):
            return jsonify({"error": "Missing user_id or password"}), 400
        
        user_id = data['user_id']
        password = data['password']
        
        success, user, message = UserService.authenticate_user(user_id, password)
        
        if success:
            return jsonify(UserService.success_response(user, message)), 200
        else:
            return jsonify({"error": message}), 401
            
    except Exception as e:
        return jsonify({"error": f"Login error: {str(e)}"}), 500


@user_bp.route('/validators', methods=['GET'])
def get_validators():
    """Get all validators"""
    try:
        from app.services.ValidatorService import ValidatorService
        
        validators = ValidatorService.get_all_validators()
        
        validators_list = [UserService.success_response(v).get('user', v.to_dict()) for v in validators]
        
        return jsonify({
            "success": True,
            "validators": validators_list,
            "count": len(validators_list)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error getting validators: {str(e)}"}), 500


@user_bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by user_id"""
    try:
        user = UserService.get_user_by_id(user_id)
        
        if user:
            return jsonify(UserService.success_response(user)), 200
        else:
            return jsonify({"error": "User not found"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Error getting user: {str(e)}"}), 500


@user_bp.route('/address/<address>', methods=['GET'])
def get_user_by_address(address):
    """Get user by address"""
    try:
        user = UserService.get_user_by_address(address)
        
        if user:
            return jsonify(UserService.success_response(user)), 200
        else:
            return jsonify({"error": "User not found"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Error getting user: {str(e)}"}), 500


@user_bp.route('/all', methods=['GET'])
def get_all_users():
    """Get all users"""
    try:
        users = UserService.get_all_users()
        
        user_list = [UserService.to_dict(u) for u in users]
        
        return jsonify({
            "success": True,
            "count": len(user_list),
            "users": user_list
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error getting users: {str(e)}"}), 500


@user_bp.route('/<user_id>/role', methods=['PUT'])
def update_user_role(user_id):
    """
    Update user role
    
    Request body:
    {
        "role": "admin"
    }   
    """
    try:
        data = request.get_json()
        
        if not data.get('role'):
            return jsonify({"error": "Missing role"}), 400
        
        new_role = UserRole(data['role'])
        success, message = UserService.update_user_role(user_id, new_role)
        
        if success:
            user = UserService.get_user_by_id(user_id)
            return jsonify(UserService.success_response(user, message)), 200
        else:
            return jsonify({"error": message}), 400
            
    except ValueError as e:
        return jsonify({"error": f"Invalid role: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Error updating role: {str(e)}"}), 500


@user_bp.route('/<user_id>/password', methods=['PUT'])
def change_password(user_id):
    """
    Change user password
    
    Request body:
    {
        "old_password": "password123",
        "new_password": "newpassword123"
    }
    """
    try:
        data = request.get_json()
        
        if not data.get('old_password') or not data.get('new_password'):
            return jsonify({"error": "Missing old_password or new_password"}), 400
        
        success, message = UserService.change_password(
            user_id,
            data['old_password'],
            data['new_password']
        )
        
        if success:
            return jsonify({"success": True, "message": message}), 200
        else:
            return jsonify({"error": message}), 400
            
    except Exception as e:
        return jsonify({"error": f"Error changing password: {str(e)}"}), 500


@user_bp.route('/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user"""
    try:
        success, message = UserService.delete_user(user_id)
        
        if success:
            return jsonify({"success": True, "message": message}), 200
        else:
            return jsonify({"error": message}), 400
            
    except Exception as e:
        return jsonify({"error": f"Error deleting user: {str(e)}"}), 500


@user_bp.route('/<user_id>/verify-signature', methods=['POST'])
def verify_signature(user_id):
    """
    Verify user signature
    
    Request body:
    {
        "message": "message to verify",
        "signature": "signature_hex"
    }
    """
    try:
        data = request.get_json()
        
        if not data.get('message') or not data.get('signature'):
            return jsonify({"error": "Missing message or signature"}), 400
        
        success, message = UserService.verify_user_signature(
            user_id,
            data['message'],
            data['signature']
        )
        
        if success:
            return jsonify({"success": True, "message": message}), 200
        else:
            return jsonify({"error": message}), 400
            
    except Exception as e:
        return jsonify({"error": f"Verification error: {str(e)}"}), 500


@user_bp.route('/<user_id>/promote-validator', methods=['POST'])
def promote_validator(user_id):
    """
    Promote user thành validator (POA - Proof of Authority)
    
    ⭐ CHỈ ADMIN được phép promote validator
    
    Request body:
    {
        "admin_id": "admin_001",
        "admin_signature": "0x..."  // Signature của message "PROMOTE:{user_id}"
    }
    
    Mục đích:
    - Admin ký xác nhận quyết định promote user
    - Đảm bảo admin không bị phản bác hay tấn công man-in-the-middle
    """
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        admin_signature = data.get('admin_signature')
        
        if not admin_id or not admin_signature:
            return jsonify({"error": "Missing admin_id or admin_signature"}), 400
        
        # Kiểm tra admin
        admin = UserRepository.get_user_by_id(admin_id)
        if not admin:
            return jsonify({"error": "Admin not found"}), 404
        
        if admin.role != UserRole.ADMIN:
            return jsonify({
                "success": False,
                "error": "Only admin can promote validators",
                "code": "NOT_ADMIN"
            }), 403
        
        # Verify admin signature (ký message "PROMOTE:{user_id}")
        message = f"PROMOTE:{user_id}"
        is_valid, verify_msg = UserService.verify_user_signature(admin_id, message, admin_signature)
        
        if not is_valid:
            return jsonify({
                "success": False,
                "error": "Invalid admin signature",
                "code": "INVALID_SIGNATURE"
            }), 400
        
        # Promote user to validator
        success, msg = UserService.update_user_role(user_id, UserRole.VALIDATOR)
        
        if success:
            # Lấy user info sau khi update
            user = UserRepository.get_user_by_id(user_id)
            return jsonify({
                "success": True,
                "user": UserService.to_dict(user),
                "message": f"User {user_id} promoted to validator",
                "promoted_by": admin_id
            }), 200
        else:
            return jsonify({"error": msg}), 400
            
    except Exception as e:
        return jsonify({"error": f"Error promoting validator: {str(e)}"}), 500


@user_bp.route('/<user_id>/demote-validator', methods=['POST'])
def demote_validator(user_id):
    """
    Demote validator về client (POA)
    
    ⭐ CHỈ ADMIN được phép demote
    
    Request body:
    {
        "admin_id": "admin_001",
        "admin_signature": "0x..."  // Signature của message "DEMOTE:{user_id}"
    }
    """
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        admin_signature = data.get('admin_signature')
        
        if not admin_id or not admin_signature:
            return jsonify({"error": "Missing admin_id or admin_signature"}), 400
        
        # Kiểm tra admin
        admin = UserRepository.get_user_by_id(admin_id)
        if not admin:
            return jsonify({"error": "Admin not found"}), 404
        
        if admin.role != UserRole.ADMIN:
            return jsonify({
                "success": False,
                "error": "Only admin can demote validators",
                "code": "NOT_ADMIN"
            }), 403
        
        # Verify admin signature (ký message "DEMOTE:{user_id}")
        message = f"DEMOTE:{user_id}"
        is_valid, verify_msg = UserService.verify_user_signature(admin_id, message, admin_signature)
        
        if not is_valid:
            return jsonify({
                "success": False,
                "error": "Invalid admin signature",
                "code": "INVALID_SIGNATURE"
            }), 400
        
        # Demote validator to client
        success, msg = UserService.update_user_role(user_id, UserRole.CLIENT)
        
        if success:
            user = UserRepository.get_user_by_id(user_id)
            return jsonify({
                "success": True,
                "user": UserService.to_dict(user),
                "message": f"User {user_id} demoted to client",
                "demoted_by": admin_id
            }), 200
        else:
            return jsonify({"error": msg}), 400
            
    except Exception as e:
        return jsonify({"error": f"Error demoting validator: {str(e)}"}), 500
