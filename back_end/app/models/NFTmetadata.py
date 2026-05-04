from typing import Dict, Any, Optional
from datetime import datetime
import json
import time

class NFTmetadata:
     def __init__(self,
                  degree_type: str, pdf_url: str, pdf_hash: str, institution_address: str, issued_at: Optional[float] = None,institution: str = None, student_id: str = None):
          self.degree_type = degree_type
          self.student_id = student_id
          self.institution = institution
          self.pdf_url = pdf_url  
          self.pdf_hash = pdf_hash
          self.institution_address = institution_address
          self.issued_at = issued_at if issued_at is not None else time.time()
          
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
          data = {
               "degree_type": self.degree_type,
               "pdf_url": self.pdf_url,
               "pdf_hash": self.pdf_hash,
               "institution_address": self.institution_address,
               "issued_at": self.issued_at
          }
          return json.dumps(data, sort_keys= True,separators=(',', ':'))
     
     def hash_metadata(self) -> str:
          """Hash the metadata using SHA256"""
          from app.utils.HashUtils import HashUtils
          metadata_json = json.dumps(self.to_dict(), sort_keys=True, separators=(',', ':'))
          return HashUtils.hash_sha256(metadata_json)
     
     @staticmethod
     def from_dict(data: Dict[str,Any]):
          return NFTmetadata(**data)
     