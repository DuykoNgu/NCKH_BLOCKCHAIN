from flask import Blueprint, request, jsonify
from app.repositories.TransactionRepository import TransactionRepository

transaction_bp = Blueprint('transaction_bp', __name__, url_prefix='/api/v1/transactions')

@transaction_bp.route('/all', methods=['GET'])
def get_all_transactions():
    """Lấy tất cả giao dịch trong hệ thống"""
    try:
        transactions = TransactionRepository.get_all_transactions()
        return jsonify({
            "success": True,
            "total": len(transactions),
            "transactions": [tx.to_dict() if hasattr(tx, 'to_dict') else vars(tx) for tx in transactions]
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@transaction_bp.route('/address/<address>', methods=['GET'])
def get_transactions_by_address(address):
    """Lấy giao dịch theo địa chỉ ví (cả gửi và nhận)"""
    try:
        # Lấy giao dịch gửi
        sent = TransactionRepository.get_transactions_by_sender(address)
        # Lấy giao dịch nhận
        received = TransactionRepository.get_transactions_by_recipient(address)
        
        # Hợp nhất và sắp xếp theo timestamp mới nhất
        all_txs = sent + received
        all_txs.sort(key=lambda x: x.timestamp, reverse=True)
        
        return jsonify({
            "success": True,
            "address": address,
            "total": len(all_txs),
            "transactions": [tx.to_dict() if hasattr(tx, 'to_dict') else vars(tx) for tx in all_txs]
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
