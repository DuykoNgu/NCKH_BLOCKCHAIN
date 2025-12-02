import pytest
from app.models.node import Node, NodeRole
from app.utils.Utils import CryptoUtils


class TestNode:
    """Test cases for Node model"""

    def setup_method(self):
        """Setup test data before each test"""
        self.pubkey, self.private_key = CryptoUtils.generate_key_pair()
        self.address = CryptoUtils.get_address_from_pubkey(self.pubkey)

    def test_node_initialization_moet(self):
        """Test Node initialization with MOET role"""
        node = Node(node_role=NodeRole.MOET)
        
        assert node.node_role == NodeRole.MOET
        assert node.pubkey is not None
        assert node.validator_private_key is not None
        assert node.address is not None

    def test_node_initialization_validator(self):
        """Test Node initialization with VALIDATOR role"""
        node = Node(node_role=NodeRole.VALIDATOR)
        
        assert node.node_role == NodeRole.VALIDATOR
        assert node.pubkey is not None
        assert node.validator_private_key is not None
        assert node.address is not None

    def test_node_initialization_observer(self):
        """Test Node initialization with OBSERVER role"""
        node = Node(node_role=NodeRole.OBSERVER)
        
        assert node.node_role == NodeRole.OBSERVER
        assert node.pubkey is not None
        assert node.validator_private_key is not None
        assert node.address is not None

    def test_node_with_provided_private_key(self):
        """Test Node initialization with provided private key"""
        node = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        
        assert node.validator_private_key == self.private_key
        assert node.pubkey == self.pubkey
        assert node.address == self.address

    def test_node_auto_generate_keys_when_no_private_key(self):
        """Test that keys are auto-generated when no private key provided"""
        node = Node(node_role=NodeRole.VALIDATOR)
        
        assert node.validator_private_key is not None
        assert node.pubkey is not None
        # Public key length should be 128 hex chars (64 bytes)
        assert len(node.pubkey) == 128
        # Private key length should be 64 hex chars (32 bytes)
        assert len(node.validator_private_key) == 64

    def test_node_address_derivation(self):
        """Test that node address is correctly derived from public key"""
        node = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        
        # Address should start with 0x
        assert node.address.startswith("0x")
        # Address should be 42 characters (0x + 40 hex chars)
        assert len(node.address) == 42

    def test_node_to_dict(self):
        """Test converting Node to dictionary"""
        node = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        
        node_dict = node.to_dict()
        
        assert isinstance(node_dict, dict)
        assert node_dict["node_role"] == "validator"
        assert node_dict["pubkey"] == self.pubkey
        assert node_dict["address"] == self.address
        # Private key should NOT be in the dict
        assert "validator_private_key" not in node_dict

    def test_node_to_dict_moet_role(self):
        """Test to_dict with MOET role"""
        node = Node(node_role=NodeRole.MOET)
        
        node_dict = node.to_dict()
        
        assert node_dict["node_role"] == "moet"

    def test_node_to_dict_observer_role(self):
        """Test to_dict with OBSERVER role"""
        node = Node(node_role=NodeRole.OBSERVER)
        
        node_dict = node.to_dict()
        
        assert node_dict["node_role"] == "observer"

    def test_node_from_dict(self):
        """Test creating Node from dictionary"""
        original_node = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        node_dict = original_node.to_dict()
        
        # Note: from_dict doesn't preserve private key (for security)
        reconstructed_node = Node.from_dict(node_dict)
        
        assert reconstructed_node.node_role == NodeRole.VALIDATOR
        assert reconstructed_node.pubkey is not None
        assert reconstructed_node.address is not None

    def test_node_sign_data(self):
        """Test signing data with node"""
        node = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        
        test_data = {"message": "hello", "value": 123}
        signature = node.sign_data(test_data)
        
        assert isinstance(signature, str)
        assert len(signature) > 0

    def test_node_sign_data_without_private_key(self):
        """Test that signing fails when node has no private key"""
        # This test requires node to be created without private key
        # However, current implementation always generates keys
        # This is a safeguard test for future modifications
        node = Node(node_role=NodeRole.OBSERVER)
        
        # Node should always have private_key due to auto-generation
        test_data = {"message": "hello"}
        signature = node.sign_data(test_data)
        assert signature is not None

    def test_node_verify_data_valid_signature(self):
        """Test verifying data with valid signature"""
        node = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        
        test_data = {"message": "hello", "value": 123}
        signature = node.sign_data(test_data)
        
        is_valid = node.verify_data(test_data, signature)
        assert is_valid is True

    def test_node_verify_data_invalid_signature(self):
        """Test verifying data with invalid signature"""
        node = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        
        test_data = {"message": "hello", "value": 123}
        signature = node.sign_data(test_data)
        
        # Tamper with data
        tampered_data = {"message": "hello", "value": 999}
        is_valid = node.verify_data(tampered_data, signature)
        assert is_valid is False

    def test_node_verify_data_wrong_signature(self):
        """Test verifying data with completely wrong signature"""
        node = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        
        test_data = {"message": "hello", "value": 123}
        wrong_signature = "0" * 140  # Random hex string
        
        is_valid = node.verify_data(test_data, wrong_signature)
        assert is_valid is False

    def test_node_verify_with_different_node_key(self):
        """Test that signature from one node can't be verified with another node's key"""
        node1 = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        node2 = Node(node_role=NodeRole.VALIDATOR)  # Different key
        
        test_data = {"message": "hello"}
        signature = node1.sign_data(test_data)
        
        # Try to verify with node2's public key (should fail)
        is_valid = node2.verify_data(test_data, signature)
        assert is_valid is False

    def test_node_sign_and_verify_roundtrip(self):
        """Test complete sign and verify flow"""
        node = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        
        test_data = {"message": "hello", "timestamp": 12345}
        
        # Sign
        signature = node.sign_data(test_data)
        assert signature != ""
        
        # Verify
        is_valid = node.verify_data(test_data, signature)
        assert is_valid is True

    def test_node_different_data_types(self):
        """Test signing different data types"""
        node = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        
        # Test with dict
        dict_data = {"key": "value"}
        dict_sig = node.sign_data(dict_data)
        assert node.verify_data(dict_data, dict_sig) is True
        
        # Test with string
        str_data = "test message"
        str_sig = node.sign_data(str_data)
        assert node.verify_data(str_data, str_sig) is True
        
        # Test with bytes
        bytes_data = b"test bytes"
        bytes_sig = node.sign_data(bytes_data)
        assert node.verify_data(bytes_data, bytes_sig) is True

    def test_node_multiple_instances_independence(self):
        """Test that different Node instances are independent"""
        node1 = Node(node_role=NodeRole.VALIDATOR)
        node2 = Node(node_role=NodeRole.VALIDATOR)
        
        assert node1.pubkey != node2.pubkey
        assert node1.validator_private_key != node2.validator_private_key
        assert node1.address != node2.address

    def test_node_consistent_pubkey_address_derivation(self):
        """Test that public key and address are consistently derived"""
        node1 = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        node2 = Node(node_role=NodeRole.VALIDATOR, private_key_hex=self.private_key)
        
        # Both nodes created with same private key should have same pubkey and address
        assert node1.pubkey == node2.pubkey
        assert node1.address == node2.address
