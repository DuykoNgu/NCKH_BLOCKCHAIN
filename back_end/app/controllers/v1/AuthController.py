"""
Authentication Controller - Validator Activation API
Handles passphrase authentication and validator activation
"""
from flask import Blueprint, request, jsonify
import os
import sys

# Add back_end to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from utils.KeystoreManager import KeystoreManager, create_keystore
from consensus.validator_worker import get_validator_worker


auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')


@auth_bp.route('/activate', methods=['POST'])
def activate_validator():
    """
    Activate validator with passphrase
    
    Request Body:
        {
            "passphrase": "string"
        }
    
    Response:
        {
            "success": true/false,
            "message": "string",
            "validator_info": {
                "is_active": bool,
                "public_key": "string"
            }
        }
    """
    try:
        # Get passphrase from request
        data = request.get_json()
        
        if not data or 'passphrase' not in data:
            return jsonify({
                'success': False,
                'message': 'Passphrase is required'
            }), 400
        
        passphrase = data['passphrase']
        
        # Validate passphrase format
        is_valid, error_msg = KeystoreManager.validate_passphrase(passphrase)
        if not is_valid:
            # Don't reveal validation details for security
            return jsonify({
                'success': False,
                'message': 'Invalid passphrase'
            }), 401
        
        # Load keystore file
        keystore_path = 'node.keystore'
        keystore_data = KeystoreManager.load_keystore(keystore_path)
        
        if keystore_data is None:
            return jsonify({
                'success': False,
                'message': 'Keystore not found. Please run setup_identity.py first.'
            }), 404
        
        # Attempt to decrypt private key
        private_key_hex = KeystoreManager.decrypt_private_key(keystore_data, passphrase)
        
        # Clear passphrase from memory immediately
        KeystoreManager.secure_delete(passphrase)
        
        if private_key_hex is None:
            return jsonify({
                'success': False,
                'message': 'Authentication failed'
            }), 401
        
        # Get validator worker instance
        validator_worker = get_validator_worker()
        
        if validator_worker is None:
            # Clean up private key
            KeystoreManager.secure_delete(private_key_hex)
            
            return jsonify({
                'success': False,
                'message': 'Validator worker not initialized. Please start the application properly.'
            }), 500
        
        # Activate validator with decrypted private key
        success = validator_worker.activate(private_key_hex)
        
        # Private key is now stored in validator worker, clear local reference
        KeystoreManager.secure_delete(private_key_hex)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Validator activated successfully',
                'validator_info': {
                    'is_active': validator_worker.is_active,
                    'public_key': keystore_data.get('public_key', '')[:32] + '...'
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to activate validator'
            }), 500
    
    except Exception as e:
        print(f"✗ Activation error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@auth_bp.route('/activate-with-key', methods=['POST'])
def activate_validator_with_key():
    """
    Activate validator with pre-decrypted private key (used by active_node.py)
    This is called from active_node.py which has already decrypted the private key
    
    Request Body:
        {
            "private_key_hex": "string"
        }
    
    Response:
        {
            "success": true/false,
            "message": "string",
            "validator_info": {
                "is_active": bool,
                "validator_index": int,
                "total_validators": int
            }
        }
    """
    try:
        # Get private key from request
        data = request.get_json()
        
        if not data or 'private_key_hex' not in data:
            return jsonify({
                'success': False,
                'message': 'Private key is required'
            }), 400
        
        private_key_hex = data['private_key_hex']
        
        # Get validator worker instance
        validator_worker = get_validator_worker()
        
        if validator_worker is None:
            return jsonify({
                'success': False,
                'message': 'Validator worker not initialized'
            }), 500
        
        # Check if already active
        if validator_worker.is_active:
            return jsonify({
                'success': True,
                'message': 'Validator is already active',
                'validator_info': {
                    'is_active': True,
                    'validator_index': validator_worker.my_index,
                    'total_validators': validator_worker.total_validators
                }
            }), 200
        
        # Activate validator with decrypted private key
        success = validator_worker.activate(private_key_hex)
        
        # Secure delete private key from request data
        KeystoreManager.secure_delete(private_key_hex)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Validator activated successfully',
                'validator_info': {
                    'is_active': validator_worker.is_active,
                    'validator_index': validator_worker.my_index,
                    'total_validators': validator_worker.total_validators
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to activate validator'
            }), 500
    
    except Exception as e:
        print(f"✗ Activation with key error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@auth_bp.route('/create_key_store', methods=['POST'])
def create_key_store():
    try:
        # Get passphrase from request
        data = request.get_json()
        
        if not data or 'passphrase' not in data:
            return jsonify({
                'success': False,
                'message': 'Passphrase is required'
            }), 400
        
        passphrase = data['passphrase']
        
        # Validate passphrase format
        is_valid, error_msg = KeystoreManager.validate_passphrase(passphrase)
        if not is_valid:
            # Don't reveal validation details for security
            return jsonify({
                'success': False,
                'message': 'Invalid passphrase'
            }), 401
        
        # Create keystore file
        success = create_keystore(passphrase)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Keystore created successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to create keystore'
            }), 500
    
    except Exception as e:
        print(f"✗ Create keystore error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@auth_bp.route('/deactivate', methods=['POST'])
def deactivate_validator():
    """
    Deactivate validator (stop mining and clear private key from memory)
    
    Response:
        {
            "success": true/false,
            "message": "string"
        }
    """
    try:
        # Get validator worker instance
        validator_worker = get_validator_worker()
        
        if validator_worker is None:
            return jsonify({
                'success': False,
                'message': 'Validator worker not found'
            }), 404
        
        # Deactivate validator
        validator_worker.deactivate()
        
        return jsonify({
            'success': True,
            'message': 'Validator deactivated successfully'
        }), 200
    
    except Exception as e:
        print(f"✗ Deactivation error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500


@auth_bp.route('/status', methods=['GET'])
def get_validator_status():
    """
    Get validator activation status
    
    Response:
        {
            "is_active": bool,
            "validator_index": int,
            "total_validators": int,
            "blocks_mined": int
        }
    """
    try:
        # Get validator worker instance
        validator_worker = get_validator_worker()
        
        if validator_worker is None:
            return jsonify({
                'is_active': False,
                'message': 'Validator worker not initialized'
            }), 200
        
        # Get validator stats
        stats = validator_worker.get_stats()
        
        return jsonify({
            'is_active': stats['is_active'],
            'validator_index': stats['validator_index'],
            'total_validators': stats['total_validators'],
            'blocks_mined': stats['blocks_mined'],
            'mempool_size': stats['mempool_size'],
            'blockchain_height': stats['blockchain_height']
        }), 200
    
    except Exception as e:
        print(f"✗ Status error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500
