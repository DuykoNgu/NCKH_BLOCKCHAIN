import sqlite3
from typing import List, Optional, Dict, Any
from app.database.connection import get_connection, close_connection
from app.models.NFT import NFT
from app.models.NFTmetadata import NFTmetadata
from app.models.Account import Account, Role
BASE_NFT_SELECT = """
    SELECT 
        nft.nft_id,           -- 0
        nft.issuer_address,    -- 1
        nft.issuer_signature,  -- 2
        nft.is_valid,         -- 3
        nft.minted_at,        -- 4
        nft.issuer_pubkey,    -- 5
        m.degree_type,        -- 6
        m.pdf_url,           -- 7
        m.pdf_hash,          -- 8
        m.institution_address, -- 9
        m.issued_at,         -- 10
        a.address,           -- 11
        a.public_key,        -- 12
        a.org_name,          -- 13
        a.is_active          -- 14
    FROM nft
    LEFT JOIN nft_metadata m ON nft.metadata_id = m.metadata_id
    LEFT JOIN account a ON nft.owner_address = a.address
"""

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
            cursor.execute("""
                INSERT INTO nft 
                (nft_id, issuer_pubkey, issuer_address, metadata_id, owner_address, 
                 issuer_signature, is_valid, minted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                nft.token_id,
                nft.issuer_pubkey,
                nft.issuer_address,
                metadata_id,
                nft.owner_address.address,
                nft.issuer_signature or '',
                1 if nft.is_valid else 0,
                nft.minted_at,
            ))

            conn.commit()
            close_connection(conn)
            return True
        except Exception as e:
            print(f"Error creating NFT: {str(e)}")
            return False

    @staticmethod
    def get_nft_by_id(token_id: str) -> Optional[NFT]:
        """Lấy NFT theo token_id sử dụng helper để parse dữ liệu"""
        try:
            conn = get_connection()
            cursor = conn.cursor()

            # Kết hợp chuỗi SELECT gốc với điều kiện WHERE
            query = f"{BASE_NFT_SELECT} WHERE nft.nft_id = ?"
            
            cursor.execute(query, (token_id,))
            row = cursor.fetchone()
            
            close_connection(conn)

            # Sử dụng hàm static helper để xử lý logic dựng đối tượng
            # Nếu tìm thấy row, trả về kết quả từ hàm parse, ngược lại trả về None
            return NFTRepository._parse_nft_row(row) if row else None

        except Exception as e:
            # Bạn nên log lỗi cụ thể để dễ debug
            print(f"Error fetching NFT with ID {token_id}: {str(e)}")
            return None

    @staticmethod
    def get_nft_by_address(owner_address: str) -> List[NFT]:
        """Lấy tất cả NFT của một recipient"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            query = BASE_NFT_SELECT + " WHERE nft.owner_address = ?"
            cursor.execute(query, (owner_address,))
            rows = cursor.fetchall()
            close_connection(conn)
            
            return [NFTRepository._parse_nft_row(row) for row in rows if row]
        except Exception as e:
            print(f"Error fetching recipient NFTs: {e}")
            return []

    @staticmethod
    def get_all_nfts() -> List[NFT]:
        """Lấy tất cả NFT trong hệ thống"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(BASE_NFT_SELECT)
            rows = cursor.fetchall()
            close_connection(conn)
            
            return [NFTRepository._parse_nft_row(row) for row in rows if row]
        except Exception as e:
            print(f"Error fetching all NFTs: {e}")
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
    def _parse_nft_row(row: tuple) -> Optional[NFT]:
        if not row: return None
        
        # Metadata (6-10)
        metadata = NFTmetadata(
            degree_type=row[6],
            pdf_url=row[7],
            pdf_hash=row[8],
            institution_address=row[9],
            issued_at=row[10]
        )
        
        # Owner Account (11-14)
        owner = Account(
            address=row[11],
            public_key=row[12],
            role=Role.CLIENT, 
            org_name=row[13],
            is_active=bool(row[14])
        )
        
        nft = NFT(
            issuer_address=row[1], 
            issuer_pubkey=row[5],
            metadata=metadata,
            owner_address=owner
        )
        nft.token_id = row[0]
        nft.issuer_signature = row[2]
        nft.is_valid = bool(row[3])
        nft.minted_at = row[4] 
        
        return nft