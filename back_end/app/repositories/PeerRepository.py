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
        max_retries = 3
        retry_delay = 0.5
        
        for attempt in range(max_retries):
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
                if "locked" in str(e).lower() and attempt < max_retries - 1:
                    logger.warning(f"⚠ Database locked, retry #{attempt + 1}/{max_retries} for peer {peer_id[:16]}...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                logger.error(f"Error adding/updating peer: {e}")
                try:
                    conn.close()
                except:
                    pass
                return False
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
        max_retries = 3
        retry_delay = 0.5
        
        for attempt in range(max_retries):
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
                    logger.info(f"✓ Peer {peer_id[:16]}... status updated to {status}")
                    return True
                logger.warning(f"⚠ Peer {peer_id[:16]}... not found for status update")
                return False
            except Exception as e:
                if "locked" in str(e).lower() and attempt < max_retries - 1:
                    logger.warning(f"⚠ Database locked, retry #{attempt + 1}/{max_retries} for peer status update...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                logger.error(f"✗ Error updating peer status: {e}")
                try:
                    conn.close()
                except:
                    pass
                return False
        return False

    @staticmethod
    def update_peer_public_key_and_activate(peer_id: str, ip_address: str, port: int, public_key: str) -> bool:
        """
        Update peer's public_key and mark as ACTIVE (called after validator activation)
        If peer doesn't exist, create it first (upsert pattern)
        """
        max_retries = 3
        retry_delay = 0.5
        
        for attempt in range(max_retries):
            try:
                conn = get_connection()
                cursor = conn.cursor()
                
                logger.info(f"→ [DB] Checking if peer {peer_id[:16]}... exists")
                
                # First check if peer exists
                cursor.execute('SELECT peer_id, public_key, status FROM peers WHERE peer_id = ?', (peer_id,))
                row = cursor.fetchone()
                exists = row is not None
                
                logger.info(f"→ [DB] Peer exists: {exists}, current data: {row if row else 'None'}")
                
                if exists:
                    # Peer exists - update it
                    logger.info(f"→ [DB] Updating peer: SET public_key={public_key[:16]}..., status=ACTIVE")
                    cursor.execute('''
                        UPDATE peers 
                        SET public_key = ?, status = 'ACTIVE', last_seen = ?
                        WHERE peer_id = ?
                    ''', (public_key, time.time(), peer_id))
                    
                    updated_rows = cursor.rowcount
                    logger.info(f"→ [DB] UPDATE rowcount: {updated_rows} (should be 1)")
                    
                    if updated_rows != 1:
                        logger.warning(f"⚠ [DB] UPDATE didn't update exactly 1 row! rowcount={updated_rows}")
                        
                    # Verify update worked
                    cursor.execute('SELECT public_key, status FROM peers WHERE peer_id = ?', (peer_id,))
                    verify_row = cursor.fetchone()
                    logger.info(f"→ [DB] Verify after UPDATE: public_key={verify_row[0][:16] if verify_row[0] else 'NONE'}..., status={verify_row[1]}")
                    
                    if not verify_row[0] or verify_row[0] != public_key:
                        logger.error(f"✗ [DB] Verification FAILED! public_key not updated correctly")
                        logger.error(f"  Expected: {public_key[:16]}...")
                        logger.error(f"  Actual: {verify_row[0][:16] if verify_row[0] else 'NONE'}...")
                    
                    logger.info(f"→ Updated existing peer {peer_id[:16]}...")
                else:
                    # Peer doesn't exist - create it
                    logger.info(f"→ [DB] Creating new peer: peer_id={peer_id[:16]}..., ip={ip_address}, port={port}, public_key={public_key[:16]}...")
                    cursor.execute('''
                        INSERT INTO peers (peer_id, ip_address, port, public_key, node_type, status, last_seen, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (peer_id, ip_address, port, public_key, 'validator', 'ACTIVE', time.time(), time.time()))
                    
                    inserted_rows = cursor.rowcount
                    logger.info(f"→ [DB] INSERT rowcount: {inserted_rows} (should be 1)")
                    
                    # Verify insert worked
                    cursor.execute('SELECT public_key, status FROM peers WHERE peer_id = ?', (peer_id,))
                    verify_row = cursor.fetchone()
                    logger.info(f"→ [DB] Verify after INSERT: public_key={verify_row[0][:16] if verify_row and verify_row[0] else 'NONE'}..., status={verify_row[1] if verify_row else 'NONE'}")
                    
                    logger.info(f"→ Created new peer {peer_id[:16]}... with public_key and status=ACTIVE")
                
                conn.commit()
                logger.info(f"→ [DB] COMMIT completed")
                conn.close()
                
                logger.info(f"✓ Peer {peer_id[:16]}... activated with public_key in database")
                return True
                
            except Exception as e:
                if "locked" in str(e).lower() and attempt < max_retries - 1:
                    logger.warning(f"⚠ Database locked, retry #{attempt + 1}/{max_retries} for peer {peer_id[:16]}...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                    
                logger.error(f"✗ Error updating peer public_key and activating: {e}")
                import traceback
                logger.error(f"✗ [DB] Exception traceback: {traceback.format_exc()}")
                try:
                    conn.close()
                except:
                    pass
                return False
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
