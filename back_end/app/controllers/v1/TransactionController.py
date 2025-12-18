"""TransactionController - REST API endpoints for Transaction operations"""
from flask import Blueprint, request, jsonify
from app.services.TransactionService import TransactionService
from app.repositories.TransactionRepository import TransactionRepository


transaction_bp = Blueprint('transaction', __name__, url_prefix='/api/v1/transaction')

##TODO: Thêm các hàm helper để rút gọn code
@transaction_bp.route('/create', methods=['POST'])
def create_transaction():
    """Create a new transaction
    
    Client phải ký tx_hash ở client-side và gửi signature lên.
    Server sẽ verify signature bằng sender's public key.
    
    Request body:
    {
        "sender_pubkey": "0x...",
        "sender_address": "0x...",
        "recipient_address": "0x...",
        "signature": "0x... (signature of tx_hash)",
        "payload": {...}
    }
    """ 
    try:
        data = request.get_json()
        
        # Validate required fields - signature thay vì private_key
        required_fields = ['sender_pubkey', 'sender_address', 'recipient_address', 'signature']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields. Required: sender_pubkey, sender_address, recipient_address, signature"}), 400
        
        # Sử dụng TransactionService.from_dict() thay vì tạo thủ công
        tx = TransactionService.from_dict(data)
        
        # Calculate hash
        tx.tx_hash = TransactionService.calculate_hash(tx)
        tx.tx_id = tx.tx_hash  # Use hash as ID
        
        # Set signature từ request (đã ký ở client)
        tx.signature = data['signature']
        
        # Verify signature trước khi save
        if not TransactionService.verify(tx):
            return jsonify({"error": "Invalid transaction signature"}), 400
        
        # Save to database
        success = TransactionRepository.create_transaction(tx)
        
        if success:
            return jsonify(TransactionService.success_response(
                tx, "Transaction created successfully", level='standard'
            )), 201
        else:
            return jsonify({"error": "Failed to save transaction"}), 400
            
    except Exception as e:
        return jsonify({"error": f"Error creating transaction: {str(e)}"}), 500


@transaction_bp.route('/<tx_id>', methods=['GET'])
def get_transaction(tx_id):
    """Get transaction by tx_id"""
    try:
        tx = TransactionRepository.get_transaction_by_id(tx_id)
        
        if tx:
            return jsonify(TransactionService.success_response(tx, level='full')), 200
        else:
            return jsonify({"error": "Transaction not found"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Error getting transaction: {str(e)}"}), 500


@transaction_bp.route('/sender/<sender_address>', methods=['GET'])
def get_transactions_by_sender(sender_address):
    """Get all transactions by sender address"""
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        
        txs = TransactionRepository.get_transactions_by_sender(sender_address)
        
        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        txs_page = txs[start:end]
        
        tx_list = [TransactionService.to_dict(tx, level='summary') for tx in txs_page]
        
        return jsonify({
            "success": True,
            "total_count": len(txs),
            "page": page,
            "page_size": page_size,
            "transactions": tx_list
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error getting transactions: {str(e)}"}), 500


@transaction_bp.route('/recipient/<recipient_address>', methods=['GET'])
def get_transactions_by_recipient(recipient_address):
    """Get all transactions by recipient address"""
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        
        txs = TransactionRepository.get_transactions_by_recipient(recipient_address)
        
        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        txs_page = txs[start:end]
        
        tx_list = [TransactionService.to_dict(tx, level='summary') for tx in txs_page]
        
        return jsonify({
            "success": True,
            "total_count": len(txs),
            "page": page,
            "page_size": page_size,
            "transactions": tx_list
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error getting transactions: {str(e)}"}), 500


@transaction_bp.route('/all', methods=['GET'])
def get_all_transactions():
    """Get all transactions with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        
        txs = TransactionRepository.get_all_transactions()
        
        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        txs_page = txs[start:end]
        
        tx_list = [TransactionService.to_dict(tx, level='summary') for tx in txs_page]
        
        return jsonify({
            "success": True,
            "total_count": len(txs),
            "page": page,
            "page_size": page_size,
            "transactions": tx_list
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error getting transactions: {str(e)}"}), 500


@transaction_bp.route('/type/<tx_type>', methods=['GET'])
def get_transactions_by_type(tx_type):
    """Get transactions by type"""
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        
        txs = TransactionRepository.get_transactions_by_type(tx_type)
        
        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        txs_page = txs[start:end]
        
        tx_list = [TransactionService.to_dict(tx, level='summary') for tx in txs_page]
        
        return jsonify({
            "success": True,
            "total_count": len(txs),
            "page": page,
            "page_size": page_size,
            "transactions": tx_list
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error getting transactions: {str(e)}"}), 500


@transaction_bp.route('/<tx_id>/verify', methods=['POST'])
def verify_transaction(tx_id):
    """Verify transaction signature"""
    try:
        tx = TransactionRepository.get_transaction_by_id(tx_id)
        
        if not tx:
            return jsonify({"error": "Transaction not found"}), 404
        
        # Verify signature
        is_valid = TransactionService.is_valid(tx)
        
        return jsonify({
            "success": True,
            "tx_id": tx_id,
            "is_valid": is_valid,
            "message": "Transaction signature valid" if is_valid else "Transaction signature invalid"
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Verification error: {str(e)}"}), 500


@transaction_bp.route('/date-range', methods=['GET'])
def get_transactions_by_date_range():
    """Get transactions in date range
    
    Query params:
    - start_timestamp: Unix timestamp (float) hoặc ISO format (YYYY-MM-DD HH:MM:SS)
    - end_timestamp: Unix timestamp (float) hoặc ISO format (YYYY-MM-DD HH:MM:SS)
    - page: trang (default 1)
    - page_size: số lượng mỗi trang (default 20)
    """
    try:
        from datetime import datetime
        
        start_param = request.args.get('start_timestamp')
        end_param = request.args.get('end_timestamp')
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        
        if not start_param or not end_param:
            return jsonify({"error": "Missing start_timestamp or end_timestamp"}), 400
        
        # Convert to timestamp nếu là string
        try:
            start_timestamp = float(start_param)
        except ValueError:
            try:
                start_timestamp = datetime.strptime(start_param, "%Y-%m-%d %H:%M:%S").timestamp()
            except ValueError:
                return jsonify({"error": "Invalid start_timestamp format. Use Unix timestamp or YYYY-MM-DD HH:MM:SS"}), 400
        
        try:
            end_timestamp = float(end_param)
        except ValueError:
            try:
                end_timestamp = datetime.strptime(end_param, "%Y-%m-%d %H:%M:%S").timestamp()
            except ValueError:
                return jsonify({"error": "Invalid end_timestamp format. Use Unix timestamp or YYYY-MM-DD HH:MM:SS"}), 400
        
        txs = TransactionRepository.get_transactions_by_date_range(start_timestamp, end_timestamp)
        
        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        txs_page = txs[start:end]
        
        tx_list = [TransactionService.to_dict(tx, level='summary') for tx in txs_page]
        
        return jsonify({
            "success": True,
            "total_count": len(txs),
            "page": page,
            "page_size": page_size,
            "transactions": tx_list
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error getting transactions: {str(e)}"}), 500


# NOTE: DELETE endpoint đã bị xóa - Blockchain là immutable, không cho phép xóa transaction


@transaction_bp.route('/count', methods=['GET'])
def count_transactions():
    """Get total number of transactions"""
    try:
        count = TransactionRepository.count_transactions()
        
        return jsonify({
            "success": True,
            "total_transactions": count
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error counting transactions: {str(e)}"}), 500
