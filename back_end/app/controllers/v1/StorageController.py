
from datetime import time
import os

from flask import Blueprint, jsonify
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
    try:
        timestamp = int(time.time())
        
        param_to_sign = {
            "timestamp": timestamp,
            "folder": "moet_storage"
        }

        signature = cloudinary.utils.api_sign_request(param_to_sign, os.getenv('CLOUDINARY_API_SECRET'))

        return jsonify({
            "status": "success",
            "data": {
                "timestamp": timestamp,
                "signature": signature,
                "cloud_name": cloudinary.config().cloud_name,
                "api_key": cloudinary.config().api_key
            }
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500