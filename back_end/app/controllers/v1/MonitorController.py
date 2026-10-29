
import time
from concurrent.futures import ThreadPoolExecutor

import requests
from flask import Blueprint, jsonify, request
from app.core.auth import require_role
from app.utils.CryptoUtils import CryptoUtils
from network.chain_monitor import get_chain_monitor
from app.blockchain_instance import get_blockchain_instance


monitor_bp = Blueprint('monitor', __name__, url_prefix='/api/v1/monitor')


@monitor_bp.route('/status', methods=['GET'])
def get_monitor_status():
    try:
        monitor = get_chain_monitor()
        
        if not monitor:
            return jsonify({
                'success': False,
                'error': 'Chain monitor not initialized'
            }), 503
        
        summary = monitor.get_monitored_peers_summary()
        
        return jsonify({
            'success': True,
            'data': summary
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@monitor_bp.route('/statistics', methods=['GET'])
def get_monitor_statistics():
    try:
        monitor = get_chain_monitor()
        
        if not monitor:
            return jsonify({
                'success': False,
                'error': 'Chain monitor not initialized'
            }), 503
        
        stats = monitor.get_statistics()
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@monitor_bp.route('/chain-info', methods=['GET'])
def get_chain_info():
    try:
        blockchain = get_blockchain_instance()
        
        last_block = blockchain.get_last_block()
        chain_height = len(blockchain.chain) - 1
        
        return jsonify({
            'success': True,
            'data': {
                'chain_height': chain_height,
                'block_count': len(blockchain.chain),
                'last_block_hash': last_block.block_hash if last_block else None,
                'last_block_index': last_block.index if last_block else 0,
                'last_block_timestamp': last_block.block_header.timestamp if last_block else None,
                'authority_set_size': len(blockchain.authority_set)
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@monitor_bp.route('/sync-status', methods=['GET'])
def get_sync_status():
    try:
        monitor = get_chain_monitor()
        blockchain = get_blockchain_instance()
        
        if not monitor:
            return jsonify({
                'success': False,
                'error': 'Chain monitor not initialized'
            }), 503
        
        local_height = monitor.get_local_height()
        max_height = monitor.max_height
        
        if max_height == 0:
            sync_percentage = 100.0
            blocks_remaining = 0
            estimated_time = 0
        else:
            sync_percentage = (local_height / max_height) * 100
            blocks_remaining = max_height - local_height
            estimated_time = blocks_remaining * 5
        
        is_synced = local_height >= max_height or blocks_remaining <= monitor.block_gap_threshold
        
        return jsonify({
            'success': True,
            'data': {
                'is_synced': is_synced,
                'local_height': local_height,
                'max_network_height': max_height,
                'sync_percentage': round(sync_percentage, 2),
                'blocks_remaining': blocks_remaining,
                'estimated_time_seconds': estimated_time,
                'gap_threshold': monitor.block_gap_threshold
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@monitor_bp.route('/peers', methods=['GET'])
def get_peer_details():
    try:
        monitor = get_chain_monitor()
        
        if not monitor:
            return jsonify({
                'success': False,
                'error': 'Chain monitor not initialized'
            }), 503
        
        peers_data = []
        for peer_id, status in monitor.peer_block_status.items():
            peers_data.append({
                'peer_id': peer_id,
                'ip_address': status.peer.ip_address,
                'port': status.peer.port,
                'chain_height': status.chain_height,
                'status': status.status,
                'query_count': status.query_count,
                'failed_count': status.failed_count,
                'last_queried': status.last_queried
            })
        
        return jsonify({
            'success': True,
            'data': {
                'total_peers': len(peers_data),
                'peers': peers_data
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


_STARTED_AT = time.time()


def _node_status() -> dict:
    from app.core.config import NODE_NAME, NODE_ROLE, NODE_IP, NODE_PORT
    from consensus.validator_worker import get_validator_worker
    from app.services.NetworkService import get_network_service

    blockchain = get_blockchain_instance()
    worker = get_validator_worker()
    stats = worker.get_stats() if worker else {}
    public_key = worker.public_key if worker else ""
    peer_manager = get_network_service().peer_manager
    last_block = blockchain.chain[-1] if blockchain.chain else None

    return {
        'name': NODE_NAME,
        'role': NODE_ROLE,
        'ip_address': NODE_IP,
        'port': NODE_PORT,
        'public_key': public_key,
        'address': CryptoUtils.get_address_from_pubkey(public_key) if public_key else "",
        'is_moet': bool(public_key) and public_key == blockchain.super_validator_pubkey,
        'is_active': stats.get('is_active', False),
        'in_authority_set': public_key in blockchain.authority_set,
        'validator_index': stats.get('validator_index', -1),
        'blocks_mined': stats.get('blocks_mined', 0),
        'mempool_size': len(blockchain.mempool),
        'height': len(blockchain.chain) - 1,
        'tip_hash': last_block.block_hash if last_block else "",
        'tip_timestamp': last_block.block_header.timestamp if last_block else None,
        'known_peers': len(peer_manager.peers),
        'uptime_seconds': int(time.time() - _STARTED_AT),
    }


def _fetch_peer_status(peer) -> dict:
    try:
        response = requests.get(f"{peer.get_url()}/api/v1/monitor/node", timeout=2)
        if response.status_code == 200:
            return {**response.json()['data'], 'reachable': True}
    except (requests.RequestException, ValueError, KeyError):
        pass
    return {
        'name': None,
        'ip_address': peer.ip_address,
        'port': peer.port,
        'public_key': peer.public_key,
        'reachable': False,
        'last_seen': peer.last_seen,
    }


@monitor_bp.route('/node', methods=['GET'])
def get_node_status():
    return jsonify({'success': True, 'data': _node_status()}), 200


@monitor_bp.route('/network', methods=['GET'])
def get_network_overview():
    from app.services.NetworkService import get_network_service
    from app.services.BlockChainService import BlockChainService

    blockchain = get_blockchain_instance()
    service = get_network_service()
    peer_manager = service.peer_manager

    nodes = [{**_node_status(), 'reachable': True, 'is_self': True}]
    peers = [p for p in list(peer_manager.peers.values()) if p.peer_id != peer_manager.local_peer_id]
    with ThreadPoolExecutor(max_workers=16) as pool:
        peer_statuses = list(pool.map(_fetch_peer_status, peers))

    seen = {nodes[0]['public_key'] or f"{nodes[0]['ip_address']}:{nodes[0]['port']}"}
    for status in sorted(peer_statuses, key=lambda s: not s['reachable']):
        key = status.get('public_key') or f"{status['ip_address']}:{status['port']}"
        if key in seen:
            continue
        seen.add(key)
        nodes.append({**status, 'is_self': False})

    names = {n['public_key']: n.get('name') for n in nodes if n.get('public_key')}
    validators = sorted(blockchain.authority_set)
    slot = service.consensus_timer.get_current_slot()
    leader_index = slot % len(validators) if validators else -1

    authority = [{
        'index': i,
        'public_key': pk,
        'address': CryptoUtils.get_address_from_pubkey(pk),
        'name': names.get(pk),
        'is_moet': pk == blockchain.super_validator_pubkey,
        'is_leader': i == leader_index,
    } for i, pk in enumerate(validators)]

    recent_blocks = [{
        'index': b.index,
        'block_hash': b.block_hash,
        'validator_pubkey': b.block_header.validator_pubkey,
        'validator_name': names.get(b.block_header.validator_pubkey),
        'tx_count': len(b.transactions),
        'timestamp': b.block_header.timestamp,
    } for b in reversed(blockchain.chain[-10:])]

    return jsonify({
        'success': True,
        'data': {
            'nodes': nodes,
            'authority_set': authority,
            'pending_validators': BlockChainService.get_pending_validators(blockchain),
            'consensus': {
                'current_slot': slot,
                'leader_index': leader_index,
                'slot_duration': service.consensus_timer.slot_duration,
                'time_remaining_in_slot': service.consensus_timer.time_until_next_slot(),
            },
            'whitelist_enabled': service.config.is_whitelist_enabled(),
            'recent_blocks': recent_blocks,
        }
    }), 200


def _submit_authority_change(op: str):
    from consensus.validator_worker import get_validator_worker

    public_key = (request.get_json(silent=True) or {}).get('public_key', '')
    if not public_key:
        return jsonify({'success': False, 'error': 'public_key is required'}), 400

    blockchain = get_blockchain_instance()
    worker = get_validator_worker()
    if not worker or not worker.is_active or worker.public_key != blockchain.super_validator_pubkey:
        return jsonify({'success': False, 'error': 'Chỉ node MOET đang hoạt động mới thực hiện được thao tác này'}), 409
    if op == 'validator_remove' and public_key == blockchain.super_validator_pubkey:
        return jsonify({'success': False, 'error': 'Không thể gỡ MOET khỏi danh sách validator'}), 400
    if (op == 'validator_add') == (public_key in blockchain.authority_set):
        return jsonify({'success': False, 'error': 'Trạng thái validator không thay đổi'}), 409

    tx = worker.submit_system_tx({'op': op, 'public_key': public_key})
    if tx is None:
        return jsonify({'success': False, 'error': 'Không tạo được giao dịch'}), 500
    return jsonify({'success': True, 'tx_hash': tx.tx_hash}), 202


@monitor_bp.route('/validators/approve', methods=['POST'])
@require_role('moet')
def approve_validator():
    return _submit_authority_change('validator_add')


@monitor_bp.route('/validators/remove', methods=['POST'])
@require_role('moet')
def remove_validator():
    return _submit_authority_change('validator_remove')
