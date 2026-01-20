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
    def create_nft(issuer_pubkey: str, metadata: NFTmetadata, 
                   recipient: Account) -> NFT:
        """Tạo NFT mới"""
        nft = NFT(
            issuer_pubkey=issuer_pubkey,
            metadata=metadata,
            recipient_address=recipient
        )
        return nft

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
    def sign_and_save_nft(nft: NFT, issuer_private_key: str) -> bool:
        """Ký NFT và lưu vào database"""
        try:
            NFTService.sign_nft(nft, issuer_private_key)
            return NFTRepository.create_nft(nft)
        except Exception as e:
            print(f"Error signing and saving NFT: {str(e)}")
            return False
        """Lấy NFT theo ID"""
        return NFTRepository.get_nft_by_id(token_id)

    @staticmethod
    def get_user_nfts(recipient_address: str) -> List[NFT]:
        """Lấy tất cả NFT của một user"""
        return NFTRepository.get_nft_by_address(recipient_address)

    @staticmethod
    def get_all_nfts() -> List[NFT]:
        """Lấy tất cả NFT trong hệ thống"""
        return NFTRepository.get_all_nfts()

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
                "recipient": nft.recipient_address.address
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
                "address": nft.recipient_address.address,
                "role": nft.recipient_address.role.value,
                "org_name": nft.recipient_address.org_name.value
            },
            "issuer_signature": nft.issuer_signature or None,
            "is_valid": nft.is_valid,
            "minted_at": nft.minted_at,
            "metadata_hash": nft.metadata.hash_metadata()
        }
