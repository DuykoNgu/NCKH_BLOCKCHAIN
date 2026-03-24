"""BlockController - REST API endpoints for Block operations"""
from flask import Blueprint, request, jsonify
from app.services.BlockService import BlockService
from app.repositories.BlockRepository import BlockRepository
from app.models.Block import Block
from app.models.BlockHeader import BlockHeader


block_bp = Blueprint('block', __name__, url_prefix='/api/v1/block')



@block_bp.route('/<block_id>', methods=['GET'])
def get_block(block_id):
    """Get block by block_id"""
    try:
        block = BlockRepository.get_block_by_id(block_id)
        
        if block:
            return jsonify({
                "success": True,
                "block": {
                    "block_id": block.block_id,
                    "index": block.index,
                    "block_hash": block.block_hash,
                    "validator_signature": block.validator_signature,
                    "pre_hash": block.block_header.pre_hash,
                    "merkle_root": block.block_header.merkle_root,
                    "validator_pubkey": block.block_header.validator_pubkey,
                    "timestamp": block.block_header.timestamp,
                    "transactions_count": len(block.transactions)
                }
            }), 200
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
            return jsonify({
                "success": True,
                "block": {
                    "block_id": block.block_id,
                    "index": block.index,
                    "block_hash": block.block_hash,
                    "validator_pubkey": block.block_header.validator_pubkey,
                    "transactions_count": len(block.transactions)
                }
            }), 200
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
        
        block_list = [{
            "block_id": b.block_id,
            "index": b.index,
            "block_hash": b.block_hash,
            "validator_pubkey": b.block_header.validator_pubkey,
            "transactions_count": len(b.transactions)
        } for b in blocks_page]
        
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
        
        block_list = [{
            "block_id": b.block_id,
            "index": b.index,
            "block_hash": b.block_hash,
            "validator_pubkey": b.block_header.validator_pubkey
        } for b in blocks]
        
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
            return jsonify({
                "success": True,
                "block": {
                    "block_id": block.block_id,
                    "index": block.index,
                    "block_hash": block.block_hash,
                    "validator_pubkey": block.block_header.validator_pubkey,
                    "timestamp": block.block_header.timestamp,
                    "transactions_count": len(block.transactions)
                }
            }), 200
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


@block_bp.route('/<block_id>', methods=['DELETE'])
def delete_block(block_id):
    """Delete block"""
    try:
        success = BlockRepository.delete_block(block_id)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Block deleted successfully"
            }), 200
        else:
            return jsonify({"error": "Failed to delete block"}), 400
            
    except Exception as e:
        return jsonify({"error": f"Error deleting block: {str(e)}"}), 500


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
