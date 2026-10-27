
from flask import Blueprint, jsonify
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
