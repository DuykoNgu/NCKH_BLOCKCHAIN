"""
ChainIndexer - Web3 + Backend API pattern

Đây là layer quan trọng nhất trong kiến trúc:

    Chain (source of truth)
         ↓  tx confirmed
    ChainIndexer  ← lắng nghe block mới
         ↓  index vào DB
    Backend DB (cache/index cho query nhanh)
         ↓
    API response

Nguyên tắc:
- KHÔNG ghi DB trực tiếp từ API request
- CHỈ ghi DB sau khi tx được confirm on-chain
- Mỗi TxType có handler riêng
"""
from app.models.Transaction import Transaction, TxType
from app.models.Block import Block
from app.services.AccountService import AccountService
from app.services.NFTService import NFTService
from app.repositories.TransactionRepository import TransactionRepository
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ChainIndexer:
    """
    Lắng nghe block mới từ chain → index vào DB.
    Được gọi bởi BlockChainService.add_block() sau khi block confirm.
    """

    # Map TxType → handler
    HANDLERS = {
        TxType.REGISTER_IDENTITY: "_handle_register_identity",
        TxType.UPDATE_PROFILE: "_handle_update_profile",
        TxType.ASSIGN_ROLE: "_handle_assign_role",
        TxType.REVOKE_ROLE: "_handle_revoke_role",
        TxType.MINT_NFT: "_handle_mint_nft",
        TxType.REVOKE_NFT: "_handle_revoke_nft",
    }

    @staticmethod
    def index_block(block: Block) -> dict:
        """
        Index tất cả transactions trong block vừa confirm.
        Trả về summary để log.
        """
        results = {"block_id": block.block_id, "total": 0, "success": 0, "failed": 0}

        for tx in block.transactions:
            results["total"] += 1
            tx.block_id = block.block_id

            # Lưu tx vào DB index
            TransactionRepository.create(tx)
            TransactionRepository.update_block_id(tx.tx_hash, block.block_id)

            # Dispatch đến handler phù hợp
            handler_name = ChainIndexer.HANDLERS.get(tx.tx_type)
            if not handler_name:
                logger.warning(f"[ChainIndexer] No handler for tx_type: {tx.tx_type}")
                results["success"] += 1  # lưu tx là đủ
                continue

            try:
                handler = getattr(ChainIndexer, handler_name)
                success = handler(tx)
                if success:
                    results["success"] += 1
                else:
                    results["failed"] += 1
                    logger.error(f"[ChainIndexer] Handler failed: {handler_name} tx={tx.tx_hash}")
            except Exception as e:
                results["failed"] += 1
                logger.error(f"[ChainIndexer] Handler error {handler_name}: {e}")

        logger.info(f"[ChainIndexer] Indexed block {block.block_id}: {results}")
        return results

    # ─────────────────────────────────────────────
    # HANDLERS
    # ─────────────────────────────────────────────

    @staticmethod
    def _handle_register_identity(tx: Transaction) -> bool:
        """REGISTER_IDENTITY → tạo account trong DB index."""
        return AccountService.on_register_identity_confirmed(tx)

    @staticmethod
    def _handle_update_profile(tx: Transaction) -> bool:
        """UPDATE_PROFILE → cache profile + lưu tx_hash để verify."""
        return AccountService.on_update_profile_confirmed(tx)

    @staticmethod
    def _handle_assign_role(tx: Transaction) -> bool:
        """ASSIGN_ROLE → cập nhật role trong DB index."""
        return AccountService.on_assign_role_confirmed(tx)

    @staticmethod
    def _handle_revoke_role(tx: Transaction) -> bool:
        """REVOKE_ROLE → deactivate account."""
        target = tx.recipient_address
        success, _ = AccountService.revoke_access(target)
        return success

    @staticmethod
    def _handle_mint_nft(tx: Transaction) -> bool:
        """MINT_NFT → tạo NFT record trong DB index."""
        return NFTService.on_mint_nft_confirmed(tx)

    @staticmethod
    def _handle_revoke_nft(tx: Transaction) -> bool:
        """REVOKE_NFT → đánh dấu NFT is_valid=False."""
        token_id = tx.payload.get("token_id")
        if not token_id:
            logger.error(f"[ChainIndexer] REVOKE_NFT missing token_id: {tx.tx_hash}")
            return False
        return NFTService.revoke_nft(token_id)
