from typing import Dict, Any, Optional
from datetime import datetime
from app.utils.Utils import CryptoUtils


class NFTmetadata:
    """Model NFT Metadata - Thông tin chứng chỉ"""

    def __init__(self, student_id: str, degree_type: str, pdf_url: str, 
                 pdf_hash: str, institution: str, issued_at: Optional[int] = None):
        self.student_id = student_id
        self.degree_type = degree_type
        self.pdf_url = pdf_url  
        self.pdf_hash = pdf_hash
        self.institution = institution
        self.issued_at = issued_at or datetime.utcnow().isoformat()
        
    def to_dict(self) -> Dict[str, Any]:
        """Chuyển metadata thành dict"""
        return {
            "student_id": self.student_id,
            "degree_type": self.degree_type,
            "pdf_url": self.pdf_url,
            "pdf_hash": self.pdf_hash,
            "institution": self.institution,
            "issued_at": self.issued_at
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "NFTmetadata":
        """Tạo NFTmetadata từ dict"""
        return NFTmetadata(**data)

    def hash_metadata(self) -> str:
        """Tính hash của metadata"""
        return CryptoUtils.hash_sha256(self.to_dict())
     