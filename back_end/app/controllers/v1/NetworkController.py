"""
Network Controller for EduChain P2P API
REST API endpoints for peer discovery, gossip protocol, and chain sync
"""
from flask import Blueprint, request, jsonify
from typing import Dict, Any

from app.services.NetworkService import get_network_service
from app.repositories.BlockRepository import BlockRepository
from app.blockchain_instance import get_blockchain_instance


# Create blueprint for network routes
network_bp = Blueprint('network', __name__, url_prefix='/api/v1/network')


@network_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    Returns network health status
    """
    try:
        service = get_network_service()
        health = service.health_check()
        return jsonify(health), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/peers', methods=['GET'])
def get_peers():
    """
    Get list of active peers
    Used for peer discovery (PEX protocol)
    
    Response:
    [
        {
            "peer_id": "abc123...",
            "ip_address": "10.0.1.2",
            "port": 5000,
            "public_key": "04a1b2c3...",
            "node_type": "validator",
            "status": "ACTIVE",
            "last_seen": 1234567890.0
        },
        ...
    ]
    """
    try:
        service = get_network_service()
        peers = service.get_peer_list()
        return jsonify(peers), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/peers/register', methods=['POST'])
def register_peer():
    """
    Register a new peer with the network
    
    Request body:
    {
        "ip_address": "10.0.1.5",
        "port": 5000,
        "public_key": "04xyz...",
        "node_type": "observer"
    }
    
    Response:
    {
        "success": true,
        "peer": { ... }
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['ip_address', 'port', 'public_key']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        service = get_network_service()
        
        # Register peer
        peer = service.register_peer(
            ip_address=data['ip_address'],
            port=data['port'],
            public_key=data['public_key'],
            node_type=data.get('node_type', 'observer')
        )
        
        if peer:
            return jsonify({
                'success': True,
                'peer': peer
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Peer not authorized or already exists'
            }), 403
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/gossip/transaction', methods=['POST'])
def receive_transaction_gossip():
    """
    Receive gossiped transaction
    
    Request body:
    {
        "msg_type": "transaction",
        "msg_id": "abc123...",
        "data": {
            "tx_hash": "def456...",
            "sender_address": "addr1",
            "recipient_address": "addr2",
            ...
        },
        "timestamp": 1234567890.0
    }
    
    Response:
    {
        "success": true,
        "is_new": true
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'data' not in data:
            return jsonify({'error': 'Invalid message format'}), 400
        
        tx_data = data['data']
        sender_peer_id = request.headers.get('X-Peer-ID')
        
        service = get_network_service()
        is_new = service.receive_transaction(tx_data, sender_peer_id)
        
        return jsonify({
            'success': True,
            'is_new': is_new
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/gossip/block', methods=['POST'])
def receive_block_gossip():
    """
    Receive gossiped block
    
    Request body:
    {
        "msg_type": "block",
        "msg_id": "abc123...",
        "data": {
            "block_hash": "def456...",
            "index": 105,
            ...
        },
        "timestamp": 1234567890.0
    }
    
    Response:
    {
        "success": true,
        "is_new": true
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'data' not in data:
            return jsonify({'error': 'Invalid message format'}), 400
        
        block_data = data['data']
        sender_peer_id = request.headers.get('X-Peer-ID')
        
        service = get_network_service()
        is_new = service.receive_block(block_data, sender_peer_id)
        
        return jsonify({
            'success': True,
            'is_new': is_new
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/gossip/inv', methods=['POST'])
def receive_inv_message():
    """
    Receive inventory (INV) message
    
    Request body:
    {
        "msg_type": "inv",
        "msg_id": "abc123...",
        "data": {
            "block_hash": "def456...",
            "block_index": 105,
            "has_block": true
        },
        "timestamp": 1234567890.0
    }
    
    Response:
    {
        "success": true,
        "requested_block": true,
        "block": { ... } or null
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'data' not in data:
            return jsonify({'error': 'Invalid message format'}), 400
        
        inv_data = data['data']
        sender_peer_id = request.headers.get('X-Peer-ID')
        
        service = get_network_service()
        block_data = service.handle_inv_message(inv_data, sender_peer_id)
        
        return jsonify({
            'success': True,
            'requested_block': block_data is not None,
            'block': block_data
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/gossip/block/<block_hash>', methods=['GET'])
def get_block_by_hash(block_hash: str):
    """
    Get full block data by hash
    Used when responding to INV messages
    
    Response:
    {
        "success": true,
        "block": { ... }
    }
    """
    try:
        service = get_network_service()
        block_data = service.get_block_by_hash(block_hash)
        
        if block_data:
            return jsonify({
                'success': True,
                'block': block_data
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Block not found'
            }), 404
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/consensus/slot', methods=['GET'])
def get_slot_info():
    """
    Get current consensus slot information
    
    Query params:
    - total_validators: number of validators (default: 3)
    
    Response:
    {
        "current_slot": 12345,
        "leader_index": 2,
        "slot_duration": 5,
        "time_remaining_in_slot": 3.2,
        "current_timestamp": 1234567890.0
    }
    """
    try:
        total_validators = int(request.args.get('total_validators', 3))
        
        service = get_network_service()
        slot_info = service.get_current_slot_info(total_validators)
        
        return jsonify(slot_info), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/peers/<peer_id>/approve', methods=['POST'])
def approve_peer(peer_id: str):
    """
    Approve a pending peer (MOET only)
    Transitions peer from PENDING -> ACTIVE and adds to whitelist
    
    Response:
    {
        "success": true,
        "message": "Peer approved successfully"
    }
    """
    try:
        # TODO: Add MOET role check here
        service = get_network_service()
        success = service.approve_peer(peer_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Peer approved successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to approve peer or peer not found'
            }), 404
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/peers/pending', methods=['GET'])
def get_pending_peers():
    """
    Get all pending peers awaiting approval (MOET only)
    
    Response:
    [
        {
            "peer_id": "abc123...",
            "ip_address": "10.0.1.2",
            "port": 5000,
            "public_key": "04a1b2c3...",
            "node_type": "validator",
            "status": "PENDING",
            "last_seen": 1234567890.0
        },
        ...
    ]
    """
    try:
        # TODO: Add MOET role check here
        service = get_network_service()
        pending_peers = service.get_pending_peers()
        return jsonify(pending_peers), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/stats', methods=['GET'])
def get_network_stats():
    """
    Get network statistics
    
    Response:
    {
        "total_peers": 10,
        "active_peers": 8,
        "pending_peers": 2,
        "validator_peers": 3,
        "observer_peers": 5,
        "whitelist_enabled": true,
        "slot_duration": 5,
        "ntp_offset": 0.123,
        "is_time_synced": true
    }
    """
    try:
        service = get_network_service()
        stats = service.get_network_stats()
        return jsonify(stats), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/blocks/height', methods=['GET'])
def get_chain_height():
    """
    Get current blockchain height (for chain sync protocol)
    
    Response:
    {
        "height": 105,
        "latest_block_hash": "abc123..."
    }
    """
    try:
        blockchain = get_blockchain_instance()
        height = len(blockchain.chain) - 1  # -1 because genesis is index 0
        
        latest_hash = ""
        if len(blockchain.chain) > 0:
            latest_hash = blockchain.get_last_block().block_hash
        
        return jsonify({
            'height': height,
            'latest_block_hash': latest_hash
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/blocks/range', methods=['GET'])
def get_blocks_for_sync():
    """
    Get blocks in a given index range with full data (for chain sync)
    Returns full block data including transactions for P2P sync
    
    Query params:
    - start: start block index (inclusive)
    - end: end block index (inclusive)
    
    Response:
    {
        "blocks": [
            { full block dict with transactions... },
            ...
        ]
    }
    """
    try:
        start_index = request.args.get('start', 0, type=int)
        end_index = request.args.get('end', 100, type=int)
        
        # Limit range to prevent abuse
        if end_index - start_index > 50:
            end_index = start_index + 50
        
        blocks = BlockRepository.get_blocks_by_range(start_index, end_index)
        
        # Return full block data with transactions for sync
        block_list = []
        for b in blocks:
            block_list.append(b.to_dict())
        
        return jsonify({
            'blocks': block_list
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Export blueprint
__all__ = ['network_bp']
