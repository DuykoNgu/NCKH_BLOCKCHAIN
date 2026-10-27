
import time
import os

from flask import Blueprint, jsonify, request
import cloudinary
import cloudinary.utils
from app.core.config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET


storage_bp = Blueprint('storage', __name__, url_prefix='/api/v1/storage')

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)
@storage_bp.route('/signature', methods=['GET'])
def get_signature():
    folder = request.args.get('folder', 'default-storage')
    tags = request.args.get('tags')
    
    timestamp = int(time.time())
    
    param_to_sign = {
        "folder": folder,
        "timestamp": timestamp,
    }
    
    if tags and tags.strip():
        param_to_sign["tags"] = tags.strip()

    api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
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