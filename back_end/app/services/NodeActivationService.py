import json
import time
import hashlib
from typing import Optional, Dict, Any
import requests
from app.utils.CryptoUtils import CryptoUtils
from app.utils.logger import get_logger
from app.models.Transaction import Transaction
from app.repositories.PeerRepository import PeerRepository

logger = get_logger(__name__)


class NodeActivationService:

    @staticmethod
    def create_activation_payload(node_id: str, ip: str, port: int) -> Dict[str, Any]:
        payload = {
            "node_id": node_id,
            "ip": ip,
            "port": port,
            "timestamp": int(time.time()),
            "status": "ACTIVE"
        }
        return payload

    @staticmethod
    def sign_activation_payload(payload: Dict[str, Any], private_key: str) -> str:
        try:
            payload_json = json.dumps(payload, sort_keys=True)
            
            signature = CryptoUtils.sign_data(payload_json, private_key)
            
            logger.info(f"Payload signed successfully. Signature: {signature[:32]}...")
            return signature
        except Exception as e:
            logger.error(f"Error signing activation payload: {e}")
            raise

    @staticmethod
    def verify_activation_signature(payload: Dict[str, Any], 
                                   signature: str, public_key: str) -> bool:
        try:
            payload_json = json.dumps(payload, sort_keys=True)
            is_valid = CryptoUtils.verify_signature(payload_json, signature, public_key)
            return is_valid
        except Exception as e:
            logger.error(f"Error verifying activation signature: {e}")
            return False

    @staticmethod
    def broadcast_activation(node_id: str, ip: str, port: int, 
                           signature: str, seed_nodes: list) -> Dict[str, Any]:
        try:
            payload = NodeActivationService.create_activation_payload(node_id, ip, port)
            
            broadcast_message = {
                "type": "NODE_ACTIVATION",
                "payload": payload,
                "signature": signature
            }
            
            results = {
                "success_count": 0,
                "failed_count": 0,
                "results": []
            }
            
            logger.info(f"Broadcasting activation to {len(seed_nodes)} seed nodes...")
            
            for seed_node in seed_nodes:
                try:
                    url = f"http://{seed_node['ip']}:{seed_node['port']}/api/v1/network/peers/activation"
                    
                    response = requests.post(
                        url,
                        json=broadcast_message,
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        result_data = response.json()
                        if result_data.get('success'):
                            results['success_count'] += 1
                            results['results'].append({
                                'seed_node': seed_node['name'],
                                'status': 'success',
                                'message': result_data.get('message')
                            })
                            logger.info(f"✓ Activation broadcast to {seed_node['name']} successful")
                        else:
                            results['failed_count'] += 1
                            results['results'].append({
                                'seed_node': seed_node['name'],
                                'status': 'failed',
                                'message': result_data.get('message', 'Unknown error')
                            })
                            logger.warning(f"✗ Activation broadcast to {seed_node['name']} failed")
                    else:
                        results['failed_count'] += 1
                        results['results'].append({
                            'seed_node': seed_node['name'],
                            'status': 'failed',
                            'message': f"HTTP {response.status_code}"
                        })
                        logger.warning(f"✗ HTTP {response.status_code} from {seed_node['name']}")
                        
                except requests.exceptions.RequestException as e:
                    results['failed_count'] += 1
                    results['results'].append({
                        'seed_node': seed_node['name'],
                        'status': 'failed',
                        'message': str(e)
                    })
                    logger.warning(f"✗ Connection error to {seed_node['name']}: {e}")
                    
                except Exception as e:
                    results['failed_count'] += 1
                    results['results'].append({
                        'seed_node': seed_node['name'],
                        'status': 'failed',
                        'message': str(e)
                    })
                    logger.error(f"✗ Error broadcasting to {seed_node['name']}: {e}")
            
            return results
            
        except Exception as e:
            logger.error(f"Error in broadcast_activation: {e}")
            raise

    @staticmethod
    def handle_activation_message(activation_message: Dict[str, Any]) -> Dict[str, Any]:
        try:
            payload = activation_message.get('payload', {})
            signature = activation_message.get('signature', '')
            
            node_id = payload.get('node_id')
            ip = payload.get('ip')
            port = payload.get('port')
            status = payload.get('status')
            
            logger.info(f"Processing activation message from {ip}:{port}")
            
            if not NodeActivationService.verify_activation_signature(payload, signature, node_id):
                logger.warning(f"Signature verification failed for node {node_id}")
                return {
                    'success': False,
                    'message': 'Signature verification failed',
                    'step': 'authentication'
                }
            
            logger.info(f"✓ Authentication verified for {node_id}")
            
            is_authorized = PeerRepository.is_peer_authorized(node_id)
            if not is_authorized:
                logger.warning(f"Node {node_id} is not authorized")
                return {
                    'success': False,
                    'message': 'Node is not authorized',
                    'step': 'authorization'
                }
            
            logger.info(f"✓ Authorization verified for {node_id}")
            
            peer_id = node_id[:16]
            
            existing_peer = PeerRepository.get_peer_by_public_key(node_id)
            
            if existing_peer:
                success = PeerRepository.update_peer_status(existing_peer['peer_id'], 'ACTIVE')
                if success:
                    logger.info(f"✓ Updated peer {existing_peer['peer_id']} to ACTIVE")
                    return {
                        'success': True,
                        'message': 'Peer status updated to ACTIVE',
                        'peer_id': existing_peer['peer_id'],
                        'action': 'updated'
                    }
            else:
                success = PeerRepository.add_or_update_peer(
                    peer_id=peer_id,
                    ip_address=ip,
                    port=port,
                    public_key=node_id,
                    node_type='validator',
                    status='ACTIVE'
                )
                if success:
                    logger.info(f"✓ Added new peer {peer_id} with ACTIVE status")
                    return {
                        'success': True,
                        'message': 'New peer added with ACTIVE status',
                        'peer_id': peer_id,
                        'action': 'added'
                    }
            
            return {
                'success': False,
                'message': 'Failed to update peer status',
                'step': 'peer_update'
            }
            
        except Exception as e:
            logger.error(f"Error handling activation message: {e}")
            return {
                'success': False,
                'message': str(e),
                'step': 'error'
            }

    @staticmethod
    def create_activation_transaction(node_id: str, ip: str, port: int, 
                                     sender_address: str, private_key: str) -> Optional[Transaction]:
        try:
            activation_data = {
                "type": "PEER_ACTIVATION",
                "node_id": node_id,
                "ip": ip,
                "port": port
            }
            
            tx = Transaction(
                sender_pubkey=node_id,
                sender_address=sender_address,
                recipient_address="SYSTEM",
                payload=activation_data,
                timestamp=time.time()
            )
            
            from app.services.TransactionService import TransactionService
            TransactionService.sign(tx, private_key)
            
            logger.info(f"Created activation transaction: {tx.tx_id}")
            return tx
            
        except Exception as e:
            logger.error(f"Error creating activation transaction: {e}")
            return None

    @staticmethod
    def add_activation_to_mempool(transaction: Transaction, mempool: list = None) -> bool:
        try:
            if mempool is None:
                from app.repositories.TransactionRepository import TransactionRepository
                return TransactionRepository.add_transaction(transaction)
            else:
                mempool.append(transaction.to_dict())
                logger.info(f"Added activation transaction to mempool: {transaction.tx_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error adding activation transaction to mempool: {e}")
            return False
