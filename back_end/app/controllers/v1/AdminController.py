from flask import Blueprint, jsonify
from app.repositories.AccountRepository import AccountRepository
from app.repositories.NFTRepository import NFTRepository
from app.repositories.TransactionRepository import TransactionRepository
from app.repositories.BlockRepository import BlockRepository
import time
from datetime import datetime, timedelta

admin_bp = Blueprint('admin_bp', __name__, url_prefix='/api/v1/admin')

@admin_bp.route('/stats', methods=['GET'])
def get_dashboard_stats():
    """Lấy số liệu thống kê tổng quan cho Dashboard Admin"""
    try:
        all_nfts = NFTRepository.get_all_nfts()
        total_nfts = len(all_nfts)
        verified_nfts = len([n for n in all_nfts if n.is_valid])
        pending_nfts = 0
        
        now = time.time()
        start_of_day = time.mktime(datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).timetuple())
        txs_today = TransactionRepository.get_transactions_by_date_range(start_of_day, now)
        
        total_blocks = BlockRepository.count_blocks()
        latest_block = BlockRepository.get_latest_block()
        
        all_accounts = AccountRepository.get_all_accounts()
        total_validators = len([a for a in all_accounts if a.role == 'validator' and a.is_active])
        pending_validators = len([a for a in all_accounts if a.role == 'validator' and not a.is_active])

        return jsonify({
            "success": True,
            "stats": {
                "total_nfts": total_nfts,
                "verified_nfts": verified_nfts,
                "pending_nfts": pending_nfts,
                "transactions_today": len(txs_today),
                "total_blocks": total_blocks,
                "latest_block_hash": latest_block.block_hash if latest_block else "0x0",
                "total_validators": total_validators,
                "pending_validators": pending_validators
            },
            "network": {
                "name": "EduChain Mainnet",
                "status": "active",
                "gas_price": "21 Gwei"
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@admin_bp.route('/recent-activities', methods=['GET'])
def get_recent_activities():
    """Lấy danh sách NFT và Giao dịch gần đây"""
    try:
        all_nfts = NFTRepository.get_all_nfts()
        all_nfts.sort(key=lambda x: x.minted_at if x.minted_at else 0, reverse=True)
        recent_nfts = []
        for nft in all_nfts[:5]:
            student_name = nft.metadata.get('recipient_name') if nft.metadata else None
            if not student_name:
                student_name = getattr(nft, 'recipient_name', None) or nft.owner_address[:10] + "..."

            recent_nfts.append({
                "id": nft.token_id,
                "name": student_name,
                "degree": nft.metadata.get('degree_type', 'N/A') if nft.metadata else "N/A",
                "university": nft.metadata.get('institution_address', 'N/A') if nft.metadata else "N/A",
                "status": "verified" if nft.is_valid else "revoked",
                "date": datetime.fromtimestamp(float(nft.minted_at)).strftime("%Y-%m-%d") if nft.minted_at else "N/A"
            })

        all_txs = TransactionRepository.get_all_transactions()
        recent_transactions = []
        for tx in all_txs[:5]:
            recent_transactions.append({
                "hash": tx.tx_hash[:10] + "...",
                "type": tx.payload.get('op', 'Unknown'),
                "time": datetime.fromtimestamp(tx.timestamp).strftime("%H:%M:%S"),
                "gas": "0.0001 ETH"
            })

        return jsonify({
            "success": True,
            "recent_nfts": recent_nfts,
            "recent_transactions": recent_transactions
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
