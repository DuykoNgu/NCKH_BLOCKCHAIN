
import time
import os

from flask import Blueprint, jsonify, request
import cloudinary
import cloudinary.utils


storage_bp = Blueprint('storage', __name__, url_prefix='/api/v1/storage')

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)
@storage_bp.route('/signature', methods=['GET'])
def get_signature():
    
        folder = request.args.get('folder', 'default-storage')
        # Lấy thêm tags từ query params nếu FE có gửi lên để ký luôn
        tags = request.args.get('tags', '') 
        
        timestamp = int(time.time())
        
        param_to_sign = {
            "folder": folder,
            "timestamp": timestamp,
        }
        
        # Nếu có tags thì phải đưa vào danh sách ký
        if tags:
            param_to_sign["tags"] = tags

        signature = cloudinary.utils.api_sign_request(param_to_sign, os.getenv('CLOUDINARY_API_SECRET'))

        return jsonify({
            "status": "success",
            "data": {
                "timestamp": timestamp,
                "signature": signature,
                "cloud_name": cloudinary.config().cloud_name,
                "api_key": cloudinary.config().api_key,
                "folder": folder,
                "tags": tags # Trả về tags để FE dùng đúng cái đã ký
            }
        })