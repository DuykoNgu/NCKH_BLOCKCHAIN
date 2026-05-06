#!/usr/bin/env python3
"""
Node Activate Script - Activate a node as an active validator
This script:
1. Loads the keystore created by setup.py
2. Asks for passphrase to unlock private key
3. Activates the validator for block mining
4. Creates signed activation payload and broadcasts to network
5. Optionally creates activation transaction for mempool

Usage:
    python active_node.py
"""

import os
import sys
import json
import getpass
import requests
import time
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.utils.KeystoreManager import KeystoreManager
from app.services.NodeActivationService import NodeActivationService
from app.utils.CryptoUtils import CryptoUtils

# Load environment variables
load_dotenv()


class NodeActivator:
    """Handles node activation and status broadcasting"""
    
    def __init__(self):
        """Initialize activation manager"""
        self.keystore_path = os.getenv("KEYSTORE_PATH", "node.keystore")
        self.node_ip = os.getenv("NODE_IP", "127.0.0.1")
        self.node_port = int(os.getenv("NODE_PORT", "5000"))
        self.bootstrap_url = os.getenv("BOOTSTRAP_NODE_URL", "http://127.0.0.1:5000")
        self.max_retries = 3
        self.retry_delay = 2
        
        self.keystore_data: Optional[dict] = None
        self.private_key: Optional[str] = None
        self.public_key: Optional[str] = None
    
    def print_header(self, text: str):
        """Print formatted header"""
        print("\n" + "="*70)
        print(f"  {text}")
        print("="*70)
    
    def print_section(self, text: str):
        """Print formatted section"""
        print(f"\n{"─"*70}")
        print(f"  {text}")
        print(f"{"─"*70}")
    
    def print_success(self, text: str):
        """Print success message"""
        print(f"✅  {text}")
    
    def print_error(self, text: str):
        """Print error message"""
        print(f"❌  {text}")
    
    def print_info(self, text: str):
        """Print info message"""
        print(f"ℹ️   {text}")
    
    def print_warning(self, text: str):
        """Print warning message"""
        print(f"⚠️   {text}")
    
    def load_keystore(self) -> bool:
        """Load keystore from file"""
        self.print_section("Step 1: Loading Keystore")
        
        if not os.path.exists(self.keystore_path):
            self.print_error(f"Keystore not found: {self.keystore_path}")
            self.print_info("Please run setup.py first to create a keystore")
            return False
        
        try:
            self.keystore_data = KeystoreManager.load_keystore(self.keystore_path)
            if self.keystore_data is None:
                self.print_error("Failed to load keystore")
                return False
            
            self.public_key = self.keystore_data.get('public_key')
            if not self.public_key:
                self.print_error("Keystore missing public_key")
                return False
            
            self.print_success("Keystore loaded successfully")
            self.print_info(f"Public Key: {self.public_key[:32]}...{self.public_key[-8:]}")
            self.print_info(f"Node Type:  {self.keystore_data.get('node_type', 'validator')}")
            
            return True
        
        except Exception as e:
            self.print_error(f"Error loading keystore: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_passphrase(self) -> Optional[str]:
        """Get passphrase from user"""
        self.print_section("Step 2: Unlock Private Key")
        self.print_info("Keystore is encrypted. Enter passphrase to unlock private key.")
        
        for attempt in range(3):
            passphrase = getpass.getpass(f"Enter passphrase (attempt {attempt + 1}/3): ")
            
            # Validate passphrase format
            is_valid, error_msg = KeystoreManager.validate_passphrase(passphrase)
            if not is_valid:
                self.print_error(f"Invalid passphrase format: {error_msg}")
                continue
            
            return passphrase
        
        self.print_error("Maximum passphrase attempts exceeded")
        return None
    
    def unlock_private_key(self, passphrase: str) -> bool:
        """Decrypt and unlock private key"""
        try:
            self.print_info("Decrypting private key...")
            
            private_key_hex = KeystoreManager.decrypt_private_key(
                self.keystore_data,
                passphrase
            )
            
            # Securely delete passphrase from memory
            KeystoreManager.secure_delete(passphrase)
            
            if private_key_hex is None:
                self.print_error("Failed to decrypt private key - wrong passphrase?")
                return False
            
            self.private_key = private_key_hex
            self.print_success("Private key unlocked successfully")
            return True
        
        except Exception as e:
            self.print_error(f"Error unlocking private key: {e}")
            return False
    
    def activate_validator(self) -> bool:
        """Activate validator via HTTP API call to running server"""
        self.print_section("Step 3: Activating Validator")
        
        try:
            # Prepare request data with private key
            activation_data = {
                'private_key_hex': self.private_key
            }
            
            self.print_info("Sending activation request to local server...")
            
            # Send activation request to server (run.py)
            activate_url = f"http://{self.node_ip}:{self.node_port}/api/v1/auth/activate-with-key"
            
            response = requests.post(
                activate_url,
                json=activation_data,
                timeout=10
            )
            
            # Securely delete private key from local reference
            if self.private_key:
                KeystoreManager.secure_delete(self.private_key)
                self.private_key = None
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success'):
                    self.print_success("Validator activated successfully!")
                    
                    validator_info = result.get('validator_info', {})
                    self.print_info(f"Validator Index:  {validator_info.get('validator_index', 'N/A')}")
                    self.print_info(f"Total Validators: {validator_info.get('total_validators', 'N/A')}")
                    self.print_info(f"Status:           Active ✓")
                    
                    return True
                else:
                    error_msg = result.get('message', 'Unknown error')
                    self.print_error(f"Activation failed: {error_msg}")
                    return False
            else:
                self.print_error(f"Server error: HTTP {response.status_code}")
                error_text = response.text
                if error_text:
                    self.print_error(f"Details: {error_text[:100]}")
                
                # Check if run.py is actually running
                if response.status_code == 0 or "Connection" in str(response):
                    self.print_warning(f"\nCould not connect to server at http://{self.node_ip}:{self.node_port}")
                    self.print_info("Make sure 'python run.py' is running in another terminal")
                
                return False
        
        except requests.exceptions.ConnectionError:
            self.print_error("Connection refused - server not running")
            self.print_info(f"Make sure 'python run.py' is running at http://{self.node_ip}:{self.node_port}")
            
            # Clean up private key
            if self.private_key:
                KeystoreManager.secure_delete(self.private_key)
                self.private_key = None
            
            return False
        
        except Exception as e:
            self.print_error(f"Error activating validator: {e}")
            import traceback
            traceback.print_exc()
            
            # Clean up private key
            if self.private_key:
                KeystoreManager.secure_delete(self.private_key)
                self.private_key = None
            
            return False
    
    def broadcast_peer_status_update(self) -> bool:
        """
        Broadcast peer status update to bootstrap node
        Sends: ip_address, port, public_key, node_type
        Triggers Stage 3: INACTIVE -> ACTIVE transition
        """
        self.print_section("Step 4: Broadcasting Peer Status")
        
        try:
            # Load node config
            config_path = ".node_config.json"
            if not os.path.exists(config_path):
                self.print_warning("Node config not found")
                return True  # Non-critical
            
            with open(config_path, 'r') as f:
                node_config = json.load(f)
            
            # Extract IP and port from config
            node_ip = node_config.get('ip_address') or os.getenv('NODE_IP', '127.0.0.1')
            node_port = node_config.get('port') or int(os.getenv('NODE_PORT', '5000'))
            
            # Prepare status update with IP:port + public_key
            # This triggers Stage 3 of peer lifecycle: INACTIVE -> ACTIVE
            status_update = {
                'ip_address': node_ip,
                'port': node_port,
                'public_key': self.public_key,
                'node_type': 'validator',
                'timestamp': time.time()
            }
            
            # Try to broadcast to bootstrap node
            self.print_info(f"Broadcasting activation status to {self.bootstrap_url}")
            
            broadcast_url = f"{self.bootstrap_url}/api/v1/network/peers/status-update"
            
            for attempt in range(self.max_retries):
                try:
                    response = requests.post(
                        broadcast_url,
                        json=status_update,
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if result.get('success'):
                            self.print_success("Status update broadcasted successfully!")
                            self.print_success(f"✓ Peer {node_ip}:{node_port} is now ACTIVE")
                            return True
                    
                    self.print_warning(
                        f"Status update failed (attempt {attempt + 1}/{self.max_retries}): "
                        f"HTTP {response.status_code}"
                    )
                
                except requests.exceptions.RequestException as e:
                    self.print_warning(
                        f"Connection error (attempt {attempt + 1}/{self.max_retries}): {str(e)[:50]}"
                    )
                
                # Retry with delay
                if attempt < self.max_retries - 1:
                    self.print_info(f"Retrying in {self.retry_delay} seconds...")
                    time.sleep(self.retry_delay)
            
            self.print_warning("Could not broadcast status to bootstrap node")
            self.print_info("Network will discover your activation through gossip protocol")
            return True  # Non-critical
        
        except Exception as e:
            self.print_warning(f"Error broadcasting status: {e}")
            return True  # Non-critical
    
    def broadcast_signed_activation(self, private_key: str, seed_nodes: list) -> Dict:
        """
        Broadcast SIGNED node activation message to all seed nodes.
        
        This implements Step 1 of the node activation protocol:
        - Create a JSON payload with node identification info
        - Sign the payload with the node's private key
        - Broadcast to all seed nodes
        
        Args:
            private_key: Node's private key (hex format)
            seed_nodes: List of seed nodes from config
            
        Returns:
            dict: Broadcast results with success/failure counts
        """
        self.print_section("Step 5: Broadcasting Signed Activation Message")
        
        try:
            # Load node configuration for IP and port
            config_path = ".node_config.json"
            if not os.path.exists(config_path):
                self.print_warning("Node config not found - skipping signed broadcast")
                return {'success_count': 0, 'failed_count': 0, 'results': []}
            
            with open(config_path, 'r') as f:
                node_config = json.load(f)
            
            node_ip = node_config.get('ip_address', '127.0.0.1')
            node_port = node_config.get('port', 5000)
            
            # Step 1: Create activation payload
            self.print_info("Step 5.1: Creating activation payload...")
            payload = NodeActivationService.create_activation_payload(
                node_id=self.public_key,
                ip=node_ip,
                port=node_port
            )
            self.print_success(f"Payload created: {self.public_key[:16]}... at {node_ip}:{node_port}")
            
            # Step 2: Sign the payload
            self.print_info("Step 5.2: Signing activation payload...")
            signature = NodeActivationService.sign_activation_payload(payload, private_key)
            self.print_success(f"Payload signed: {signature[:32]}...")
            
            # Step 3: Broadcast to seed nodes
            self.print_info("Step 5.3: Broadcasting to seed nodes...")
            results = NodeActivationService.broadcast_activation(
                node_id=self.public_key,
                ip=node_ip,
                port=node_port,
                signature=signature,
                seed_nodes=seed_nodes
            )
            
            # Display results
            self.print_info(f"\nBroadcast Results:")
            self.print_success(f"  ✓ Successful: {results['success_count']}")
            self.print_warning(f"  ✗ Failed: {results['failed_count']}")
            
            for result in results.get('results', []):
                status_emoji = "✓" if result['status'] == 'success' else "✗"
                print(f"    {status_emoji} {result['seed_node']}: {result['message']}")
            
            return results
            
        except Exception as e:
            self.print_error(f"Error broadcasting signed activation: {e}")
            import traceback
            traceback.print_exc()
            return {'success_count': 0, 'failed_count': 0, 'results': [], 'error': str(e)}
    
    # Redundant method removed to avoid duplicate transactions with wrong format
    
    def display_summary(self) -> None:
        """Display activation summary"""
        self.print_header("✅ Node Activated Successfully!")
        
        print(f"""
╔════════════════════════════════════════════════════════════════════╗
║                    VALIDATOR INFORMATION                           ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Status:        🟢 ACTIVE                                          ║
║  Public Key:    {self.public_key[:32]}...                     ║
║  Keystore:      {self.keystore_path}                        ║
║                                                                    ║
║  The validator is now mining blocks according to the consensus    ║
║  schedule. Your node will:                                        ║
║                                                                    ║
║    ✓ Participate in block creation (Round-Robin PoA)              ║
║    ✓ Validate incoming blocks from other validators               ║
║    ✓ Sync blockchain with network peers                           ║
║    ✓ Broadcast transactions and blocks via gossip protocol        ║
║                                                                    ║
╠════════════════════════════════════════════════════════════════════╣
║                    IMPORTANT REMINDERS                             ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ⚠️  Your private key is encrypted in: {self.keystore_path:<10} ║
║  ⚠️  Keep your passphrase safe and secure                         ║
║  ⚠️  Do not share your keystore file with anyone                  ║
║                                                                    ║
╠════════════════════════════════════════════════════════════════════╣
║                    TO DEACTIVATE VALIDATOR                         ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  When you want to stop mining, use:                               ║
║  python deactivate_node.py                                        ║
║                                                                    ║
║  This will safely stop block creation and clear the private key   ║
║  from memory.                                                      ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
""")
    
    def run(self) -> bool:
        """Execute full activation procedure"""
        self.print_header("EduChain Node Activation")
        
        # Step 1: Load keystore
        if not self.load_keystore():
            return False
        
        # Step 2: Get and validate passphrase
        passphrase = self.get_passphrase()
        if not passphrase:
            self.print_error("Activation cancelled - no passphrase provided")
            return False
        
        # Step 3: Unlock private key
        if not self.unlock_private_key(passphrase):
            return False
        
        # Step 4: Activate validator
        if not self.activate_validator():
            return False
        
        # Step 5: Broadcast status update (backward compatibility)
        self.broadcast_peer_status_update()
        
        # Step 6: Load network config for seed nodes
        try:
            network_config_path = os.path.join(
                os.path.dirname(__file__),
                'network',
                'config.json'
            )
            
            if os.path.exists(network_config_path):
                with open(network_config_path, 'r') as f:
                    network_config = json.load(f)
                
                seed_nodes = network_config.get('seed_nodes', [])
                
                if seed_nodes and self.private_key:
                    # Broadcast signed activation to seed nodes
                    self.broadcast_signed_activation(self.private_key, seed_nodes)
            else:
                self.print_info("Network config not found - skipping signed broadcast")
        
        except Exception as e:
            self.print_warning(f"Error in additional activation steps: {e}")
        
        finally:
            # Clean up private key from memory
            if self.private_key:
                KeystoreManager.secure_delete(self.private_key)
                self.private_key = None
        
        # Display summary
        self.display_summary()
        
        return True


def main():
    """Main entry point"""
    try:
        activator = NodeActivator()
        success = activator.run()
        sys.exit(0 if success else 1)
    
    except KeyboardInterrupt:
        print("\n\n❌  Activation cancelled by user")
        sys.exit(1)
    
    except Exception as e:
        print(f"\n❌  Activation failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
