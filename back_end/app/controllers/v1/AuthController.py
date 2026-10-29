from flask import Blueprint, request, jsonify
import os
from app.services.NetworkService import get_network_service
import sys
import hashlib
import json
from app.utils.CryptoUtils import CryptoUtils
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.utils.KeystoreManager import KeystoreManager, create_keystore
from consensus.validator_worker import get_validator_worker
from app.utils.logger import get_logger
from app.core.config import NODE_IP, NODE_PORT, KEYSTORE_PATH
from app.repositories.PeerRepository import PeerRepository

logger = get_logger(__name__)


def generate_peer_id(ip: str, port: int) -> str:
    data = f"{ip}:{port}".encode()
    return hashlib.sha256(data).hexdigest()[:16]


def try_update_peer_after_activation(validator_worker, public_key: str, private_key_hex: str) -> None:
    try:
        logger.info(f"→ [DEBUG] try_update_peer_after_activation called with public_key={public_key[:20] if public_key else 'EMPTY'}...")
        
        if not public_key or public_key.strip() == "":
            logger.error("✗ [DEBUG] public_key is empty! Cannot update peer record")
            return
        
        node_ip, node_port = NODE_IP, NODE_PORT
        
        peer_id = generate_peer_id(node_ip, node_port)
        logger.info(f"→ Updating peer record: {node_ip}:{node_port} (peer_id={peer_id[:16]}...)")
        logger.info(f"→ [DEBUG] Calling PeerRepository.update_peer_public_key_and_activate()")
        
        success = PeerRepository.update_peer_public_key_and_activate(peer_id, node_ip, node_port, public_key)
        logger.info(f"→ [DEBUG] PeerRepository returned: success={success}")
        
        if success:
            logger.info(f"✓ Peer {peer_id[:16]}... activated with public_key in database")
            
            try:
                logger.info(f"→ [DEBUG] Creating activation transaction...")
                create_and_broadcast_activation_transaction(node_ip, node_port, public_key, private_key_hex)
                logger.info(f"✓ [DEBUG] Activation transaction completed")
            except Exception as tx_err:
                logger.warning(f"⚠ Could not create activation transaction: {tx_err}")
                import traceback
                logger.error(f"✗ [DEBUG] Exception traceback: {traceback.format_exc()}")
        else:
            logger.error(f"✗ Failed to update peer record in database")
    
    except Exception as e:
        logger.error(f"✗ Could not update peer record: {e}")
        import traceback
        logger.error(f"✗ [DEBUG] Exception traceback: {traceback.format_exc()}")


def create_and_broadcast_activation_transaction(ip_address: str, port: int, public_key: str, private_key_hex: str) -> None:
    import datetime
    from app.core.node_bootstrap import submit_system_tx

    try:
        submit_system_tx({
            "op": "validator_activate",
            "ip_address": ip_address,
            "port": port,
            "public_key": public_key,
            "timestamp": datetime.datetime.now().timestamp()
        }, public_key, private_key_hex)
    except Exception as e:
        logger.error(f"✗ Error creating activation transaction: {e}")


auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')


@auth_bp.route('/activate', methods=['POST'])
def activate_validator():
    logger.info("📨 [POST /api/v1/auth/activate] Validator activation request with passphrase")
    try:
        data = request.get_json()
        
        if not data or 'passphrase' not in data:
            logger.error("✗ Passphrase is required")
            return jsonify({
                'success': False,
                'message': 'Passphrase is required'
            }), 400
        
        passphrase = data['passphrase']
        logger.info("→ Validating passphrase format...")
        
        is_valid, error_msg = KeystoreManager.validate_passphrase(passphrase)
        if not is_valid:
            logger.error(f"✗ Invalid passphrase: {error_msg}")
            return jsonify({
                'success': False,
                'message': 'Invalid passphrase'
            }), 401
        
        logger.info("→ Loading keystore file...")
        keystore_path = KEYSTORE_PATH
        keystore_data = KeystoreManager.load_keystore(keystore_path)
        
        if keystore_data is None:
            logger.error("✗ Keystore not found")
            return jsonify({
                'success': False,
                'message': 'Keystore not found. Restart the node with `python run.py` to create one.'
            }), 404
        
        logger.info("→ Decrypting private key...")
        private_key_hex = KeystoreManager.decrypt_private_key(keystore_data, passphrase)
        
        KeystoreManager.secure_delete(passphrase)
        
        if private_key_hex is None:
            logger.error("✗ Authentication failed - invalid passphrase")
            return jsonify({
                'success': False,
                'message': 'Authentication failed'
            }), 401
        
        validator_worker = get_validator_worker()
        
        if validator_worker is None:
            KeystoreManager.secure_delete(private_key_hex)
            logger.error("✗ Validator worker not initialized")
            
            return jsonify({
                'success': False,
                'message': 'Validator worker not initialized. Please start the application properly.'
            }), 500
        
        logger.info("→ Activating validator...")
        success = validator_worker.activate(private_key_hex)
        
        KeystoreManager.secure_delete(private_key_hex)
        
        if success:
            logger.info(f"✓ Validator activated successfully (is_active={validator_worker.is_active})")
            
            public_key = keystore_data.get('public_key', '')
            try_update_peer_after_activation(validator_worker, public_key,private_key_hex)
            
            return jsonify({
                'success': True,
                'message': 'Validator activated successfully',
                'validator_info': {
                    'is_active': validator_worker.is_active,
                    'public_key': public_key[:32] + '...'
                }
            }), 200
        else:
            logger.error("✗ Failed to activate validator - worker.activate() returned False")
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
    logger.info("📨 [POST /api/v1/auth/activate-with-key] Validator activation with private key")
    try:
        data = request.get_json()
        
        if not data or 'private_key_hex' not in data:
            logger.error("✗ Private key is required")
            return jsonify({
                'success': False,
                'message': 'Private key is required'
            }), 400
        
        private_key_hex = data['private_key_hex']
        logger.info("→ Received private key, activating validator...")
        
        validator_worker = get_validator_worker()
        
        if validator_worker is None:
            logger.error("✗ Validator worker not initialized")
            return jsonify({
                'success': False,
                'message': 'Validator worker not initialized'
            }), 500
        
        if validator_worker.is_active:
            logger.warning("⚠ Validator is already active")
            
            public_key = validator_worker.public_key or ""
            try_update_peer_after_activation(validator_worker, public_key,private_key_hex)
            
            return jsonify({
                'success': True,
                'message': 'Validator is already active',
                'validator_info': {
                    'is_active': True,
                    'validator_index': validator_worker.my_index,
                    'total_validators': validator_worker.total_validators
                }
            }), 200
        
        logger.info("→ Calling validator_worker.activate()...")
        success = validator_worker.activate(private_key_hex)
        
        KeystoreManager.secure_delete(private_key_hex)
        
        if success:
            logger.info(f"✓ Validator activated successfully (index={validator_worker.my_index}/{validator_worker.total_validators})")
            
            public_key = validator_worker.public_key or ""
            try_update_peer_after_activation(validator_worker, public_key, private_key_hex)
            
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
            logger.error("✗ Failed to activate validator - worker.activate() returned False")
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
        data = request.get_json()
        
        if not data or 'passphrase' not in data:
            return jsonify({
                'success': False,
                'message': 'Passphrase is required'
            }), 400
        
        passphrase = data['passphrase']
        
        is_valid, error_msg = KeystoreManager.validate_passphrase(passphrase)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': 'Invalid passphrase'
            }), 401
        
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
    try:
        validator_worker = get_validator_worker()
        
        if validator_worker is None:
            return jsonify({
                'success': False,
                'message': 'Validator worker not found'
            }), 404
        
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
    try:
        validator_worker = get_validator_worker()
        
        if validator_worker is None:
            return jsonify({
                'is_active': False,
                'message': 'Validator worker not initialized'
            }), 200
        
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
