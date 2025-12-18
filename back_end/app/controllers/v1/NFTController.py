from flask import Blueprint, request, jsonify
from app.services.NFTService import NFTService


nft_bp = Blueprint('nft', __name__, url_prefix='/api/v1/nft')


@nft_bp.route('/create', methods=['POST'])
def create_nft():
    """
    Tạo NFT mới từ chứng chỉ
    
    Client phải ký metadata_hash ở client-side và gửi signature lên.
    Server sẽ verify signature bằng issuer's public key.
    
    Request body:
    {
        "issuer_id": "teacher_001",
        "issuer_signature": "0x... (signature of metadata_hash)",
        "student_id": "STU_001",
        "degree_type": "Bachelor of Science",
        "pdf_url": "https://example.com/cert.pdf",
        "institution": "Harvard University",
        "recipient_address": "0x..."
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields - signature thay vì private_key
        required_fields = ['issuer_id', 'issuer_signature', 'student_id', 'degree_type', 
                          'pdf_url', 'institution', 'recipient_address']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields. Required: issuer_id, issuer_signature, student_id, degree_type, pdf_url, institution, recipient_address"}), 400
        
        # Sử dụng NFTService.create_nft_from_dict() thay vì tạo thủ công
        nft, issuer, error = NFTService.create_nft_from_dict(data)
        
        if error:
            return jsonify({"error": error}), 404
        
        # Verify và save NFT using signature (không cần private_key)
        success, error_msg = NFTService.verify_and_save_nft(nft, issuer, data['issuer_signature'])
        
        if success:
            response = NFTService.success_response(nft, "NFT created successfully", level='standard')
            response["token_id"] = nft.token_id
            return jsonify(response), 201
        else:
            return jsonify({"error": error_msg or "Failed to create NFT"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nft_bp.route('/<token_id>', methods=['GET'])
def get_nft(token_id: str):
    """Lấy thông tin NFT theo token_id"""
    try:
        nft = NFTService.get_nft(token_id)
        
        if not nft:
            return jsonify({"error": "NFT not found"}), 404
        
        return jsonify(NFTService.success_response(nft, level='full')), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nft_bp.route('/student/<student_id>', methods=['GET'])
def get_student_nfts(student_id: str):
    """Lấy tất cả NFT của một student"""
    try:
        nfts = NFTService.get_student_nfts(student_id)
        
        return jsonify({
            "total": len(nfts),
            "nfts": [NFTService.get_nft_info(nft) for nft in nfts]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nft_bp.route('/user/<recipient_address>', methods=['GET'])
def get_user_nfts(recipient_address: str):
    """Lấy tất cả NFT của một user"""
    try:
        nfts = NFTService.get_user_nfts(recipient_address)
        
        return jsonify({
            "total": len(nfts),
            "nfts": [NFTService.get_nft_info(nft) for nft in nfts]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nft_bp.route('/all', methods=['GET'])
def get_all_nfts():
    """Lấy tất cả NFT trong hệ thống"""
    try:
        nfts = NFTService.get_all_nfts()
        
        return jsonify({
            "total": len(nfts),
            "nfts": [NFTService.get_nft_info(nft) for nft in nfts]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nft_bp.route('/<token_id>/verify', methods=['POST'])
def verify_nft(token_id: str):
    """Xác minh NFT signature"""
    try:
        nft = NFTService.get_nft(token_id)
        
        if not nft:
            return jsonify({"error": "NFT not found"}), 404
        
        is_valid = NFTService.verify_nft(nft)
        
        return jsonify({
            "token_id": token_id,
            "is_valid": is_valid,
            "issuer_signature": nft.issuer_signature or None,
            "is_revoked": not nft.is_valid
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nft_bp.route('/<token_id>/revoke', methods=['POST'])
def revoke_nft(token_id: str):
    """
    Thu hồi NFT - chỉ issuer mới được revoke
    
    Request body:
    {
        "issuer_id": "teacher_001",
        "issuer_signature": "0x... (signature of revoke message)",
        "reason": "Reason for revocation"  // optional
    }
    """
    try:
        data = request.get_json() or {}
        
        # Validate required fields
        if not data.get('issuer_id') or not data.get('issuer_signature'):
            return jsonify({"error": "Missing required fields: issuer_id, issuer_signature"}), 400
        
        nft = NFTService.get_nft(token_id)
        if not nft:
            return jsonify({"error": "NFT not found"}), 404
        
        # Kiểm tra người revoke có phải issuer không
        issuer = NFTService.get_user_by_id(data['issuer_id'])
        if not issuer:
            return jsonify({"error": "Issuer not found"}), 404
        
        if issuer.pubkey != nft.issuer_pubkey:
            return jsonify({"error": "Only the original issuer can revoke this NFT"}), 403
        
        # Verify signature để đảm bảo request từ đúng issuer
        # Message = "REVOKE:{token_id}"
        revoke_message = f"REVOKE:{token_id}".encode('utf-8')
        from app.utils.CryptoUtils import CryptoUtils
        if not CryptoUtils.verify_signature(revoke_message, data['issuer_signature'], issuer.pubkey):
            return jsonify({"error": "Invalid signature - revoke request not authorized"}), 401
        
        reason = data.get('reason', 'Revoked by issuer')
        success = NFTService.revoke_nft(token_id, reason)
        
        if success:
            return jsonify({
                "success": True,
                "message": "NFT revoked successfully",
                "token_id": token_id,
                "reason": reason
            }), 200
        else:
            return jsonify({"error": "Failed to revoke NFT"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nft_bp.route('/verify/batch', methods=['POST'])
def verify_batch_nfts():
    """Xác minh một batch NFTs"""
    try:
        data = request.get_json()
        # Hỗ trợ cả token_ids và token_id
        token_ids = data.get('token_ids', data.get('token_id', []))
        
        if not token_ids:
            return jsonify({"error": "token_ids hoặc token_id required"}), 400
        
        # Kiểm tra giới hạn số lượng token để tránh quá tải
        max_batch_size = 100
        if len(token_ids) > max_batch_size:
            return jsonify({
                "error": f"Quá nhiều NFTs, tối đa {max_batch_size} trong một lần"
            }), 400
        
        # Lấy NFT một lần duy nhất cho mỗi token_id (tối ưu hiệu suất)
        nfts = []
        for tid in token_ids:
            nft = NFTService.get_nft(tid)
            if nft:
                nfts.append(nft)
        
        if not nfts:
            return jsonify({
                "error": "Không tìm thấy NFT nào từ danh sách token_ids"
            }), 404
        
        results = NFTService.verify_all_nfts(nfts)
        
        return jsonify(results), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nft_bp.route('/<token_id>/metadata-hash', methods=['GET'])
def get_metadata_hash(token_id: str):
    """Lấy hash của metadata"""
    try:
        nft = NFTService.get_nft(token_id)
        
        if not nft:
            return jsonify({"error": "NFT not found"}), 404
        
        metadata_hash = NFTService.get_nft_metadata_hash(nft)
        
        return jsonify({
            "token_id": token_id,
            "metadata_hash": metadata_hash
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
