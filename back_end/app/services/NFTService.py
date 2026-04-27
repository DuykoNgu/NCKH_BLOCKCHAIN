from typing import List, Optional
import json
from app.models.NFT import NFT
from app.models.NFTmetadata import NFTmetadata
from app.repositories.NFTRepository import NFTRepository
from app.utils.CryptoUtils import CryptoUtils
from app.models.Account import Account

class NFTService:
    """Service để quản lý business logic của NFT"""

    @staticmethod
    def create_nft(issuer_address: str, issuer_pubkey: str, metadata: NFTmetadata, 
                   recipient: Account, issuer_signature: Optional[str] = None) -> NFT:
        """Tạo NFT mới"""
        nft = NFT(
            issuer_address=issuer_address,
            issuer_pubkey=issuer_pubkey,
            metadata=metadata,
            owner_address=recipient,
            issuer_signature=issuer_signature
        )
        return nft

    @staticmethod
    def sign_nft(nft: NFT, issuer_private_key: str) -> str:
        """Ký NFT bằng private key của issuer"""
        nft_data = {
            "token_id": nft.token_id,
            "metadata": nft.metadata.to_dict(),
            "owner_address": nft.owner_address.address
        }
        nft_data_bytes = json.dumps(nft_data, sort_keys=True).encode()
        nft.issuer_signature = CryptoUtils.sign_data(nft_data_bytes, issuer_private_key)
        return nft.issuer_signature

    @staticmethod
    def verify_nft(nft: NFT) -> bool:
        """Xác minh chữ ký NFT"""
        if not nft.issuer_signature:
            return False
        
        metadata = NFTmetadata(
            degree_type=nft.metadata.degree_type,
            pdf_url=nft.metadata.pdf_url,
            pdf_hash=nft.metadata.pdf_hash,
            institution_address=nft.metadata.institution_address,
            issued_at=nft.metadata.issued_at
        )
        print("Verifying NFT with metadata:", metadata.to_dict())
        message_to_verify = metadata.get_signing_data()
        is_authentic = CryptoUtils.verify_signature(
            data= message_to_verify,
            signature_hex=nft.issuer_signature,
            public_key_hex=nft.issuer_pubkey
        )
        return is_authentic

    @staticmethod
    def get_user_nfts(recipient_address: str) -> List[NFT]:
        """Lấy tất cả NFT của một user"""
        return NFTRepository.get_nft_by_address(recipient_address)

    @staticmethod
    def get_all_nfts() -> List[NFT]:
        """Lấy tất cả NFT trong hệ thống"""
        return NFTRepository.get_all_nfts()
    @staticmethod
    def get_nft_by_issuer(issuer_address: str) -> List[NFT]:
        """Lấy tất cả NFT do một issuer phát hành"""
        return NFTRepository.get_nft_by_issuer(issuer_address)
    @staticmethod
    def get_nft_by_id(token_id : str) -> NFT:
        return NFTRepository.get_nft_by_id(token_id)
    @staticmethod
    def revoke_nft(token_id: str) -> bool:
        """Thu hồi NFT"""
        return NFTRepository.revoke_nft(token_id, "Revoked by issuer")

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
                "recipient": nft.owner_address.address
            })
        
        return results

    @staticmethod
    def get_nft_metadata_hash(nft: NFT) -> str:
        """Lấy hash của metadata"""
        return nft.metadata.hash_metadata()

    @staticmethod
    def get_nft_info(nft: NFT) -> dict:
        """Lấy thông tin đầy đủ của NFT"""
        return {
            "token_id": nft.token_id,
            "issuer_pubkey": nft.issuer_pubkey,
            "metadata": nft.metadata.to_dict(),
            "recipient": {
                "address": nft.owner_address.address if hasattr(nft.owner_address, 'address') else nft.owner_address,
                "role": getattr(nft.owner_address, 'role', 'client').value if hasattr(getattr(nft.owner_address, 'role', None), 'value') else str(getattr(nft.owner_address, 'role', 'client')),
                "org_name": getattr(nft.owner_address, 'org_name', 'Unknown')
            },
            # Các trường phẳng bổ sung cho FE
            "recipient_address": nft.owner_address.address if hasattr(nft.owner_address, 'address') else nft.owner_address,
            "recipient_name": getattr(nft.owner_address, 'full_name', 'Unknown') if hasattr(nft.owner_address, 'full_name') else "Unknown",
            "issuer_signature": nft.issuer_signature or None,
            "is_valid": nft.is_valid,
            "minted_at": nft.minted_at,
            "metadata_hash": nft.metadata.hash_metadata()
        }
