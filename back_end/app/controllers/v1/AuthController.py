"""
Authentication Controller - Validator Activation API
Handles passphrase authentication and validator activation
"""
from flask import Blueprint, request, jsonify
import os
from app.services.NetworkService import get_network_service
import sys
import hashlib
import json

# Add back_end to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from utils.KeystoreManager import KeystoreManager, create_keystore
from consensus.validator_worker import get_validator_worker
from utils.logger import get_logger
from app.repositories.PeerRepository import PeerRepository

logger = get_logger(__name__)


def generate_peer_id(ip: str, port: int) -> str:
    """Generate peer ID from IP and port (same as PeerManager)"""
    data = f"{ip}:{port}".encode()
    return hashlib.sha256(data).hexdigest()[:16]


def try_update_peer_after_activation(validator_worker, public_key: str) -> None:
    """Try to update peer record in database after validator activation"""
    try:
        logger.info(f"→ [DEBUG] try_update_peer_after_activation called with public_key={public_key[:20] if public_key else 'EMPTY'}...")
        
        # Verify public_key is not empty
        if not public_key or public_key.strip() == "":
            logger.error("✗ [DEBUG] public_key is empty! Cannot update peer record")
            return
        
        # Try to load node config to get IP and port
        config_path = ".node_config.json"
        if os.path.exists(config_path):
            logger.info(f"→ [DEBUG] Loading config from {config_path}")
            with open(config_path, 'r') as f:
                config = json.load(f)
            node_ip = config.get('ip_address', '127.0.0.1')
            node_port = config.get('port', 5000)
            logger.info(f"→ [DEBUG] Config: ip={node_ip}, port={node_port}")
        else:
            # Fallback to environment variables
            logger.info(f"→ [DEBUG] Config file not found, using env vars")
            node_ip = os.getenv('NODE_IP', '127.0.0.1')
            node_port = int(os.getenv('NODE_PORT', '5000'))
            logger.info(f"→ [DEBUG] ENV: ip={node_ip}, port={node_port}")
        
        # Generate peer_id
        peer_id = generate_peer_id(node_ip, node_port)
        logger.info(f"→ Updating peer record: {node_ip}:{node_port} (peer_id={peer_id[:16]}...)")
        logger.info(f"→ [DEBUG] Calling PeerRepository.update_peer_public_key_and_activate()")
        
        # Update peer with public_key and status=ACTIVE (now creates if doesn't exist)
        success = PeerRepository.update_peer_public_key_and_activate(peer_id, node_ip, node_port, public_key)
        logger.info(f"→ [DEBUG] PeerRepository returned: success={success}")
        
        if success:
            logger.info(f"✓ Peer {peer_id[:16]}... activated with public_key in database")
            
            # Also create an activation transaction for other nodes to sync
            try:
                logger.info(f"→ [DEBUG] Creating activation transaction...")
                create_and_broadcast_activation_transaction(node_ip, node_port, public_key)
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


def create_and_broadcast_activation_transaction(ip_address: str, port: int, public_key: str) -> None:
    """
    Create a validator activation transaction and broadcast to peers
    This allows other nodes to sync the validator's public_key to their local DB
    """
    try:
        from app.models.Transaction import Transaction
        from app.services.BlockChainService import BlockChainService
        from app.blockchain_instance import get_blockchain_instance
        from app.repositories.TransactionRepository import TransactionRepository
        import datetime
        import hashlib
        
        logger.info("→ Creating activation transaction for broadcast...")
        
        # Create activation transaction payload
        payload = {
            "op": "validator_activate",
            "ip_address": ip_address,
            "port": port,
            "public_key": public_key,
            "timestamp": datetime.datetime.now().timestamp()
        }
        
        # Hash payload to create tx_hash
        payload_json = json.dumps(payload, sort_keys=True).encode()
        tx_hash = hashlib.sha256(payload_json).hexdigest()
        
        # Create transaction object
        tx = Transaction(
            tx_id=tx_hash,
            tx_hash=tx_hash,
            sender_pubkey=public_key,
            sender_address="system",
            recipient_address="system",
            payload=payload,
            signature="",  # System transactions don't need signature
            timestamp=datetime.datetime.now().timestamp(),
            block_id=None
        )
        
        # Add to mempool
        blockchain = get_blockchain_instance()
        BlockChainService.add_transaction_to_mempool(blockchain, tx)
        logger.info(f"✓ Activation transaction created and added to mempool: {tx_hash[:16]}...")
        
        # Save to database for persistence
        if TransactionRepository.create_transaction(tx):
            logger.info(f"✓ Activation transaction saved to database: {tx_hash[:16]}...")
        else:
            logger.warning(f"⚠ Warning: Failed to save activation transaction to database, but still in mempool")
        
        # Broadcast to peers
        try:
            network_service = get_network_service()
            network_service.broadcast_transaction(tx.to_dict())
            logger.info(f"✓ Activation transaction broadcasted to peers")
        except Exception as broadcast_err:
            logger.warning(f"⚠ Could not broadcast activation transaction: {broadcast_err}")
    
    except Exception as e:
        logger.error(f"✗ Error creating activation transaction: {e}")


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
    logger.info("📨 [POST /api/v1/auth/activate] Validator activation request with passphrase")
    try:
        # Get passphrase from request
        data = request.get_json()
        
        if not data or 'passphrase' not in data:
            logger.error("✗ Passphrase is required")
            return jsonify({
                'success': False,
                'message': 'Passphrase is required'
            }), 400
        
        passphrase = data['passphrase']
        logger.info("→ Validating passphrase format...")
        
        # Validate passphrase format
        is_valid, error_msg = KeystoreManager.validate_passphrase(passphrase)
        if not is_valid:
            # Don't reveal validation details for security
            logger.error(f"✗ Invalid passphrase: {error_msg}")
            return jsonify({
                'success': False,
                'message': 'Invalid passphrase'
            }), 401
        
        # Load keystore file
        logger.info("→ Loading keystore file...")
        keystore_path = 'node.keystore'
        keystore_data = KeystoreManager.load_keystore(keystore_path)
        
        if keystore_data is None:
            logger.error("✗ Keystore not found")
            return jsonify({
                'success': False,
                'message': 'Keystore not found. Please run setup_identity.py first.'
            }), 404
        
        # Attempt to decrypt private key
        logger.info("→ Decrypting private key...")
        private_key_hex = KeystoreManager.decrypt_private_key(keystore_data, passphrase)
        
        # Clear passphrase from memory immediately
        KeystoreManager.secure_delete(passphrase)
        
        if private_key_hex is None:
            logger.error("✗ Authentication failed - invalid passphrase")
            return jsonify({
                'success': False,
                'message': 'Authentication failed'
            }), 401
        
        # Get validator worker instance
        validator_worker = get_validator_worker()
        
        if validator_worker is None:
            # Clean up private key
            KeystoreManager.secure_delete(private_key_hex)
            logger.error("✗ Validator worker not initialized")
            
            return jsonify({
                'success': False,
                'message': 'Validator worker not initialized. Please start the application properly.'
            }), 500
        
        # Activate validator with decrypted private key
        logger.info("→ Activating validator...")
        success = validator_worker.activate(private_key_hex)
        
        # Private key is now stored in validator worker, clear local reference
        KeystoreManager.secure_delete(private_key_hex)
        
        if success:
            logger.info(f"✓ Validator activated successfully (is_active={validator_worker.is_active})")
            
            # Try to update peer record in database
            public_key = keystore_data.get('public_key', '')
            try_update_peer_after_activation(validator_worker, public_key)
            
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
    logger.info("📨 [POST /api/v1/auth/activate-with-key] Validator activation with private key")
    try:
        # Get private key from request
        data = request.get_json()
        
        if not data or 'private_key_hex' not in data:
            logger.error("✗ Private key is required")
            return jsonify({
                'success': False,
                'message': 'Private key is required'
            }), 400
        
        private_key_hex = data['private_key_hex']
        logger.info("→ Received private key, activating validator...")
        
        # Get validator worker instance
        validator_worker = get_validator_worker()
        
        if validator_worker is None:
            logger.error("✗ Validator worker not initialized")
            return jsonify({
                'success': False,
                'message': 'Validator worker not initialized'
            }), 500
        
        # Check if already active
        if validator_worker.is_active:
            logger.warning("⚠ Validator is already active")
            
            # Still update peer record in database even if already active
            # (peer record might not exist or might not have public_key yet)
            public_key = validator_worker.public_key or ""
            try_update_peer_after_activation(validator_worker, public_key)
            
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
        logger.info("→ Calling validator_worker.activate()...")
        success = validator_worker.activate(private_key_hex)
        
        # Secure delete private key from request data
        KeystoreManager.secure_delete(private_key_hex)
        
        if success:
            logger.info(f"✓ Validator activated successfully (index={validator_worker.my_index}/{validator_worker.total_validators})")
            
            # Try to update peer record in database
            # Get public_key from validator_worker
            public_key = validator_worker.public_key or ""
            try_update_peer_after_activation(validator_worker, public_key)
            
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
