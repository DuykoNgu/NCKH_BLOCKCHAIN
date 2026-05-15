from typing import Dict, Any, Optional
from datetime import datetime
import json
import time
import hashlib

class NFTmetadata:
     def __init__(self,
                  degree_type: str, pdf_url: str, pdf_hash: str, institution_address: str, 
                  issued_at: Optional[float] = None, institution: Optional[str] = None, 
                  student_id: Optional[str] = None):
          self.degree_type = degree_type
          self.student_id = student_id
          self.institution = institution
          self.pdf_url = pdf_url  
          self.pdf_hash = pdf_hash
          self.institution_address = institution_address
          self.issued_at = int(issued_at) if issued_at is not None else int(time.time())
          
     def to_dict(self) -> Dict[str, Any]:
          return {
               "degree_type": self.degree_type,
               "student_id": self.student_id,
               "institution": self.institution,
               "pdf_url": self.pdf_url,
               "pdf_hash": self.pdf_hash,
               "institution_address": self.institution_address,
               "issued_at": self.issued_at
          }
     
     def get_signing_data(self) -> str:
          # Keep signing data consistent with what was used to generate signatures
          data = {
               "degree_type": self.degree_type,
               "pdf_url": self.pdf_url,
               "pdf_hash": self.pdf_hash,
               "institution_address": self.institution_address,
               "issued_at": self.issued_at
          }
          return json.dumps(data, sort_keys=True, separators=(',', ':'))
     
     @staticmethod
     def from_dict(data: Dict[str,Any]):
          return NFTmetadata(**data)
          
     def hash_metadata(self) -> str:
          """Hash the metadata using SHA256"""
          # Use local hashlib to avoid potential missing util imports during merge
          metadata_json = self.get_signing_data()
          return hashlib.sha256(metadata_json.encode('utf-8')).hexdigest()
