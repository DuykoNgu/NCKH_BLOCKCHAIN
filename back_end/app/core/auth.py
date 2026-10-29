from functools import wraps

import jwt
from flask import request, jsonify

from app.core.config import SECRET_KEY, JWT_ALGORITHM


def require_role(*roles):
    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            header = request.headers.get('Authorization', '')
            if not header.startswith('Bearer '):
                return jsonify({'success': False, 'error': 'Missing bearer token'}), 401
            try:
                claims = jwt.decode(header[7:], SECRET_KEY, algorithms=[JWT_ALGORITHM])
            except jwt.PyJWTError:
                return jsonify({'success': False, 'error': 'Invalid or expired token'}), 401
            if claims.get('role') not in roles:
                return jsonify({'success': False, 'error': 'Forbidden'}), 403
            return view(*args, **kwargs)
        return wrapper
    return decorator
