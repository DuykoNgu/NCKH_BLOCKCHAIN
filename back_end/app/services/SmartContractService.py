from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

from app.models.SmartContract import SmartContract
from app.models.NFT import NFT
from app.models.NFTmetadata import NFTmetadata
from app.models.User import User
from app.repositories.NFTRepository import NFTRepository
from app.services.UserService import UserService


class SmartContractService:
    """Service quản lý business logic của SmartContract"""
    
    # =========================================================================
    # HELPER METHODS - Tránh code trùng lặp
    # =========================================================================
    
    @staticmethod
    def _error(message: str) -> Dict[str, Any]:
        """Helper: Tạo error response"""
        return {"success": False, "error": message}
    
    @staticmethod
    def _success(data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper: Tạo success response"""
        return {"success": True, **data}
    
    @staticmethod
    def _check_token_exists(contract: SmartContract, token_id: str) -> Tuple[bool, Optional[NFT]]:
        """Helper: Kiểm tra token tồn tại. Returns (exists, nft)"""
        nft = contract.token_registry.get(token_id)
        return (nft is not None, nft)
    
    @staticmethod
    def _check_is_revoked(contract: SmartContract, token_id: str) -> bool:
        """Helper: Kiểm tra token đã bị revoke"""
        return token_id in contract.revoked_tokens
    
    @staticmethod
    def _check_is_owner(contract: SmartContract, pubkey: str) -> bool:
        """Helper: Kiểm tra có phải owner contract"""
        return pubkey == contract.owner_pubkey
    
    @staticmethod
    def _check_is_minter(contract: SmartContract, pubkey: str) -> bool:
        """Helper: Kiểm tra có quyền mint"""
        return pubkey in contract.authorized_minters
    
    @staticmethod
    def _update_balance(contract: SmartContract, address: str, delta: int):
        """Helper: Cập nhật balance (+1 hoặc -1)"""
        contract.token_balances[address] = max(0, contract.token_balances.get(address, 0) + delta)
    
    # =========================================================================
    # CORE FUNCTIONS - Các chức năng chính
    # =========================================================================
    
    @staticmethod
    def mint_nft(contract: SmartContract, nft: NFT, minter_pubkey: str, 
                 save_to_db: bool = True) -> Dict[str, Any]:
        """
        Cấp chứng chỉ mới.
        
        Args:
            contract: SmartContract instance
            nft: NFT đã được sign (có issuer_signature)
            minter_pubkey: Public key của người mint
            save_to_db: Lưu vào database hay không (default: True)
        
        Note: NFT phải được sign trước bằng NFTService.sign_nft()
        """
        # Kiểm tra quyền
        if not SmartContractService._check_is_minter(contract, minter_pubkey):
            return SmartContractService._error("Unauthorized minter")
        
        # Kiểm tra NFT đã được ký
        if not nft.issuer_signature:
            return SmartContractService._error("NFT must be signed before minting")
        
        # Kiểm tra trùng lặp
        if nft.token_id in contract.token_registry:
            return SmartContractService._error(f"Token {nft.token_id} already exists")
        
        # Mint vào contract
        contract.token_registry[nft.token_id] = nft
        SmartContractService._update_balance(contract, nft.recipient_address.address, 1)
        contract.total_supply += 1
        
        # Lưu vào database
        if save_to_db:
            success = NFTRepository.create_nft(nft)
            if not success:
                # Rollback contract state nếu save DB thất bại
                del contract.token_registry[nft.token_id]
                SmartContractService._update_balance(contract, nft.recipient_address.address, -1)
                contract.total_supply -= 1
                return SmartContractService._error("Failed to save NFT to database")
        
        return SmartContractService._success({
            "token_id": nft.token_id,
            "recipient": nft.recipient_address.address,
            "total_supply": contract.total_supply
        })
    
    @staticmethod
    def transfer_nft(contract: SmartContract, token_id: str, from_address: str,
                     to_address: str) -> Dict[str, Any]:
        """Chuyển quyền sở hữu (nếu cho phép)"""
        exists, nft = SmartContractService._check_token_exists(contract, token_id)
        if not exists:
            return SmartContractService._error("Token not found")
        
        if nft.recipient_address.address != from_address:
            return SmartContractService._error("Not the owner")
        
        if SmartContractService._check_is_revoked(contract, token_id):
            return SmartContractService._error("Token has been revoked")
        
        # Transfer
        SmartContractService._update_balance(contract, from_address, -1)
        SmartContractService._update_balance(contract, to_address, 1)
        
        contract.transfer_history.append({
            "token_id": token_id,
            "from": from_address,
            "to": to_address,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return SmartContractService._success({"token_id": token_id, "new_owner": to_address})
    
    @staticmethod
    def revoke_nft(contract: SmartContract, token_id: str, revoker_pubkey: str,
                   reason: str = "", update_db: bool = True) -> Dict[str, Any]:
        """
        Thu hồi chứng chỉ.
        
        Args:
            contract: SmartContract instance
            token_id: ID của NFT cần thu hồi
            revoker_pubkey: Public key của người thu hồi
            reason: Lý do thu hồi
            update_db: Cập nhật database hay không
        """
        if not SmartContractService._check_is_owner(contract, revoker_pubkey):
            return SmartContractService._error("Only owner can revoke")
        
        exists, nft = SmartContractService._check_token_exists(contract, token_id)
        if not exists:
            return SmartContractService._error("Token not found")
        
        if SmartContractService._check_is_revoked(contract, token_id):
            return SmartContractService._error("Already revoked")
        
        # Revoke trong contract
        contract.revoked_tokens.add(token_id)
        nft.is_valid = False
        nft.revoked = {
            "revoked_at": datetime.utcnow().isoformat(),
            "reason": reason,
            "revoked_by": revoker_pubkey
        }
        SmartContractService._update_balance(contract, nft.recipient_address.address, -1)
        
        # Update database
        if update_db:
            db_success = NFTRepository.revoke_nft(token_id, reason)
            if not db_success:
                # Rollback nếu DB update thất bại
                contract.revoked_tokens.discard(token_id)
                nft.is_valid = True
                nft.revoked = None
                SmartContractService._update_balance(contract, nft.recipient_address.address, 1)
                return SmartContractService._error("Failed to update database")
        
        return SmartContractService._success({"token_id": token_id, "reason": reason})
    
    @staticmethod
    def verify_nft(contract: SmartContract, token_id: str, 
                   verify_signature: bool = False) -> Dict[str, Any]:
        """
        Xác thực chứng chỉ (cho nhà tuyển dụng).
        
        Args:
            contract: SmartContract instance
            token_id: ID của NFT
            verify_signature: Có verify chữ ký không (cần import NFTService)
        """
        exists, nft = SmartContractService._check_token_exists(contract, token_id)
        if not exists:
            return {**SmartContractService._error("Token not found"), "valid": False}
        
        # Kiểm tra trạng thái cơ bản
        is_valid = (
            nft.is_valid and
            not SmartContractService._check_is_revoked(contract, token_id) and
            nft.issuer_signature is not None
        )
        
        # Verify signature nếu cần (import ở đây để tránh circular import)
        signature_valid = None
        if verify_signature and is_valid:
            from app.services.NFTService import NFTService
            signature_valid = NFTService.verify_nft(nft)
            is_valid = is_valid and signature_valid
        
        result = {
            "valid": is_valid,
            "token_id": token_id,
            "issuer": nft.issuer_pubkey,
            "recipient": nft.recipient_address.address,
            "metadata": nft.metadata.to_dict(),
            "minted_at": nft.minted_at,
            "revoked": SmartContractService._check_is_revoked(contract, token_id),
            "revoked_info": nft.revoked if nft.revoked else None
        }
        
        if signature_valid is not None:
            result["signature_valid"] = signature_valid
        
        return SmartContractService._success(result)
    
    # =========================================================================
    # HIGH-LEVEL METHODS - Kết hợp NFTService và SmartContract
    # =========================================================================
    
    @staticmethod
    def create_and_mint_nft(contract: SmartContract, metadata_data: Dict[str, Any],
                           issuer_id: str, recipient_address: str, 
                           issuer_private_key: str) -> Dict[str, Any]:
        """
        Tạo, ký và mint NFT trong một lần gọi (high-level method).
        
        Flow:
        1. Tạo NFT từ data (NFTService.create_nft_from_dict)
        2. Ký NFT (NFTService.sign_nft)
        3. Mint vào contract (SmartContractService.mint_nft)
        
        Args:
            contract: SmartContract instance
            metadata_data: Dict chứa thông tin metadata (student_id, degree_type, etc.)
            issuer_id: User ID của issuer
            recipient_address: Địa chỉ người nhận
            issuer_private_key: Private key để ký
        
        Returns:
            {"success": bool, "token_id": str, "error": str}
        """
        from app.services.NFTService import NFTService
        
        # Lấy issuer và recipient
        issuer = UserService.get_user_by_id(issuer_id)
        if not issuer:
            return SmartContractService._error("Issuer not found")
        
        recipient = UserService.get_user_by_address(recipient_address)
        if not recipient:
            return SmartContractService._error("Recipient not found")
        
        # Tạo metadata
        metadata = NFTService.create_metadata_from_dict(metadata_data)
        
        # Tạo NFT
        nft = NFT(
            issuer_pubkey=issuer.pubkey,
            metadata=metadata,
            recipient_address=recipient
        )
        
        # Ký NFT
        NFTService.sign_nft(nft, issuer_private_key)
        
        # Mint vào contract
        return SmartContractService.mint_nft(contract, nft, issuer.pubkey, save_to_db=True)
    
    # =========================================================================
    # QUERY - Truy vấn
    # =========================================================================
    
    @staticmethod
    def get_nft(contract: SmartContract, token_id: str, from_db: bool = False) -> Optional[NFT]:
        """
        Lấy NFT theo ID.
        
        Args:
            contract: SmartContract instance
            token_id: ID của NFT
            from_db: Lấy từ database hay từ contract registry
        """
        if from_db:
            return NFTRepository.get_nft_by_id(token_id)
        return contract.token_registry.get(token_id)
    
    @staticmethod
    def get_nfts_by_owner(contract: SmartContract, owner_address: str) -> List[NFT]:
        """Lấy tất cả NFT của một địa chỉ (chưa revoke)"""
        return [
            nft for nft in contract.token_registry.values()
            if nft.recipient_address.address == owner_address and
            not SmartContractService._check_is_revoked(contract, nft.token_id)
        ]
    
    @staticmethod
    def get_balance(contract: SmartContract, address: str) -> int:
        """Lấy số lượng NFT"""
        return contract.token_balances.get(address, 0)
    
    @staticmethod
    def get_all_nfts(contract: SmartContract, include_revoked: bool = False) -> List[NFT]:
        """Lấy tất cả NFT"""
        if include_revoked:
            return list(contract.token_registry.values())
        return [
            nft for nft in contract.token_registry.values()
            if not SmartContractService._check_is_revoked(contract, nft.token_id)
        ]
    
    # =========================================================================
    # AUTHORIZATION - Quản lý quyền
    # =========================================================================
    
    @staticmethod
    def add_minter(contract: SmartContract, minter_pubkey: str,
                   authorizer_pubkey: str) -> Dict[str, Any]:
        """Thêm quyền mint cho trường ĐH"""
        if not SmartContractService._check_is_owner(contract, authorizer_pubkey):
            return SmartContractService._error("Only owner can add minters")
        
        contract.authorized_minters.add(minter_pubkey)
        return SmartContractService._success({"minters": list(contract.authorized_minters)})
    
    @staticmethod
    def remove_minter(contract: SmartContract, minter_pubkey: str,
                      authorizer_pubkey: str) -> Dict[str, Any]:
        """Xóa quyền mint"""
        if not SmartContractService._check_is_owner(contract, authorizer_pubkey):
            return SmartContractService._error("Only owner can remove minters")
        
        if minter_pubkey == contract.owner_pubkey:
            return SmartContractService._error("Cannot remove owner")
        
        contract.authorized_minters.discard(minter_pubkey)
        return SmartContractService._success({"minters": list(contract.authorized_minters)})
    
    # =========================================================================
    # STATISTICS - Thống kê
    # =========================================================================
    
    @staticmethod
    def get_contract_stats(contract: SmartContract) -> Dict[str, Any]:
        """Thống kê tổng quan"""
        return {
            "contract_id": contract.contract_id,
            "owner": contract.owner_pubkey,
            "total_supply": contract.total_supply,
            "total_revoked": len(contract.revoked_tokens),
            "active_tokens": contract.total_supply - len(contract.revoked_tokens),
            "unique_holders": len([b for b in contract.token_balances.values() if b > 0]),
            "authorized_minters": len(contract.authorized_minters),
            "total_transfers": len(contract.transfer_history),
            "created_at": contract.created_at
        }
    
    @staticmethod
    def get_transfer_history(contract: SmartContract, token_id: str = None) -> List[Dict[str, Any]]:
        """Lịch sử chuyển nhượng"""
        if token_id:
            return [r for r in contract.transfer_history if r["token_id"] == token_id]
        return contract.transfer_history