"""
Configuration Loader for EduChain Network
Loads and validates network configuration from config.json
"""
import json
import os
from typing import Dict, List, Any, Optional


class NetworkConfig:
    """Network configuration manager"""
    
    def __init__(self, config_path: str = None):
        if config_path is None:
            # Default to config.json in network directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(current_dir, 'config.json')
        
        self.config_path = config_path
        self.config: Dict[str, Any] = {}
        self.load_config()
    
    def load_config(self) -> None:
        """Load configuration from JSON file"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
            print(f"✓ Configuration loaded from {self.config_path}")
        except FileNotFoundError:
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in configuration file: {e}")
    
    def get_network_config(self) -> Dict[str, Any]:
        """Get network configuration"""
        return self.config.get('network', {})
    
    def get_seed_nodes(self) -> List[Dict[str, Any]]:
        """Get list of seed nodes"""
        return self.config.get('seed_nodes', [])
    
    def get_whitelist(self) -> Dict[str, Any]:
        """Get whitelist configuration"""
        return self.config.get('whitelist', {})
    
    def get_authorized_validators(self) -> List[str]:
        """Get list of authorized validator public keys"""
        whitelist = self.get_whitelist()
        return whitelist.get('authorized_validators', [])
    
    def is_whitelist_enabled(self) -> bool:
        """Check if whitelist is enabled"""
        whitelist = self.get_whitelist()
        return whitelist.get('enabled', True)
    
    def get_gossip_config(self) -> Dict[str, Any]:
        """Get gossip protocol configuration"""
        return self.config.get('gossip', {})
    
    def get_ntp_config(self) -> Dict[str, Any]:
        """Get NTP configuration"""
        return self.config.get('ntp', {})
    
    def get_consensus_config(self) -> Dict[str, Any]:
        """Get consensus configuration"""
        return self.config.get('consensus', {})
    
    def get_slot_duration(self) -> int:
        """Get slot duration in seconds"""
        consensus = self.get_consensus_config()
        return consensus.get('slot_duration', 5)
    
    def get_node_id(self) -> str:
        """Get current node ID"""
        network = self.get_network_config()
        return network.get('node_id', '')
    
    def get_max_peers(self) -> int:
        """Get maximum allowed peers"""
        network = self.get_network_config()
        return network.get('max_peers', 2)
    
    def set_node_id(self, node_id: str) -> None:
        """Set node ID and save to config"""
        if 'network' not in self.config:
            self.config['network'] = {}
        self.config['network']['node_id'] = node_id
        self.save_config()
    
    def save_config(self) -> None:
        """Save configuration to file"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            print(f"✓ Configuration saved to {self.config_path}")
        except Exception as e:
            print(f"✗ Failed to save configuration: {e}")
    
    def validate_config(self) -> bool:
        """Validate configuration structure"""
        required_sections = ['network', 'seed_nodes', 'whitelist', 'gossip', 'ntp', 'consensus']
        
        for section in required_sections:
            if section not in self.config:
                print(f"✗ Missing required section: {section}")
                return False
        
        # Validate seed nodes
        seed_nodes = self.get_seed_nodes()
        if not seed_nodes:
            print("⚠ Warning: No seed nodes configured")
        
        for node in seed_nodes:
            if not all(key in node for key in ['name', 'ip', 'port', 'public_key']):
                print(f"✗ Invalid seed node configuration: {node}")
                return False
        
        print("✓ Configuration validation passed")
        return True


# Global configuration instance
_config_instance: Optional[NetworkConfig] = None


def get_config() -> NetworkConfig:
    """Get global configuration instance (singleton pattern)"""
    global _config_instance
    if _config_instance is None:
        _config_instance = NetworkConfig()
    return _config_instance


def reload_config() -> NetworkConfig:
    """Reload configuration from file"""
    global _config_instance
    _config_instance = NetworkConfig()
    return _config_instance


if __name__ == "__main__":
    # Test configuration loading
    config = NetworkConfig()
    if config.validate_config():
        print("\n=== Network Configuration ===")
        print(f"Node Type: {config.get_network_config().get('node_type')}")
        print(f"Listen Port: {config.get_network_config().get('listen_port')}")
        print(f"Seed Nodes: {len(config.get_seed_nodes())}")
        print(f"Whitelist Enabled: {config.is_whitelist_enabled()}")
        print(f"Slot Duration: {config.get_slot_duration()}s")
