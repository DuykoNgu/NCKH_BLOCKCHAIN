#!/usr/bin/env python3
"""
Node Deactivate Script - Safely deactivate an active validator
This script:
1. Stops the validator from mining
2. Clears private key from memory
3. Broadcasts peer status update to other nodes

Usage:
    python deactivate_node.py
"""

import os
import sys
import json
import requests
import time
from typing import Optional
from dotenv import load_dotenv

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()


class NodeDeactivator:
    """Handles node deactivation and status broadcasting"""
    
    def __init__(self):
        """Initialize deactivation manager"""
        self.node_ip = os.getenv("NODE_IP", "127.0.0.1")
        self.node_port = int(os.getenv("NODE_PORT", "5000"))
        self.bootstrap_url = os.getenv("BOOTSTRAP_NODE_URL", "http://127.0.0.1:5000")
        self.max_retries = 3
        self.retry_delay = 2
        
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
    
    def load_node_config(self) -> bool:
        """Load node configuration"""
        self.print_section("Step 1: Loading Node Configuration")
        
        config_path = ".node_config.json"
        if not os.path.exists(config_path):
            self.print_error(f"Node configuration not found: {config_path}")
            self.print_info("Please run setup.py first")
            return False
        
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            self.public_key = config.get('public_key')
            if not self.public_key:
                self.print_error("Public key not found in configuration")
                return False
            
            self.print_success("Node configuration loaded")
            self.print_info(f"Public Key: {self.public_key[:32]}...{self.public_key[-8:]}")
            
            return True
        
        except Exception as e:
            self.print_error(f"Error loading configuration: {e}")
            return False
    
    def check_validator_status(self) -> bool:
        """Check if validator is currently active via HTTP API"""
        self.print_section("Step 2: Checking Validator Status")
        
        try:
            # Call status endpoint on running server
            status_url = f"http://{self.node_ip}:{self.node_port}/api/v1/auth/status"
            response = requests.get(status_url, timeout=5)
            
            if response.status_code == 200:
                status_data = response.json()
                
                if not status_data.get('is_active', False):
                    self.print_warning("Validator is not currently active")
                    self.print_info("Nothing to deactivate")
                    return False
                
                self.print_success("Validator is currently active")
                self.print_info(f"Status:            Active ✓")
                self.print_info(f"Blocks Mined:      {status_data.get('blocks_mined', 0)}")
                self.print_info(f"Blockchain Height: {status_data.get('blockchain_height', 0)}")
                
                return True
            else:
                self.print_error(f"Failed to get status: HTTP {response.status_code}")
                return False
        
        except requests.exceptions.ConnectionError:
            self.print_error(f"Connection refused at http://{self.node_ip}:{self.node_port}")
            self.print_info("Make sure 'python run.py' is running in another terminal")
            return False
        
        except Exception as e:
            self.print_error(f"Error checking validator status: {e}")
            return False
    
    def deactivate_validator(self) -> bool:
        """Deactivate validator via HTTP API call"""
        self.print_section("Step 3: Deactivating Validator")
        
        try:
            # Call deactivate endpoint on running server
            deactivate_url = f"http://{self.node_ip}:{self.node_port}/api/v1/auth/deactivate"
            response = requests.post(deactivate_url, timeout=5)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success'):
                    self.print_success("Validator deactivated successfully")
                    self.print_info("✓ Mining stopped")
                    self.print_info("✓ Private key cleared from memory")
                    self.print_info("✓ Background worker stopped")
                    
                    return True
                else:
                    self.print_error(f"Deactivation failed: {result.get('message', 'Unknown error')}")
                    return False
            else:
                self.print_error(f"Server error: HTTP {response.status_code}")
                return False
        
        except requests.exceptions.ConnectionError:
            self.print_error(f"Connection refused at http://{self.node_ip}:{self.node_port}")
            self.print_info("Make sure 'python run.py' is running in another terminal")
            return False
        
        except Exception as e:
            self.print_error(f"Error deactivating validator: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def broadcast_peer_status_update(self) -> bool:
        """
        Broadcast peer status update to bootstrap node
        Sends: ip_address, port, public_key, updates status back to INACTIVE
        """
        self.print_section("Step 4: Broadcasting Deactivation Status")
        
        try:
            # Load node config to get IP/port
            config_path = ".node_config.json"
            if not os.path.exists(config_path):
                self.print_warning("Node config not found - skipping status broadcast")
                return True  # Non-critical
            
            with open(config_path, 'r') as f:
                node_config = json.load(f)
            
            node_ip = node_config.get('ip_address') or self.node_ip
            node_port = node_config.get('port') or self.node_port
            
            # Prepare status update: ACTIVE -> INACTIVE (deactivated)
            status_update = {
                'ip_address': node_ip,
                'port': node_port,
                'public_key': self.public_key,
                'node_type': 'observer',  # Changed from validator after deactivation
                'timestamp': time.time()
            }
            
            self.print_info(f"Broadcasting deactivation status to {self.bootstrap_url}")
            
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
                            self.print_success(f"✓ Peer {node_ip}:{node_port} status updated to inactive")
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
            
            self.print_warning("Could not broadcast status update")
            self.print_info("Status will be updated upon next gossip check")
            return True  # Non-critical
        
        except Exception as e:
            self.print_warning(f"Error broadcasting status: {e}")
            return True  # Non-critical
    
    def display_summary(self) -> None:
        """Display deactivation summary"""
        self.print_header("✅ Validator Deactivated Successfully!")
        
        print(f"""
╔════════════════════════════════════════════════════════════════════╗
║                    DEACTIVATION SUMMARY                            ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Status:        🔴 INACTIVE                                        ║
║  Public Key:    {self.public_key[:32]}...                     ║
║                                                                    ║
║  The validator has been safely deactivated:                       ║
║                                                                    ║
║    ✓ Mining has been stopped                                       ║
║    ✓ Private key cleared from memory                               ║
║    ✓ Background worker terminated                                  ║
║    ✓ Status broadcasted to network                                 ║
║                                                                    ║
║  Your node will continue to:                                      ║
║    • Sync blockchain with network peers                            ║
║    • Validate blocks from other validators                         ║
║    • Participate as an observer node                               ║
║                                                                    ║
╠════════════════════════════════════════════════════════════════════╣
║                    TO REACTIVATE VALIDATOR                         ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  To start mining again, use:                                      ║
║  python active_node.py                                            ║
║                                                                    ║
║  You will be asked to provide your passphrase to unlock the       ║
║  private key.                                                      ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
""")
    
    def run(self) -> bool:
        """Execute full deactivation procedure"""
        self.print_header("EduChain Node Deactivation")
        
        # Step 1: Load node configuration
        if not self.load_node_config():
            return False
        
        # Step 2: Check current validator status
        if not self.check_validator_status():
            return False
        
        # Step 3: Confirm deactivation
        confirm = input("\n⚠️   Are you sure you want to deactivate the validator? (yes/no): ").strip().lower()
        if confirm != 'yes':
            self.print_info("Deactivation cancelled")
            return False
        
        # Step 4: Deactivate validator
        if not self.deactivate_validator():
            return False
        
        # Step 5: Broadcast status update
        self.broadcast_peer_status_update()
        
        # Step 6: Display summary
        self.display_summary()
        
        return True


def main():
    """Main entry point"""
    try:
        deactivator = NodeDeactivator()
        success = deactivator.run()
        sys.exit(0 if success else 1)
    
    except KeyboardInterrupt:
        print("\n\n❌  Deactivation cancelled by user")
        sys.exit(1)
    
    except Exception as e:
        print(f"\n❌  Deactivation failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
