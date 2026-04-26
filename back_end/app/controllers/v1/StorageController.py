
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
    tags = request.args.get('tags')
    # Thêm resource_type vào để ký nếu bạn biết chắc chắn loại file
    # Hoặc để 'auto' nếu muốn Cloudinary tự nhận diện
    
    timestamp = int(time.time())
    
    param_to_sign = {
        "folder": folder,
        "timestamp": timestamp,
    }
    
    if tags and tags.strip():
        # Cloudinary yêu cầu tags phải khớp chính xác từng dấu phẩy
        param_to_sign["tags"] = tags.strip()

    # Lấy secret key từ env
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
    # Tạo signature
    # Hàm api_sign_request sẽ tự động sắp xếp key theo alphabet
    signature = cloudinary.utils.api_sign_request(param_to_sign, api_secret)
    
    return jsonify({
        "status": "success",
        "data": {
            "timestamp": timestamp,
            "signature": signature,
            "cloud_name": cloudinary.config().cloud_name,
            "api_key": cloudinary.config().api_key,
            "folder": folder,
            "tags": tags.strip() if tags else None
        }
    })