"""BlockController - REST API endpoints for Block operations"""
from flask import Blueprint, request, jsonify
from app.services.BlockService import BlockService
from app.services.ValidatorService import ValidatorService
from app.repositories.BlockRepository import BlockRepository
from app.repositories.UserRepository import UserRepository


block_bp = Blueprint('block', __name__, url_prefix='/api/v1/block')


@block_bp.route('/create', methods=['POST'])
def create_block():
    """
    Create a new block (POA - Proof of Authority)
    
    ⭐ CHỈ VALIDATOR ĐƯỢC PHÉP tạo block
    
    Client phải ký block_hash ở client-side và gửi signature lên.
    Server sẽ verify signature bằng validator's public key.
    
    Request body:
    {
        "index": 1,
        "block_id": "BLOCK_001",
        "pre_hash": "0x...",
        "merkle_root": "0x...",
        "validator_id": "validator_001",  // ← Bắt buộc (POA)
        "signature": "0x... (signature of block_hash)",
        "transactions": [...]
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields - thêm validator_id
        required_fields = ['index', 'block_id', 'pre_hash', 'merkle_root', 
                          'validator_id', 'signature']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields. Required: index, block_id, pre_hash, merkle_root, validator_id, signature"}), 400
        
        # ⭐ POA CHECK: Kiểm tra user có phải validator không
        validator_id = data['validator_id']
        if not ValidatorService.is_validator(validator_id):
            return jsonify({
                "success": False,
                "error": "Only authorized validators can create blocks",
                "code": "NOT_VALIDATOR",
                "validator_count": ValidatorService.get_validator_count()
            }), 403  # HTTP 403 Forbidden
        
        # Lấy validator pubkey từ database
        validator = UserRepository.get_user_by_id(validator_id)
        if not validator:
            return jsonify({"error": "Validator not found"}), 404
        
        # Tạo block
        data['validator_pubkey'] = validator.pubkey  # Add pubkey để from_dict sử dụng
        block = BlockService.from_dict(data)
        
        # Set signature từ request TRƯỚC khi tính hash
        block.validator_signature = data['signature']
        
        # Calculate hash AFTER setting signature (để get_signing_data() có signature)
        block.block_hash = BlockService.calculate_hash(block)
        
        # Verify signature
        if not BlockService.verify_block(block, validator.pubkey):
            return jsonify({"error": "Invalid block signature"}), 400
        
        # Save to database
        success = BlockRepository.create_block(block)
        
        if success:
            return jsonify(BlockService.success_response(
                block, "Block created successfully by validator", level='standard'
            )), 201
        else:
            return jsonify({"error": "Failed to save block"}), 400
            
    except Exception as e:
        return jsonify({"error": f"Error creating block: {str(e)}"}), 500


@block_bp.route('/<block_id>', methods=['GET'])
def get_block(block_id):
    """Get block by block_id"""
    try:
        block = BlockRepository.get_block_by_id(block_id)
        
        if block:
            return jsonify(BlockService.success_response(block, level='full')), 200
        else:
            return jsonify({"error": "Block not found"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Error getting block: {str(e)}"}), 500


@block_bp.route('/index/<int:index>', methods=['GET'])
def get_block_by_index(index):
    """Get block by index"""
    try:
        block = BlockRepository.get_block_by_index(index)
        
        if block:
            return jsonify(BlockService.success_response(block, level='standard')), 200
        else:
            return jsonify({"error": "Block not found"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Error getting block: {str(e)}"}), 500


@block_bp.route('/all', methods=['GET'])
def get_all_blocks():
    """Get all blocks with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        
        all_blocks = BlockRepository.get_all_blocks()
        
        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        blocks_page = all_blocks[start:end]
        
        block_list = [BlockService.to_dict(b, level='standard') for b in blocks_page]
        
        return jsonify({
            "success": True,
            "total_count": len(all_blocks),
            "page": page,
            "page_size": page_size,
            "blocks": block_list
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error getting blocks: {str(e)}"}), 500


@block_bp.route('/range', methods=['GET'])
def get_blocks_by_range():
    """Get blocks in index range"""
    try:
        start_index = request.args.get('start_index', 0, type=int)
        end_index = request.args.get('end_index', 100, type=int)
        
        blocks = BlockRepository.get_blocks_by_range(start_index, end_index)
        
        block_list = [BlockService.to_dict(b, level='summary') for b in blocks]
        
        return jsonify({
            "success": True,
            "count": len(block_list),
            "blocks": block_list
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error getting blocks: {str(e)}"}), 500


@block_bp.route('/latest', methods=['GET'])
def get_latest_block():
    """Get the latest block"""
    try:
        block = BlockRepository.get_latest_block()
        
        if block:
            return jsonify(BlockService.success_response(block, level='standard')), 200
        else:
            return jsonify({"error": "No blocks found"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Error getting latest block: {str(e)}"}), 500


@block_bp.route('/<block_id>/verify', methods=['POST'])
def verify_block(block_id):
    """Verify block signature"""
    try:
        data = request.get_json()
        
        if not data.get('public_key'):
            return jsonify({"error": "Missing public_key"}), 400
        
        block = BlockRepository.get_block_by_id(block_id)
        
        if not block:
            return jsonify({"error": "Block not found"}), 404
        
        # Verify signature using BlockService
        is_valid = BlockService.verify_block(block, data['public_key'])
        
        return jsonify({
            "success": True,
            "block_id": block_id,
            "is_valid": is_valid,
            "message": "Block signature valid" if is_valid else "Block signature invalid"
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Verification error: {str(e)}"}), 500


# NOTE: DELETE endpoint đã bị xóa - Blockchain là immutable, không cho phép xóa block


@block_bp.route('/count', methods=['GET'])
def count_blocks():
    """Get total number of blocks"""
    try:
        count = BlockRepository.count_blocks()
        
        return jsonify({
            "success": True,
            "total_blocks": count
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error counting blocks: {str(e)}"}), 500


# =============================================================================
# VAL-06: NHẬN BLOCK TỪ VALIDATOR KHÁC
# =============================================================================
# Endpoint này xử lý việc nhận block được broadcast từ các validator khác
# trong mạng blockchain. Đây là phần quan trọng trong cơ chế đồng thuận.
#
# Flow xử lý:
#   1. Validate input: Kiểm tra các trường bắt buộc
#   2. Check duplicate: Chống xử lý trùng block (theo block_id và block_hash)
#   3. Verify signature: Xác thực chữ ký của validator (gọi VAL-02)
#   4. Persist: Lưu block hợp lệ vào database
#
# Error codes:
#   - DUPLICATE_BLOCK: Block ID đã tồn tại
#   - DUPLICATE_HASH: Block hash đã tồn tại (có thể là tấn công replay)
#   - INVALID_SIGNATURE: Chữ ký không hợp lệ
# =============================================================================

@block_bp.route('/receive', methods=['POST'])
def receive_block():
    """
    Nhận block từ validator khác (VAL-06 + POA)
    
    ⭐ CHỈ NHẬN block từ các validator được phép
    
    Flow xử lý:
      1. Validate input
      2. Check duplicate (chống replay attack)
      3. ⭐ POA CHECK: Kiểm tra validator có quyền không
      4. Verify signature
      5. Persist
    
    Request body:
    {
        "block_id": "BLOCK_001",
        "index": 1,
        "pre_hash": "0x...",
        "merkle_root": "0x...",
        "validator_id": "validator_001",      // ← POA
        "block_hash": "0x...",
        "validator_signature": "0x...",
        "transactions": []
    }
    """
    try:
        data = request.get_json()
        
        # ===== STEP 0: Validate required fields =====
        required_fields = ['block_id', 'index', 'pre_hash', 'merkle_root', 
                          'validator_id', 'block_hash', 'validator_signature']
        
        missing = [f for f in required_fields if f not in data]
        if missing:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {missing}"
            }), 400
        
        # ===== STEP 1: ⭐ POA CHECK - Kiểm tra validator =====
        validator_id = data['validator_id']
        if not ValidatorService.is_validator(validator_id):
            return jsonify({
                "success": False,
                "error": "Block creator is not an authorized validator",
                "code": "INVALID_VALIDATOR"
            }), 403
        
        # Lấy validator pubkey
        validator = UserRepository.get_user_by_id(validator_id)
        if not validator:
            return jsonify({
                "success": False,
                "error": "Validator not found"
            }), 404
        
        data['validator_pubkey'] = validator.pubkey
        
        # ===== STEP 2: Chống xử lý trùng block =====
        if BlockRepository.block_exists(block_id=data['block_id']):
            return jsonify({
                "success": False,
                "error": "Block already exists",
                "code": "DUPLICATE_BLOCK"
            }), 409
        
        if BlockRepository.block_exists(block_hash=data['block_hash']):
            return jsonify({
                "success": False,
                "error": "Block with this hash already exists",
                "code": "DUPLICATE_HASH"
            }), 409
        
        # ===== STEP 3: Build block object =====
        block = BlockService.from_dict(data)
        
        # ===== STEP 4: Verify block signature =====
        is_valid = BlockService.verify_block(block, validator.pubkey)
        
        if not is_valid:
            return jsonify({
                "success": False,
                "error": "Invalid block signature",
                "code": "INVALID_SIGNATURE"
            }), 400
        
        # ===== STEP 5: Save to database =====
        # Lưu block đã được verify vào database
        success = BlockRepository.create_block(block)
        
        if success:
            return jsonify(BlockService.success_response(
                block, "Block received and validated successfully", level='summary'
            )), 201
        else:
            return jsonify({
                "success": False,
                "error": "Failed to save block"
            }), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error receiving block: {str(e)}"
        }), 500
