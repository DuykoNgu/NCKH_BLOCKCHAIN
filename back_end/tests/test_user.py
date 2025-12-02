import pytest
from app.models.User import User, UserRole
from app.utils.Utils import CryptoUtils


class TestUser:
    """Test cases for User model"""

    def setup_method(self):
        """Setup test data before each test"""
        self.pubkey = "0x1234567890abcdef"
        self.address = "0xabcdef1234567890"
        self.user_id = "user123"
        self.role = UserRole.CLIENT
        self.password = "secure_password_123"

    def test_user_initialization(self):
        """Test User object initialization"""
        user = User(
            pubkey=self.pubkey,
            address=self.address,
            user_id=self.user_id,
            role=self.role,
            password=self.password
        )
        
        assert user.pubkey == self.pubkey
        assert user.address == self.address
        assert user.user_id == self.user_id
        assert user.role == self.role
        assert user.password == self.password

    def test_user_to_dict(self):
        """Test converting User object to dictionary"""
        user = User(
            pubkey=self.pubkey,
            address=self.address,
            user_id=self.user_id,
            role=self.role,
            password=self.password
        )
        
        user_dict = user.to_dict()
        
        assert isinstance(user_dict, dict)
        assert user_dict["pubkey"] == self.pubkey
        assert user_dict["address"] == self.address
        assert user_dict["user_id"] == self.user_id
        assert user_dict["role"] == self.role.value
        assert user_dict["password"] == self.password

    def test_user_from_dict(self):
        """Test creating User object from dictionary"""
        user_data = {
            "pubkey": self.pubkey,
            "address": self.address,
            "user_id": self.user_id,
            "role": self.role,
            "password": self.password
        }
        
        user = User.from_dict(user_data)
        
        assert user.pubkey == self.pubkey
        assert user.address == self.address
        assert user.user_id == self.user_id
        assert user.role == self.role
        assert user.password == self.password

    def test_user_with_admin_role(self):
        """Test User with ADMIN role"""
        user = User(
            pubkey=self.pubkey,
            address=self.address,
            user_id=self.user_id,
            role=UserRole.ADMIN,
            password=self.password
        )
        
        assert user.role == UserRole.ADMIN
        assert user.to_dict()["role"] == "admin"

    def test_user_with_validator_role(self):
        """Test User with VALIDATOR role"""
        user = User(
            pubkey=self.pubkey,
            address=self.address,
            user_id=self.user_id,
            role=UserRole.VALIDATOR,
            password=self.password
        )
        
        assert user.role == UserRole.VALIDATOR
        assert user.to_dict()["role"] == "validator"

    def test_user_with_client_role(self):
        """Test User with CLIENT role"""
        user = User(
            pubkey=self.pubkey,
            address=self.address,
            user_id=self.user_id,
            role=UserRole.CLIENT,
            password=self.password
        )
        
        assert user.role == UserRole.CLIENT
        assert user.to_dict()["role"] == "client"

    def test_user_to_dict_and_from_dict_roundtrip(self):
        """Test converting User to dict and back maintains data integrity"""
        original_user = User(
            pubkey=self.pubkey,
            address=self.address,
            user_id=self.user_id,
            role=self.role,
            password=self.password
        )
        
        # Convert to dict and back
        user_dict = original_user.to_dict()
        reconstructed_user = User.from_dict(user_dict)
        
        # Verify all attributes match
        assert reconstructed_user.pubkey == original_user.pubkey
        assert reconstructed_user.address == original_user.address
        assert reconstructed_user.user_id == original_user.user_id
        assert reconstructed_user.role == original_user.role
        assert reconstructed_user.password == original_user.password

    def test_user_different_instances_independence(self):
        """Test that different User instances are independent"""
        user1 = User(
            pubkey=self.pubkey,
            address=self.address,
            user_id="user1",
            role=UserRole.CLIENT,
            password="password1"
        )
        
        user2 = User(
            pubkey="0x9876543210fedcba",
            address="0xfedcba9876543210",
            user_id="user2",
            role=UserRole.ADMIN,
            password="password2"
        )
        
        assert user1.user_id != user2.user_id
        assert user1.pubkey != user2.pubkey
        assert user1.role != user2.role

    def test_user_create_from_private_key(self):
        """Test creating User from private key"""
        user_id = "user_private_123"
        private_key_hex, _ = CryptoUtils.generate_key_pair()
        # Note: generate_key_pair returns (public_key, private_key)
        private_key_hex = CryptoUtils.generate_key_pair()[1]
        
        user = User.create_from_private_key(
            user_id=user_id,
            private_key_hex=private_key_hex,
            role=UserRole.VALIDATOR,
            password="secure_pass"
        )
        
        assert user.user_id == user_id
        assert user.pubkey is not None
        assert user.address is not None
        assert user.role == UserRole.VALIDATOR
        assert user.password == "secure_pass"

    def test_user_create_from_private_key_derived_pubkey(self):
        """Test that public key is correctly derived from private key"""
        private_key_hex = CryptoUtils.generate_key_pair()[1]
        expected_pubkey = CryptoUtils.get_public_key_from_private(private_key_hex)
        
        user = User.create_from_private_key(
            user_id="user_test",
            private_key_hex=private_key_hex,
            role=UserRole.CLIENT,
            password="pass"
        )
        
        assert user.pubkey == expected_pubkey

    def test_user_create_from_private_key_derived_address(self):
        """Test that address is correctly derived from public key"""
        private_key_hex = CryptoUtils.generate_key_pair()[1]
        pubkey = CryptoUtils.get_public_key_from_private(private_key_hex)
        expected_address = CryptoUtils.get_address_from_pubkey(pubkey)
        
        user = User.create_from_private_key(
            user_id="user_test",
            private_key_hex=private_key_hex,
            role=UserRole.CLIENT,
            password="pass"
        )
        
        assert user.address == expected_address

    def test_user_create_from_private_key_admin_role(self):
        """Test creating User with ADMIN role from private key"""
        private_key_hex = CryptoUtils.generate_key_pair()[1]
        
        user = User.create_from_private_key(
            user_id="admin_user",
            private_key_hex=private_key_hex,
            role=UserRole.ADMIN,
            password="admin_pass"
        )
        
        assert user.role == UserRole.ADMIN
        assert user.to_dict()["role"] == "admin"

    def test_user_create_from_private_key_roundtrip(self):
        """Test creating user from private key and converting back to dict"""
        private_key_hex = CryptoUtils.generate_key_pair()[1]
        original_user_id = "user_roundtrip"
        original_password = "test_password_123"
        
        user = User.create_from_private_key(
            user_id=original_user_id,
            private_key_hex=private_key_hex,
            role=UserRole.CLIENT,
            password=original_password
        )
        
        # Convert to dict and back
        user_dict = user.to_dict()
        reconstructed_user = User.from_dict(user_dict)
        
        # Verify all attributes match
        assert reconstructed_user.user_id == original_user_id
        assert reconstructed_user.pubkey == user.pubkey
        assert reconstructed_user.address == user.address
        assert reconstructed_user.role == UserRole.CLIENT
        assert reconstructed_user.password == original_password

    def test_user_create_from_private_key_multiple_calls_same_key(self):
        """Test that same private key produces same public key and address"""
        private_key_hex = CryptoUtils.generate_key_pair()[1]
        
        user1 = User.create_from_private_key(
            user_id="user1",
            private_key_hex=private_key_hex,
            role=UserRole.CLIENT,
            password="pass1"
        )
        
        user2 = User.create_from_private_key(
            user_id="user2",
            private_key_hex=private_key_hex,
            role=UserRole.VALIDATOR,
            password="pass2"
        )
        
        # Same private key should produce same public key and address
        assert user1.pubkey == user2.pubkey
        assert user1.address == user2.address
        # But different user_ids and passwords
        assert user1.user_id != user2.user_id
        assert user1.password != user2.password
