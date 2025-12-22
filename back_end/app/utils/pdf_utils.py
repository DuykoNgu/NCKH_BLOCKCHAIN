"""
PDF Utility Module - Xử lý tệp PDF chứng chỉ
"""
import os
import hashlib
from typing import Optional, Tuple
from pathlib import Path
from app.utils.HashUtils import HashUtils


class PDFUtils:
    """Utility class for PDF handling"""
    
    # Cấu hình tải file
    ALLOWED_EXTENSIONS = {'.pdf'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    UPLOAD_FOLDER = 'uploads/certificates'
    
    @staticmethod
    def ensure_upload_folder() -> str:
        """Tạo folder upload nếu chưa tồn tại"""
        os.makedirs(PDFUtils.UPLOAD_FOLDER, exist_ok=True)
        return PDFUtils.UPLOAD_FOLDER
    
    @staticmethod
    def is_valid_pdf_file(filename: str) -> bool:
        """
        Kiểm tra xem file có phải PDF hợp lệ không
        
        Args:
            filename: Tên file
        
        Returns:
            bool: True nếu hợp lệ, False nếu không
        """
        if not filename:
            return False
        
        # Kiểm tra extension
        file_ext = Path(filename).suffix.lower()
        if file_ext not in PDFUtils.ALLOWED_EXTENSIONS:
            return False
        
        return True
    
    @staticmethod
    def get_file_size(file_path: str) -> int:
        """
        Lấy kích thước file
        
        Args:
            file_path: Đường dẫn tệp
        
        Returns:
            int: Kích thước file (bytes)
        """
        try:
            return os.path.getsize(file_path)
        except OSError:
            return 0
    
    @staticmethod
    def is_valid_file_size(file_size: int) -> bool:
        """
        Kiểm tra kích thước file có trong giới hạn không
        
        Args:
            file_size: Kích thước file (bytes)
        
        Returns:
            bool: True nếu trong giới hạn
        """
        return 0 < file_size <= PDFUtils.MAX_FILE_SIZE
    
    @staticmethod
    def calculate_pdf_hash(file_path: str) -> str:
        """
        Tính SHA256 hash của file PDF
        
        Args:
            file_path: Đường dẫn tệp PDF
        
        Returns:
            str: SHA256 hash ở dạng hex
        
        Raises:
            FileNotFoundError: Nếu file không tồn tại
            IOError: Nếu lỗi đọc file
        """
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
        """
        Lưu file PDF vào storage
        
        Args:
            file_content: Nội dung file (bytes)
            filename: Tên file
        
        Returns:
            Tuple[bool, str, Optional[str]]: (success, file_path, error_message)
        """
        try:
            # Validate
            if not PDFUtils.is_valid_pdf_file(filename):
                return False, "", "File không phải PDF hợp lệ"
            
            file_size = len(file_content)
            if not PDFUtils.is_valid_file_size(file_size):
                return False, "", f"Kích thước file vượt quá giới hạn ({PDFUtils.MAX_FILE_SIZE / 1024 / 1024}MB)"
            
            # Tạo folder
            PDFUtils.ensure_upload_folder()
            
            # Tạo đường dẫn file
            file_path = os.path.join(PDFUtils.UPLOAD_FOLDER, filename)
            
            # Lưu file
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            return True, file_path, None
        except Exception as e:
            return False, "", f"Lỗi lưu file: {str(e)}"
    
    @staticmethod
    def get_pdf_info(file_path: str) -> dict:
        """
        Lấy thông tin chi tiết về file PDF
        
        Args:
            file_path: Đường dẫn tệp PDF
        
        Returns:
            dict: Thông tin file (name, size, hash, path)
        """
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
        """
        Xóa file PDF
        
        Args:
            file_path: Đường dẫn tệp PDF
        
        Returns:
            Tuple[bool, Optional[str]]: (success, error_message)
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True, None
            else:
                return False, "File không tồn tại"
        except Exception as e:
            return False, str(e)
