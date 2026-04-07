"""PeerRepository - Data access layer for peer operations"""
import time
import json
from typing import Optional, List, Dict
from app.database.connection import get_connection
from app.utils.logger import get_logger

logger = get_logger(__name__)


class PeerRepository:
    """Repository for peer database operations"""

    @staticmethod
    def add_or_update_peer(peer_id: str, ip_address: str, port: int, 
                          public_key: str, node_type: str = "validator", 
                          status: str = "PENDING") -> bool:
        """Add or update a peer in database"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Try to update first
            cursor.execute('''
                UPDATE peers 
                SET ip_address = ?, port = ?, public_key = ?, 
                    node_type = ?, status = ?, last_seen = ?
                WHERE peer_id = ?
            ''', (ip_address, port, public_key, node_type, status, time.time(), peer_id))
            
            if cursor.rowcount == 0:
                # If no rows updated, insert new peer
                cursor.execute('''
                    INSERT INTO peers (peer_id, ip_address, port, public_key, node_type, status, last_seen, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (peer_id, ip_address, port, public_key, node_type, status, time.time(), time.time()))
            
            conn.commit()
            conn.close()
            logger.info(f"Peer {peer_id} added/updated with status {status}")
            return True
        except Exception as e:
            logger.error(f"Error adding/updating peer: {e}")
            return False

    @staticmethod
    def get_peer_by_id(peer_id: str) -> Optional[Dict]:
        """Get peer by ID"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT peer_id, ip_address, port, public_key, node_type, status, last_seen, created_at 
                FROM peers 
                WHERE peer_id = ?
            ''', (peer_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return {
                    'peer_id': row[0],
                    'ip_address': row[1],
                    'port': row[2],
                    'public_key': row[3],
                    'node_type': row[4],
                    'status': row[5],
                    'last_seen': row[6],
                    'created_at': row[7]
                }
            return None
        except Exception as e:
            logger.error(f"Error getting peer by ID: {e}")
            return None

    @staticmethod
    def get_peers_by_status(status: str) -> List[Dict]:
        """Get all peers with specific status"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT peer_id, ip_address, port, public_key, node_type, status, last_seen, created_at 
                FROM peers 
                WHERE status = ?
                ORDER BY last_seen DESC
            ''', (status,))
            rows = cursor.fetchall()
            conn.close()
            
            peers = []
            for row in rows:
                peers.append({
                    'peer_id': row[0],
                    'ip_address': row[1],
                    'port': row[2],
                    'public_key': row[3],
                    'node_type': row[4],
                    'status': row[5],
                    'last_seen': row[6],
                    'created_at': row[7]
                })
            return peers
        except Exception as e:
            logger.error(f"Error getting peers by status: {e}")
            return []

    @staticmethod
    def get_all_peers() -> List[Dict]:
        """Get all peers"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT peer_id, ip_address, port, public_key, node_type, status, last_seen, created_at 
                FROM peers
                ORDER BY status, last_seen DESC
            ''')
            rows = cursor.fetchall()
            conn.close()
            
            peers = []
            for row in rows:
                peers.append({
                    'peer_id': row[0],
                    'ip_address': row[1],
                    'port': row[2],
                    'public_key': row[3],
                    'node_type': row[4],
                    'status': row[5],
                    'last_seen': row[6],
                    'created_at': row[7]
                })
            return peers
        except Exception as e:
            logger.error(f"Error getting all peers: {e}")
            return []

    @staticmethod
    def update_peer_status(peer_id: str, status: str) -> bool:
        """Update peer status (PENDING -> ACTIVE -> INACTIVE)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE peers 
                SET status = ?, last_seen = ?
                WHERE peer_id = ?
            ''', (status, time.time(), peer_id))
            
            conn.commit()
            conn.close()
            
            if cursor.rowcount > 0:
                logger.info(f"Peer {peer_id} status updated to {status}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error updating peer status: {e}")
            return False

    @staticmethod
    def get_peer_by_public_key(public_key: str) -> Optional[Dict]:
        """Get peer by public key"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT peer_id, ip_address, port, public_key, node_type, status, last_seen, created_at 
                FROM peers 
                WHERE public_key = ?
            ''', (public_key,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return {
                    'peer_id': row[0],
                    'ip_address': row[1],
                    'port': row[2],
                    'public_key': row[3],
                    'node_type': row[4],
                    'status': row[5],
                    'last_seen': row[6],
                    'created_at': row[7]
                }
            return None
        except Exception as e:
            logger.error(f"Error getting peer by public key: {e}")
            return None

    @staticmethod
    def is_peer_authorized(public_key: str) -> bool:
        """Check if peer is authorized (exists in account table as validator)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT count(*) FROM account 
                WHERE public_key = ? AND role = 'validator'
            ''', (public_key,))
            count = cursor.fetchone()[0]
            conn.close()
            return count > 0
        except Exception as e:
            logger.error(f"Error checking peer authorization: {e}")
            return False

    @staticmethod
    def delete_peer(peer_id: str) -> bool:
        """Delete a peer"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('DELETE FROM peers WHERE peer_id = ?', (peer_id,))
            conn.commit()
            conn.close()
            logger.info(f"Peer {peer_id} deleted")
            return True
        except Exception as e:
            logger.error(f"Error deleting peer: {e}")
            return False
