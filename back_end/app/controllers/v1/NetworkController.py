from flask import Blueprint, request, jsonify
from typing import Dict, Any

from app.services.NetworkService import get_network_service
from app.repositories.BlockRepository import BlockRepository
from app.blockchain_instance import get_blockchain_instance


network_bp = Blueprint('network', __name__, url_prefix='/api/v1/network')


@network_bp.route('/health', methods=['GET'])
def health_check():
    try:
        service = get_network_service()
        health = service.health_check()
        return jsonify(health), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/peers', methods=['GET'])
def get_peers():
    try:
        service = get_network_service()
        peers = service.get_peer_list()
        return jsonify(peers), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/peers/register', methods=['POST'])
def register_peer():
    try:
        data = request.get_json()
        
        required_fields = ['ip_address', 'port']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        service = get_network_service()
        public_key = data.get('public_key', '')
        
        peer = service.register_peer(
            ip_address=data['ip_address'],
            port=data['port'],
            public_key=public_key,
            node_type=data.get('node_type', 'validator')
        )
        
        if peer:
            if public_key:
                from app.repositories.PeerRepository import PeerRepository
                import hashlib
                peer_id = hashlib.sha256(
                    f"{data['ip_address']}:{data['port']}".encode()
                ).hexdigest()[:16]
                PeerRepository.update_peer_status(peer_id, "INACTIVE")
                peer['status'] = 'INACTIVE'
            
            return jsonify({
                'success': True,
                'peer': peer,
                'message': f"Peer registered with status {peer.get('status', 'PENDING')}"
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Peer registration failed'
            }), 403
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/peers/status-update', methods=['POST'])
def update_peer_status():
    try:
        data = request.get_json()
        
        required_fields = ['ip_address', 'port', 'public_key']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        service = get_network_service()
        
        success = service.update_peer_activation(
            ip_address=data['ip_address'],
            port=data['port'],
            public_key=data['public_key'],
            node_type=data.get('node_type', 'validator')
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Peer activated - public_key saved and status set to ACTIVE'
            }), 200
        else:
            from app.repositories.PeerRepository import PeerRepository
            import hashlib
            
            ip = data['ip_address']
            port = data['port']
            public_key = data['public_key']
            node_type = data.get('node_type', 'validator')
            
            peer_id = hashlib.sha256(f"{ip}:{port}".encode()).hexdigest()[:16]
            
            peer = PeerRepository.update_peer_public_key_and_activate(
                peer_id=peer_id,
                ip_address=ip,
                port=port,
                public_key=public_key
            )
            
            if peer:
                return jsonify({
                    'success': True,
                    'message': 'Peer registered and activated - public_key saved and status set to ACTIVE'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to register and activate peer'
                }), 500
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@network_bp.route('/peers/activation', methods=['POST'])
def receive_node_activation():
    try:
        from app.services.NodeActivationService import NodeActivationService
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Invalid request body'}), 400
        
        if data.get('type') != 'NODE_ACTIVATION':
            return jsonify({'error': 'Invalid message type'}), 400
        
        result = NodeActivationService.handle_activation_message(data)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            status_code = 401 if result.get('step') == 'authentication' else \
                         403 if result.get('step') == 'authorization' else 400
            return jsonify(result), status_code
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'step': 'error'}), 500


@network_bp.route('/gossip/transaction', methods=['POST'])
def receive_transaction_gossip():
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
    try:
        total_validators = int(request.args.get('total_validators', 3))
        
        service = get_network_service()
        slot_info = service.get_current_slot_info(total_validators)
        
        return jsonify(slot_info), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/peers/<peer_id>/approve', methods=['POST'])
def approve_peer(peer_id: str):
    try:
        service = get_network_service()
        success = service.approve_peer(peer_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Peer approved and set to INACTIVE (awaiting node activation)'
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
    try:
        service = get_network_service()
        pending_peers = service.get_pending_peers()
        return jsonify(pending_peers), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/stats', methods=['GET'])
def get_network_stats():
    try:
        service = get_network_service()
        stats = service.get_network_stats()
        return jsonify(stats), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@network_bp.route('/blocks/height', methods=['GET'])
def get_chain_height():
    try:
        blockchain = get_blockchain_instance()
        height = len(blockchain.chain) - 1
        
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
    try:
        start_index = request.args.get('start', 0, type=int)
        end_index = request.args.get('end', 100, type=int)
        
        if end_index - start_index > 50:
            end_index = start_index + 50
        
        blocks = BlockRepository.get_blocks_by_range(start_index, end_index)
        
        block_list = []
        for b in blocks:
            block_list.append(b.to_dict())
        
        return jsonify({
            'blocks': block_list
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


__all__ = ['network_bp']
