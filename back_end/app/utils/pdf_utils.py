import os
import hashlib
from typing import Optional, Tuple
from pathlib import Path
from app.utils.HashUtils import HashUtils


class PDFUtils:
    
    ALLOWED_EXTENSIONS = {'.pdf'}
    MAX_FILE_SIZE = 10 * 1024 * 1024
    UPLOAD_FOLDER = 'uploads/certificates'
    
    @staticmethod
    def ensure_upload_folder() -> str:
        os.makedirs(PDFUtils.UPLOAD_FOLDER, exist_ok=True)
        return PDFUtils.UPLOAD_FOLDER
    
    @staticmethod
    def is_valid_pdf_file(filename: str) -> bool:
        if not filename:
            return False
        
        file_ext = Path(filename).suffix.lower()
        if file_ext not in PDFUtils.ALLOWED_EXTENSIONS:
            return False
        
        return True
    
    @staticmethod
    def get_file_size(file_path: str) -> int:
        try:
            return os.path.getsize(file_path)
        except OSError:
            return 0
    
    @staticmethod
    def is_valid_file_size(file_size: int) -> bool:
        return 0 < file_size <= PDFUtils.MAX_FILE_SIZE
    
    @staticmethod
    def calculate_pdf_hash(file_path: str) -> str:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File không tồn tại: {file_path}")
        
        try:
            with open(file_path, 'rb') as f:
                file_content = f.read()
            return HashUtils.hash_sha256(file_content)
        except IOError as e:
            raise IOError(f"Lỗi đọc file: {str(e)}")
    
    @staticmethod
    def save_pdf_file(file_content: bytes, filename: str) -> Tuple[bool, str, Optional[str]]:
        try:
            if not PDFUtils.is_valid_pdf_file(filename):
                return False, "", "File không phải PDF hợp lệ"
            
            file_size = len(file_content)
            if not PDFUtils.is_valid_file_size(file_size):
                return False, "", f"Kích thước file vượt quá giới hạn ({PDFUtils.MAX_FILE_SIZE / 1024 / 1024}MB)"
            
            PDFUtils.ensure_upload_folder()
            
            file_path = os.path.join(PDFUtils.UPLOAD_FOLDER, filename)
            
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            return True, file_path, None
        except Exception as e:
            return False, "", f"Lỗi lưu file: {str(e)}"
    
    @staticmethod
    def get_pdf_info(file_path: str) -> dict:
        try:
            file_size = PDFUtils.get_file_size(file_path)
            file_hash = PDFUtils.calculate_pdf_hash(file_path)
            
            return {
                "filename": os.path.basename(file_path),
                "file_path": file_path,
                "file_size": file_size,
                "file_hash": file_hash,
                "is_valid": PDFUtils.is_valid_file_size(file_size)
            }
        except Exception as e:
            return {
                "filename": os.path.basename(file_path),
                "error": str(e)
            }
    
    @staticmethod
    def delete_pdf_file(file_path: str) -> Tuple[bool, Optional[str]]:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True, None
            else:
                return False, "File không tồn tại"
        except Exception as e:
            return False, str(e)
