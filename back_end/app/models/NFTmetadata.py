from typing import Dict, Any
from datetime import datetime

class NFTmetadata:
     def __init__(self,
                  degree_type: str, pdf_url: str, pdf_hash: str, institution_address: str, issued_at: int):
          self.degree_type = degree_type
          self.pdf_url = pdf_url  
          self.pdf_hash = pdf_hash
          self.institution_address = institution_address
          self.issued_at = issued_at or datetime.utcnow().isoformat()
          
     def to_dict(self) -> Dict[str, Any]:
          return {
               "degree_type": self.degree_type,
               "pdf_url": self.pdf_url,
               "pdf_hash": self.pdf_hash,
               "institution_address": self.institution_address,
               "issued_at": self.issued_at
          }
     @staticmethod
     def from_dict(data: Dict[str,Any]):
          return NFTmetadata(**data)
     