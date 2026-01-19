import sqlite3
from typing import List, Optional, Dict, Any
from app.database import get_connection, close_connection
from app.models.NFT import NFT
from app.models.NFTmetadata import NFTmetadata
from app.models.User import User, UserRole


class NFTRepository:
    """Repository để quản lý NFT trong database"""

    @staticmethod
    def create_nft(nft: NFT) -> bool:
        """Tạo NFT mới trong database"""
        try:
            conn = get_connection()
            cursor = conn.cursor()

            # Trước tiên lưu metadata
            metadata_dict = nft.metadata.to_dict()
            cursor.execute("""
                INSERT INTO nft_metadata 
                ( degree_type, pdf_url, pdf_hash, institution_address, issued_at)
                VALUES ( ?, ?, ?, ?, ?)
            """, (
                metadata_dict['degree_type'],
                metadata_dict['pdf_url'],
                metadata_dict['pdf_hash'],
                metadata_dict['institution_address'],
                metadata_dict['issued_at']
            ))
            
            metadata_id = cursor.lastrowid

            # Sau đó lưu NFT
            nft_dict = nft.to_dict()
            cursor.execute("""
                INSERT INTO nft 
                (nft_id, issuer_pubkey, metadata_id, recipient_address, 
                 issuer_signature, is_valid, minted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                nft.token_id,
                nft.issuer_pubkey,
                metadata_id,
                nft.recipient_address.address,
                nft.issuer_signature or '',
                1 if nft.is_valid else 0,
                nft.minted_at
            ))

            conn.commit()
            close_connection(conn)
            return True
        except Exception as e:
            print(f"Error creating NFT: {str(e)}")
            return False

    @staticmethod
    def get_nft_by_id(token_id: str) -> Optional[NFT]:
        """Lấy NFT theo token_id"""
        try:
            conn = get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT nft.nft_id, nft.issuer_pubkey, nft.issuer_signature, 
                       nft.is_valid, nft.minted_at, nft.recipient_address,
                       nft_metadata.degree_type, 
                       nft_metadata.pdf_url, nft_metadata.pdf_hash, 
                       nft_metadata.institution_address, nft_metadata.issued_at,
                       user.address, user.pubkey
                FROM nft
                LEFT JOIN nft_metadata ON nft.metadata_id = nft_metadata.metadata_id
                LEFT JOIN user ON nft.recipient_address = user.address
                WHERE nft.nft_id = ?
            """, (token_id,))

            row = cursor.fetchone()
            close_connection(conn)

            if row:
                # Reconstruct NFT from row
                metadata = NFTmetadata(
                    degree_type=row[6],
                    pdf_url=row[7],
                    pdf_hash=row[8],
                    institution_address=row[9],
                    issued_at=row[10]
                )
                
                recipient = User(
                    user_id="",
                    pubkey=row[13],
                    address=row[12],
                    role=UserRole.CLIENT,
                    password=""
                )
                
                nft = NFT(
                    issuer_pubkey=row[1],
                    metadata=metadata,
                    recipient_address=recipient
                )
                nft.token_id = row[0]
                nft.issuer_signature = row[2]
                nft.is_valid = bool(row[3])
                nft.minted_at = row[4]
                
                return nft
            return None
        except Exception as e:
            print(f"Error fetching NFT: {str(e)}")
            return None

    @staticmethod
    def get_nft_by_student(student_id: str) -> List[NFT]:
        """Lấy tất cả NFT của một student"""
        try:
            conn = get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT 
                    nft.nft_id,
                    nft.issuer_pubkey,
                    nft.metadata_id,
                    nft.recipient_address,
                    nft.issuer_signature,
                    nft.is_valid,
                    nft.minted_at,
                    nft_metadata.metadata_id,
                    nft_metadata.degree_type,
                    nft_metadata.pdf_url,
                    nft_metadata.pdf_hash,
                    nft_metadata.institution_address,
                    nft_metadata.issued_at,
                    user.address,
                    user.pubkey
                FROM nft
                LEFT JOIN nft_metadata ON nft.metadata_id = nft_metadata.metadata_id
                LEFT JOIN user ON nft.recipient_address = user.address
                WHERE nft_metadata.student_id = ?
            """, (student_id,))

            rows = cursor.fetchall()
            close_connection(conn)

            nfts = []
            for row in rows:
                if not row:
                    continue
                    
                token_id = row[0]
                issuer_pubkey = row[1]
                recipient_address = row[3]
                issuer_signature = row[4]
                is_valid = row[5] == 1
                minted_at = row[6]
                
                metadata = NFTmetadata(
                    degree_type=row[8],
                    pdf_url=row[9],
                    pdf_hash=row[10],
                    institution_address=row[11],
                    issued_at=row[12]
                )
                
                recipient = User(
                    user_id="",
                    pubkey=row[14] or "",
                    address=recipient_address,
                    role=UserRole.CLIENT,
                    password=""
                )
                
                nft = NFT(
                    issuer_pubkey=issuer_pubkey,
                    metadata=metadata,
                    recipient_address=recipient
                )
                
                nft.token_id = token_id
                nft.issuer_signature = issuer_signature
                nft.is_valid = is_valid
                nft.minted_at = minted_at
                
                nfts.append(nft)
            
            return nfts
        except Exception as e:
            print(f"Error fetching NFTs: {str(e)}")
            return []

    @staticmethod
    def get_nft_by_recipient(recipient_address: str) -> List[NFT]:
        """Lấy tất cả NFT của một recipient"""
        try:
            conn = get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT 
                    nft.nft_id,
                    nft.issuer_pubkey,
                    nft.metadata_id,
                    nft.recipient_address,
                    nft.issuer_signature,
                    nft.is_valid,
                    nft.minted_at,
                    nft_metadata.metadata_id,
                    nft_metadata.degree_type,
                    nft_metadata.pdf_url,
                    nft_metadata.pdf_hash,
                    nft_metadata.institution_address,
                    nft_metadata.issued_at,
                    user.address,
                    user.pubkey
                FROM nft
                LEFT JOIN nft_metadata ON nft.metadata_id = nft_metadata.metadata_id
                LEFT JOIN user ON nft.recipient_address = user.address
                WHERE nft.recipient_address = ?
            """, (recipient_address,))

            rows = cursor.fetchall()
            close_connection(conn)

            nfts = []
            for row in rows:
                if not row:
                    continue
                    
                token_id = row[0]
                issuer_pubkey = row[1]
                recipient_address = row[3]
                issuer_signature = row[4]
                is_valid = row[5] == 1
                minted_at = row[6]
                
                metadata = NFTmetadata(
                    degree_type=row[8],
                    pdf_url=row[9],
                    pdf_hash=row[10],
                    institution_address=row[11],
                    issued_at=row[12]
                )
                
                recipient = User(
                    user_id="",
                    pubkey=row[14] or "",
                    address=recipient_address,
                    role=UserRole.CLIENT,
                    password=""
                )
                
                nft = NFT(
                    issuer_pubkey=issuer_pubkey,
                    metadata=metadata,
                    recipient_address=recipient
                )
                
                nft.token_id = token_id
                nft.issuer_signature = issuer_signature
                nft.is_valid = is_valid
                nft.minted_at = minted_at
                
                nfts.append(nft)
            
            return nfts
        except Exception as e:
            print(f"Error fetching NFTs: {str(e)}")
            return []

    @staticmethod
    def get_all_nfts() -> List[NFT]:
        """Lấy tất cả NFT"""
        try:
            conn = get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT 
                    nft.nft_id,
                    nft.issuer_pubkey,
                    nft.metadata_id,
                    nft.recipient_address,
                    nft.issuer_signature,
                    nft.is_valid,
                    nft.minted_at,
                    nft_metadata.metadata_id,
                    nft_metadata.degree_type,
                    nft_metadata.pdf_url,
                    nft_metadata.pdf_hash,
                    nft_metadata.institution_address,
                    nft_metadata.issued_at,
                    user.address,
                    user.pubkey
                FROM nft
                LEFT JOIN nft_metadata ON nft.metadata_id = nft_metadata.metadata_id
                LEFT JOIN user ON nft.recipient_address = user.address
            """)

            rows = cursor.fetchall()
            close_connection(conn)

            nfts = []
            for row in rows:
                if not row:
                    continue
                    
                token_id = row[0]
                issuer_pubkey = row[1]
                recipient_address = row[3]
                issuer_signature = row[4]
                is_valid = row[5] == 1
                minted_at = row[6]
                
                metadata = NFTmetadata(
                    degree_type=row[8],
                    pdf_url=row[9],
                    pdf_hash=row[10],
                    institution_address=row[11],
                    issued_at=row[12]
                )
                
                recipient = User(
                    user_id="",
                    pubkey=row[14] or "",
                    address=recipient_address,
                    role=UserRole.CLIENT,
                    password=""
                )
                
                nft = NFT(
                    issuer_pubkey=issuer_pubkey,
                    metadata=metadata,
                    recipient_address=recipient
                )
                
                nft.token_id = token_id
                nft.issuer_signature = issuer_signature
                nft.is_valid = is_valid
                nft.minted_at = minted_at
                
                nfts.append(nft)
            
            return nfts
        except Exception as e:
            print(f"Error fetching NFTs: {str(e)}")
            return []

    @staticmethod
    def update_nft_signature(token_id: str, signature: str) -> bool:
        """Cập nhật signature của NFT"""
        try:
            conn = get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE nft
                SET issuer_signature = ?
                WHERE nft_id = ?
            """, (signature, token_id))

            conn.commit()
            close_connection(conn)
            return True
        except Exception as e:
            print(f"Error updating NFT signature: {str(e)}")
            return False

    @staticmethod
    def revoke_nft(token_id: str, revoke_reason: str) -> bool:
        """Thu hồi (revoke) NFT"""
        try:
            conn = get_connection()
            cursor = conn.cursor()

            # Cần add column revoked nếu chưa có
            cursor.execute("""
                UPDATE nft
                SET is_valid = 0
                WHERE nft_id = ?
            """, (token_id,))

            conn.commit()
            close_connection(conn)
            return True
        except Exception as e:
            print(f"Error revoking NFT: {str(e)}")
            return False

    @staticmethod
    def delete_nft(token_id: str) -> bool:
        """Xóa NFT"""
        try:
            conn = get_connection()
            cursor = conn.cursor()

            cursor.execute("DELETE FROM nft WHERE nft_id = ?", (token_id,))

            conn.commit()
            close_connection(conn)
            return True
        except Exception as e:
            print(f"Error deleting NFT: {str(e)}")
            return False

    @staticmethod
    def _parse_nft_row(row: tuple) -> NFT:
        """Helper để parse NFT từ database row"""
        # NFT columns: nft_id, issuer_pubkey, metadata_id, recipient_address, issuer_signature, is_valid, minted_at
        # Metadata columns: metadata_id, student_id, degree_type, pdf_url, pdf_hash, institution_address, issued_at
        # User columns: address, public_key
        
        token_id = row[0]
        issuer_pubkey = row[1]
        recipient_address_str = row[3]
        issuer_signature = row[4]
        is_valid = row[5] == 1
        minted_at = row[6]
        
        # Parse metadata
        metadata = NFTmetadata(
            degree_type=row[8],
            pdf_url=row[9],
            pdf_hash=row[10],
            institution_address=row[11],
            issued_at=row[12]
        )
        
        # Create recipient user (minimal)
        recipient = User(
            user_id=row[8],  # student_id
            pubkey=row[15] or "",  # public_key
            address=recipient_address_str,
            role=UserRole.CLIENT,
            password=""
        )
        
        # Create NFT
        nft = NFT(
            issuer_pubkey=issuer_pubkey,
            metadata=metadata,
            recipient_address=recipient
        )
        
        # Set additional attributes
        nft.token_id = token_id
        nft.issuer_signature = issuer_signature
        nft.is_valid = is_valid
        nft.minted_at = minted_at
        
        return nft
