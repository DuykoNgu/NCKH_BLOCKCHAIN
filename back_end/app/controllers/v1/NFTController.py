import os

from flask import Blueprint, request, jsonify
from typing import Optional
from app.services.NFTService import NFTService
from app.models.NFTmetadata import NFTmetadata
from app.repositories.AccountRepository import AccountRepository
from app.repositories.NFTRepository import NFTRepository
from app.utils.CryptoUtils import CryptoUtils

nft_bp = Blueprint('nft', __name__, url_prefix='/api/v1/nft')


@nft_bp.route('/create', methods=['POST'])
def create_nft():
    """
    Tạo NFT mới từ chứng chỉ
    
    Request body:
    {
        "issuer_id": "teacher_001",
        "student_id": "STU_001",
        "degree_type": "Bachelor of Science",
        "pdf_url": "https://example.com/cert.pdf",
        "institution_address": "Harvard University",
        "recipient_address": "0x..."
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = [ 'degree_type', 'pdf_url', 
                    'pdf_hash', 'institution_address', 'recipient_address', 'signature']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Get issuer
        issuer = AccountRepository.get_account_by_address(data['institution_address'])
        if not issuer:
            return jsonify({"error": "Issuer user not found"}), 404
        
        # Get recipient user
        recipient = AccountRepository.get_account_by_address(data['recipient_address'])
        if not recipient:
            return jsonify({"error": "Recipient user not found"}), 404
        
        issued_at = data.get('issued_at')
        if issued_at:
            try:
                issued_at = int(issued_at)
            except (ValueError, TypeError):
                issued_at = None

        metadata = NFTmetadata(
            degree_type=data['degree_type'],
            pdf_url=data['pdf_url'],
            pdf_hash=data['pdf_hash'],
            institution_address=data['institution_address'],
            issued_at=issued_at
        )
        
        message_to_verify = metadata.get_signing_data()
        metadata.institution = data['institution']
        metadata.student_id = data['student_id']
      
        is_authentic = CryptoUtils.verify_signature(
            data= message_to_verify,
            signature_hex=data['signature'],
            public_key_hex=issuer.public_key
        )

        if not is_authentic:
            return jsonify({"error": "Invalid digital signature. "}), 401
        
        # ✅ CREATE TRANSACTION FOR BLOCKCHAIN
        from app.models.Transaction import Transaction
        from app.services.TransactionService import TransactionService
        from app.services.BlockChainService import BlockChainService
        from app.services.NetworkService import get_network_service
        from app.blockchain_instance import get_blockchain_instance
        
        # Create transaction payload
        tx = Transaction(
            sender_pubkey=issuer.public_key,
            sender_address=issuer.address,
            recipient_address=recipient.address,
            payload={
                "op": "mint_nft",
                "degree_type": data['degree_type'],
                "pdf_hash": data['pdf_hash'],
                "institution_address": data['institution_address']
            }
        )
        
        # Sign transaction (need issuer's private key - should be passed or retrieved securely)
        # For now, we'll calculate tx_hash without signing
        # In production, you should sign the transaction with issuer's private key
        tx.tx_hash = TransactionService.calculate_hash(tx)
        tx.tx_id = tx.tx_hash  # Use hash as ID for now
        
        # Add to mempool
        blockchain = get_blockchain_instance()
        if not BlockChainService.add_transaction_to_mempool(blockchain, tx):
            return jsonify({"error": "Failed to add transaction to mempool"}), 500
        
        # 💾 SAVE TRANSACTION TO DATABASE FOR PERSISTENCE
        from app.repositories.TransactionRepository import TransactionRepository
        if TransactionRepository.create_transaction(tx):
            print(f"✓ Transaction saved to database: {tx.tx_hash[:16]}...")
        else:
            print(f"⚠ Warning: Failed to save transaction to database, but still in mempool")
        
        # Broadcast transaction to P2P network
        try:
            network_service = get_network_service()
            propagated = network_service.broadcast_transaction(tx.to_dict())
            print(f"✓ Transaction propagated to {propagated} peers")
        except Exception as e:
            print(f"⚠ Warning: Failed to propagate transaction: {e}")
            # Continue even if propagation fails
        
        # Create NFT
        nft = NFTService.create_nft(
            issuer_address=issuer.address,
            issuer_pubkey=issuer.public_key,
            metadata=metadata,
            recipient=recipient,
            issuer_signature=data['signature']
        )
        # Sign and save NFT using NFTService
        success = NFTRepository.create_nft(nft)
        
        if success:
            return jsonify({
                "message": "NFT created successfully",
                "success": True,
                "token_id": nft.token_id,
                "tx_hash": tx.tx_hash,
                "nft": {
                    "token_id": nft.token_id,
                    "issuer_pubkey": nft.issuer_pubkey,
                    "recipient_address": recipient.address,
                    "is_valid": nft.is_valid,
                    "minted_at": nft.minted_at
                }
            }), 201
        else:
            return jsonify({"error": "Failed to create NFT"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nft_bp.route('/<token_id>', methods=['GET'])
def get_nft(token_id: str):
    """Lấy thông tin NFT theo token_id"""
    try:
        nft = NFTService.get_nft_by_id(token_id)
        
        if not nft:
            return jsonify({"error": "NFT not found"}), 404
        
        return jsonify({
            "nft": NFTService.get_nft_info(nft)
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

@nft_bp.route('/issuer/<issuer_address>', methods=['GET'])
def get_nfts_by_issuer(issuer_address: str):
    try:
        nfts= NFTService.get_nft_by_issuer(issuer_address)
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
        nft = NFTService.get_nft_by_id(token_id)
        
        if not nft:
            return jsonify({"error": "NFT not found"}), 404
        
        is_valid = NFTService.verify_nft(nft)
        
        return jsonify({
            "token_id": "true",
            "is_valid": "true",
            "issuer_signature": nft.issuer_signature or None,
            "is_revoked": not nft.is_valid
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nft_bp.route('/<token_id>/revoke', methods=['POST'])
def revoke_nft(token_id: str):
    """Thu hồi NFT"""
    try:
        nft = NFTService.get_nft_by_id(token_id)
        
        if not nft:
            return jsonify({"error": "NFT not found"}), 404
        
        success = NFTService.revoke_nft(token_id)
        
        if success:
            return jsonify({
                "message": "NFT revoked successfully",
                "token_id": token_id
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
            nft = NFTService.get_nft_by_id(tid)
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
        nft = NFTService.get_nft_by_id(token_id)
        
        if not nft:
            return jsonify({"error": "NFT not found"}), 404
        
        metadata_hash = NFTService.get_nft_metadata_hash(nft)
        
        return jsonify({
            "token_id": token_id,
            "metadata_hash": metadata_hash
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nft_bp.route('/batch-upload', methods=['POST'])
def batch_upload_pdfs():
    """
    Giai đoạn 2: Nhận nhiều file PDF, upload lên Cloudinary, tính hash.
    
    Request: multipart/form-data
    - files[]: multiple PDF files (tên file = MaSV.pdf)
    
    Response:
    {
        "success": true,
        "data": {
            "SV001": { "url": "https://...", "hash": "abc..." },
            "SV002": { "url": "https://...", "hash": "def..." }
        },
        "errors": {
            "SV003": "Upload failed: ..."
        }
    }
    """
    import hashlib
    import cloudinary
    import cloudinary.uploader
    from concurrent.futures import ThreadPoolExecutor, as_completed

    try:
        files = request.files.getlist('files')
        if not files or len(files) == 0:
            return jsonify({"error": "Không có file nào được gửi"}), 400

        # Validate: chỉ chấp nhận PDF
        for f in files:
            if not f.filename or not f.filename.lower().endswith('.pdf'):
                return jsonify({
                    "error": f"File '{f.filename}' không phải PDF"
                }), 400

        # Giới hạn batch size
        MAX_BATCH = 200
        if len(files) > MAX_BATCH:
            return jsonify({
                "error": f"Tối đa {MAX_BATCH} file mỗi lần upload"
            }), 400

        results = {}
        errors = {}

        def process_single_file(file_data, student_id):
            """Upload 1 file lên Cloudinary + tính hash"""
            try:
                # Tính SHA-256 hash
                file_bytes = file_data
                pdf_hash = hashlib.sha256(file_bytes).hexdigest()

                # Upload lên Cloudinary
                import io
                upload_result = cloudinary.uploader.upload(
                    io.BytesIO(file_bytes),
                    folder='nft-certificates',
                    resource_type='raw',
                    public_id=f"batch_{student_id}.pdf",
                    tags=['nft', 'certificate', 'batch'],
                    overwrite=True
                )

                return {
                    "student_id": student_id,
                    "success": True,
                    "url": upload_result.get('secure_url'),
                    "hash": pdf_hash
                }
            except Exception as e:
                return {
                    "student_id": student_id,
                    "success": False,
                    "error": str(e)
                }

        # Đọc tất cả file data trước (vì file stream chỉ đọc 1 lần)
        file_items = []
        for f in files:
            pure_filename = os.path.basename(f.filename)
            student_id = pure_filename.rsplit('.', 1)[0]  
            file_bytes = f.read()
            file_items.append((file_bytes, student_id))

        # Upload song song 5 file cùng lúc
        CONCURRENCY = 5
        with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
            futures = {
                executor.submit(process_single_file, data, sid): sid
                for data, sid in file_items
            }

            for future in as_completed(futures):
                result = future.result()
                if result["success"]:
                    results[result["student_id"]] = {
                        "url": result["url"],
                        "hash": result["hash"]
                    }
                else:
                    errors[result["student_id"]] = result["error"]

        return jsonify({
            "success": len(errors) == 0,
            "data": results,
            "errors": errors,
            "total_uploaded": len(results),
            "total_failed": len(errors)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
