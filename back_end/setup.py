#!/usr/bin/env python3
"""
Node Setup Script - Initialize a new node in the EduChain network
This script:
1. Creates a secured keystore (private key encrypted with passphrase)
2. Registers the node as a peer in the network
3. Broadcasts peer information to other nodes

Usage:
    python setup.py
"""

import os
import sys
import json
import getpass
import requests
from typing import Optional, Tuple
from dotenv import load_dotenv

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.utils.KeystoreManager import KeystoreManager, create_keystore

# Load environment variables
load_dotenv()


class NodeSetup:
    """Handles node initialization and peer registration"""
    
    def __init__(self):
        """Initialize setup manager"""
        self.keystore_path = os.getenv("KEYSTORE_PATH", "node.keystore")
        self.node_ip = os.getenv("NODE_IP", "127.0.0.1")
        self.node_port = int(os.getenv("NODE_PORT", "5000"))
        self.node_type = os.getenv("NODE_TYPE", "validator")
        self.bootstrap_url = os.getenv("BOOTSTRAP_NODE_URL", "http://127.0.0.1:5000")
        
        self.public_key: Optional[str] = None
        self.address: Optional[str] = None
    
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
    
    def check_keystore_exists(self) -> bool:
        """Check if keystore already exists"""
        if os.path.exists(self.keystore_path):
            self.print_warning(f"Keystore already exists: {self.keystore_path}")
            response = input("Do you want to regenerate it? (yes/no): ").strip().lower()
            return response != 'yes'
        return False
    
    def get_passphrase(self) -> Optional[str]:
        """Get and validate passphrase from user"""
        self.print_section("Step 1: Set Passphrase for Keystore")
        self.print_info("Passphrase requirements:")
        self.print_info("  - Minimum 8 characters")
        self.print_info("  - Maximum 128 characters")
        self.print_info("  - Must contain letters AND numbers")
        self.print_info("  - Keep this safe! You'll need it to activate the node")
        
        while True:
            passphrase = getpass.getpass("\nEnter passphrase: ")
            
            # Validate passphrase
            is_valid, error_msg = KeystoreManager.validate_passphrase(passphrase)
            if not is_valid:
                self.print_error(f"Invalid passphrase: {error_msg}")
                continue
            
            # Confirm passphrase
            passphrase_confirm = getpass.getpass("Confirm passphrase: ")
            if passphrase != passphrase_confirm:
                self.print_error("Passphrases do not match!")
                continue
            
            self.print_success("Passphrase accepted!")
            return passphrase
    
    def create_node_keystore(self, passphrase: str) -> bool:
        """Create keystore file"""
        self.print_section("Step 2: Generating Keystore")
        
        # Warn if keystore exists
        if self.check_keystore_exists():
            return False
        
        try:
            # Generate keypair and encrypt
            private_key_hex, public_key_hex, address = self._generate_and_encrypt_key(passphrase)
            
            self.public_key = public_key_hex
            self.address = address
            
            # Create keystore data
            keystore_data = KeystoreManager.encrypt_private_key(private_key_hex, passphrase)
            keystore_data['public_key'] = public_key_hex
            keystore_data['address'] = address
            keystore_data['node_type'] = self.node_type
            keystore_data['created_at'] = int(os.times()[4])  # Timestamp
            
            # Save keystore file
            if KeystoreManager.save_keystore(self.keystore_path, keystore_data):
                self.print_success(f"Keystore created: {self.keystore_path}")
                self.print_info(f"Public Key:  {public_key_hex[:32]}...{public_key_hex[-8:]}")
                self.print_info(f"Address:     {address}")
                
                # Secure delete
                KeystoreManager.secure_delete(private_key_hex)
                KeystoreManager.secure_delete(passphrase)
                
                return True
            else:
                self.print_error("Failed to save keystore")
                return False
        
        except Exception as e:
            self.print_error(f"Failed to create keystore: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _generate_and_encrypt_key(self, passphrase: str) -> Tuple[str, str, str]:
        """Generate key pair"""
        from app.utils.KeystoreManager import generate_keypair
        
        self.print_info("Generating ECDSA SECP256k1 keypair...")
        private_key_hex, public_key_hex, address = generate_keypair()
        self.print_success("Keypair generated successfully")
        
        return private_key_hex, public_key_hex, address
    
    def get_node_config(self) -> dict:
        """Get node configuration from environment"""
        self.print_section("Step 3: Node Configuration")
        
        config = {
            'ip_address': self.node_ip,
            'port': self.node_port,
            'node_type': self.node_type,
            'public_key': self.public_key,
            'address': self.address
        }
        
        self.print_info(f"Node IP:     {config['ip_address']}")
        self.print_info(f"Node Port:   {config['port']}")
        self.print_info(f"Node Type:   {config['node_type']}")
        
        return config
    
    def register_peer_with_network(self, config: dict) -> bool:
        """Register peer with bootstrap node"""
        self.print_section("Step 4: Registering Peer with Network")
        
        try:
            # Prepare peer registration data
            peer_data = {
                'ip_address': config['ip_address'],
                'port': config['port'],
                'public_key': config['public_key'],
                'node_type': config['node_type']
            }
            
            self.print_info(f"Connecting to bootstrap node: {self.bootstrap_url}")
            
            # Register with bootstrap node
            register_url = f"{self.bootstrap_url}/api/v1/network/peers/register"
            response = requests.post(register_url, json=peer_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.print_success("✔ Peer registered successfully!")
                    
                    peer_info = result.get('peer', {})
                    self.print_info(f"Peer ID:     {peer_info.get('peer_id', 'N/A')[:16]}")
                    self.print_info(f"Status:      {peer_info.get('status', 'PENDING')}")
                    
                    return True
                else:
                    self.print_error(f"Peer registration rejected: {result.get('error', 'Unknown error')}")
                    return False
            else:
                self.print_error(f"Failed to register peer: HTTP {response.status_code}")
                error_detail = response.text
                if error_detail:
                    self.print_error(f"Details: {error_detail}")
                return False
        
        except requests.exceptions.ConnectionError:
            self.print_warning(f"Could not connect to bootstrap node at {self.bootstrap_url}")
            self.print_warning("Node will run in standalone mode. You can register manually later.")
            return True  # Don't fail setup if bootstrap is down
        
        except Exception as e:
            self.print_error(f"Error during peer registration: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def save_node_config(self, config: dict) -> bool:
        """Save node configuration to file"""
        try:
            config_path = ".node_config.json"
            config['keystore_path'] = self.keystore_path
            
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            self.print_success(f"Node configuration saved: {config_path}")
            return True
        
        except Exception as e:
            self.print_error(f"Failed to save node config: {e}")
            return False
    
    def run(self):
        """Execute full setup procedure"""
        self.print_header("EduChain Node Setup")
        
        # Step 1: Check if keystore exists
        if self.check_keystore_exists():
            self.print_warning("Aborting setup - using existing keystore")
            return False
        
        # Step 2: Get passphrase from user
        passphrase = self.get_passphrase()
        if not passphrase:
            self.print_error("Setup cancelled - no passphrase provided")
            return False
        
        # Step 3: Create keystore
        if not self.create_node_keystore(passphrase):
            self.print_error("Setup failed - could not create keystore")
            return False
        
        # Step 4: Get node configuration
        config = self.get_node_config()
        
        # Step 5: Register peer with network
        if not self.register_peer_with_network(config):
            self.print_warning("Could not register with bootstrap node")
            self.print_info("You will need to register manually or try again later")
        
        # Step 6: Save configuration
        if not self.save_node_config(config):
            self.print_warning("Failed to save configuration")
        
        self.print_header("✅ Node Setup Complete!")
        self.print_info(f"\nNext steps:")
        self.print_info(f"1. Start the node: python run.py")
        self.print_info(f"2. Activate as validator: python active_node.py")
        self.print_info(f"\nKeystore location: {self.keystore_path}")
        self.print_info(f"Keep your passphrase safe - you'll need it to activate the node!\n")
        
        return True


def main():
    """Main entry point"""
    try:
        setup = NodeSetup()
        success = setup.run()
        sys.exit(0 if success else 1)
    
    except KeyboardInterrupt:
        print("\n\n❌  Setup cancelled by user")
        sys.exit(1)
    
    except Exception as e:
        print(f"\n❌  Setup failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
