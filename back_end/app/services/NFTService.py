from typing import List, Optional, Dict, Any, Tuple
import json
import hashlib
from app.models.NFT import NFT
from app.models.NFTmetadata import NFTmetadata
from app.models.User import User
from app.repositories.NFTRepository import NFTRepository
from app.services.UserService import UserService
from app.utils.CryptoUtils import CryptoUtils


class NFTService:
    """Service để quản lý business logic của NFT"""

    # =========================================================================
    # FACTORY METHODS - Tạo NFT và Metadata từ các nguồn khác nhau
    # =========================================================================
    
    @staticmethod
    def create_metadata_from_dict(data: Dict[str, Any]) -> NFTmetadata:
        """
        Tạo NFTmetadata từ dictionary data.
        
        Args:
            data: Dictionary chứa thông tin metadata
                {
                    "student_id": str,
                    "degree_type": str,
                    "pdf_url": str,
                    "pdf_hash": str (optional - sẽ tự tính nếu không có),
                    "institution": str,
                    "issued_at": int (optional)
                }
        
        Returns:
            NFTmetadata object
        """
        # Tự động tính pdf_hash nếu không được cung cấp
        pdf_hash = data.get('pdf_hash')
        if not pdf_hash and data.get('pdf_url'):
            pdf_hash = hashlib.sha256(data['pdf_url'].encode()).hexdigest()
        
        return NFTmetadata(
            student_id=data.get('student_id', ''),
            degree_type=data.get('degree_type', ''),
            pdf_url=data.get('pdf_url', ''),
            pdf_hash=pdf_hash or '',
            institution=data.get('institution', ''),
            issued_at=data.get('issued_at')
        )

    @staticmethod
    def create_nft_from_dict(data: Dict[str, Any]) -> Optional[NFT]:
        """
        Tạo NFT từ dictionary data.
        
        Flow:
        1. Lấy issuer từ UserService
        2. Lấy recipient từ UserService  
        3. Tạo metadata từ data
        4. Tạo NFT
        
        Args:
            data: Dictionary chứa thông tin NFT
                {
                    "issuer_id": str,
                    "student_id": str,
                    "degree_type": str,
                    "pdf_url": str,
                    "institution": str,
                    "recipient_address": str
                }
        
        Returns:
            Tuple (NFT object, issuer User, error message)
        """
        # Lấy issuer qua UserService
        issuer = UserService.get_user_by_id(data.get('issuer_id', ''))
        if not issuer:
            return None, None, "Issuer user not found"
        
        # Lấy recipient qua UserService
        recipient = UserService.get_user_by_address(data.get('recipient_address', ''))
        if not recipient:
            return None, None, "Recipient user not found"
        
        # Tạo metadata từ data
        metadata = NFTService.create_metadata_from_dict(data)
        
        # Tạo NFT
        nft = NFT(
            issuer_pubkey=issuer.pubkey,
            metadata=metadata,
            recipient_address=recipient
        )
        
        return nft, issuer, None

    @staticmethod
    def create_nft(issuer_pubkey: str, metadata: NFTmetadata, 
                   recipient: User) -> NFT:
        """Tạo NFT mới"""
        nft = NFT(
            issuer_pubkey=issuer_pubkey,
            metadata=metadata,
            recipient_address=recipient
        )
        return nft

    # =========================================================================
    # SIGNING & VERIFICATION - Ký và xác minh NFT
    # =========================================================================

    @staticmethod
    def sign_nft(nft: NFT, issuer_private_key: str) -> str:
        """Ký NFT bằng private key của issuer"""
        nft_data = {
            "token_id": nft.token_id,
            "metadata": nft.metadata.to_dict(),
            "recipient_address": nft.recipient_address.address
        }
        nft_data_bytes = json.dumps(nft_data, sort_keys=True).encode()
        nft.issuer_signature = CryptoUtils.sign_data(nft_data_bytes, issuer_private_key)
        return nft.issuer_signature

    @staticmethod
    def verify_nft(nft: NFT) -> bool:
        """Xác minh chữ ký NFT"""
        if not nft.issuer_signature:
            return False
        
        nft_data = {
            "token_id": nft.token_id,
            "metadata": nft.metadata.to_dict(),
            "recipient_address": nft.recipient_address.address
        }
        nft_data_bytes = json.dumps(nft_data, sort_keys=True).encode()
        return CryptoUtils.verify_signature(nft_data_bytes, nft.issuer_signature, nft.issuer_pubkey)

    @staticmethod
    def verify_nft_signature(nft: NFT) -> bool:
        """Xác minh chữ ký NFT (alias for verify_nft)"""
        return NFTService.verify_nft(nft)

    @staticmethod
    def verify_and_save_nft(nft: NFT, issuer, issuer_signature: str) -> Tuple[bool, Optional[str]]:
        """
        Verify signature và lưu NFT vào database.
        Client đã ký metadata_hash ở client-side, server chỉ verify.
        
        Returns: (success, error_message)
        """
        try:
            # Set signature vào NFT
            nft.issuer_signature = issuer_signature
            
            # Verify signature bằng public key của issuer
            if not NFTService.verify_nft_signature(nft):
                return False, "Invalid signature - verification failed"
            
            # Save vào database
            success = NFTRepository.create_nft(nft)
            if success:
                return True, None
            else:
                return False, "Failed to save NFT to database"
                
        except Exception as e:
            return False, f"Error verifying and saving NFT: {str(e)}"

    @staticmethod
    def sign_and_save_nft(nft: NFT, issuer_private_key: str) -> bool:
        """
        Ký NFT và lưu vào database.
        DEPRECATED: Dùng verify_and_save_nft() thay thế - private key không nên gửi qua network.
        """
        try:
            NFTService.sign_nft(nft, issuer_private_key)
            return NFTRepository.create_nft(nft)
        except Exception as e:
            print(f"Error signing and saving NFT: {str(e)}")
            return False

    @staticmethod
    def get_nft(token_id: str) -> Optional[NFT]:
        """Lấy NFT theo ID"""
        return NFTRepository.get_nft_by_id(token_id)

    @staticmethod
    def get_student_nfts(student_id: str) -> List[NFT]:
        """Lấy tất cả NFT của một student"""
        return NFTRepository.get_nft_by_student(student_id)

    @staticmethod
    def get_user_nfts(recipient_address: str) -> List[NFT]:
        """Lấy tất cả NFT của một user"""
        return NFTRepository.get_nft_by_recipient(recipient_address)

    @staticmethod
    def get_all_nfts() -> List[NFT]:
        """Lấy tất cả NFT trong hệ thống"""
        return NFTRepository.get_all_nfts()

    @staticmethod
    def revoke_nft(token_id: str, reason: str = "Revoked by issuer") -> bool:
        """Thu hồi NFT với lý do"""
        return NFTRepository.revoke_nft(token_id, reason)
    
    @staticmethod
    def get_user_by_id(user_id: str):
        """Lấy user theo ID - wrapper để tránh circular import"""
        return UserService.get_user_by_id(user_id)

    @staticmethod
    def verify_all_nfts(nfts: List[NFT]) -> dict:
        """Xác minh một danh sách NFTs"""
        results = {
            "total": len(nfts),
            "valid": 0,
            "invalid": 0,
            "details": []
        }
        
        for nft in nfts:
            is_valid = NFTService.verify_nft(nft)
            results["valid"] += 1 if is_valid else 0
            results["invalid"] += 0 if is_valid else 1
            results["details"].append({
                "token_id": nft.token_id,
                "is_valid": is_valid,
                "issuer": nft.issuer_pubkey[:16] + "...",
                "recipient": nft.recipient_address.address
            })
        
        return results

    @staticmethod
    def get_nft_metadata_hash(nft: NFT) -> str:
        """Lấy hash của metadata"""
        return nft.metadata.hash_metadata()

    @staticmethod
    def get_nft_info(nft: NFT, level: str = 'full') -> dict:
        """
        Lấy thông tin NFT với các level khác nhau.
        
        Args:
            nft: NFT object
            level: Mức độ chi tiết
                - 'summary': token_id, issuer, recipient, is_valid
                - 'standard': + minted_at, signature
                - 'full': + metadata đầy đủ, metadata_hash
        """
        result = {
            "token_id": nft.token_id,
            "issuer_pubkey": nft.issuer_pubkey,
            "recipient_address": nft.recipient_address.address,
            "is_valid": nft.is_valid
        }
        
        if level == 'summary':
            return result
        
        result.update({
            "minted_at": nft.minted_at,
            "issuer_signature": nft.issuer_signature or None
        })
        
        if level == 'standard':
            return result
        
        # Full
        result.update({
            "metadata": nft.metadata.to_dict(),
            "recipient": {
                "user_id": nft.recipient_address.user_id,
                "address": nft.recipient_address.address,
                "role": nft.recipient_address.role.value
            },
            "metadata_hash": nft.metadata.hash_metadata()
        })
        return result
    
    @staticmethod
    def success_response(nft: NFT, message: str = None, level: str = 'standard') -> dict:
        """Tạo response dictionary chuẩn cho API."""
        response = {
            "success": True,
            "nft": NFTService.get_nft_info(nft, level)
        }
        if message:
            response["message"] = message
        return response
