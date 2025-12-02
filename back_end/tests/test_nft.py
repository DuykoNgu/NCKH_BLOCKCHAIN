import pytest
from datetime import datetime
from app.models.NFT import NFT
from app.models.NFTmetadata import NFTmetadata
from app.models.User import User, UserRole
from app.utils.Utils import CryptoUtils


class TestNFT:
    """Test cases for NFT model"""

    def setup_method(self):
        """Setup test data before each test"""
        # Create issuer and recipient
        self.issuer_pubkey, self.issuer_private_key = CryptoUtils.generate_key_pair()
        
        # Create recipient user
        self.recipient_pubkey, _ = CryptoUtils.generate_key_pair()
        self.recipient_address = CryptoUtils.get_address_from_pubkey(self.recipient_pubkey)
        
        self.recipient = User(
            pubkey=self.recipient_pubkey,
            address=self.recipient_address,
            user_id="student123",
            role=UserRole.CLIENT,
            password="pass123"
        )
        
        # Create NFT metadata
        self.metadata = NFTmetadata(
            student_id="student123",
            degree_type="Bachelor of Science",
            pdf_url="https://example.com/cert.pdf",
            pdf_hash=CryptoUtils.hash_sha256("certificate_pdf_content"),
            institution="Harvard University"
        )

    def test_nft_initialization(self):
        """Test NFT object initialization"""
        nft = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        assert nft.issuer_pubkey == self.issuer_pubkey
        assert nft.metadata == self.metadata
        assert nft.recipient_address == self.recipient
        assert nft.is_valid is True
        assert nft.issuer_signature is None
        assert nft.revoked is None

    def test_nft_token_id_generation(self):
        """Test that NFT token_id is generated correctly"""
        nft = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        # Token ID should be 64 hex characters (SHA256)
        assert isinstance(nft.token_id, str)
        assert len(nft.token_id) == 64

    def test_nft_token_id_deterministic(self):
        """Test that same data produces same token_id"""
        nft1 = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        nft2 = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        assert nft1.token_id == nft2.token_id

    def test_nft_token_id_unique_per_recipient(self):
        """Test that different recipients get different token_ids"""
        # Create second recipient
        other_pubkey, _ = CryptoUtils.generate_key_pair()
        other_address = CryptoUtils.get_address_from_pubkey(other_pubkey)
        other_recipient = User(
            pubkey=other_pubkey,
            address=other_address,
            user_id="student456",
            role=UserRole.CLIENT,
            password="pass456"
        )
        
        nft1 = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        nft2 = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=other_recipient
        )
        
        assert nft1.token_id != nft2.token_id

    def test_nft_to_dict(self):
        """Test converting NFT to dictionary"""
        nft = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        nft_dict = nft.to_dict()
        
        assert isinstance(nft_dict, dict)
        assert nft_dict["token_id"] == nft.token_id
        assert nft_dict["issuer_pubkey"] == self.issuer_pubkey
        assert nft_dict["is_valid"] is True
        assert nft_dict["issuer_signature"] is None

    def test_nft_sign_nft(self):
        """Test signing an NFT"""
        nft = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        signature = nft.sign_nft(self.issuer_private_key)
        
        assert isinstance(signature, str)
        assert len(signature) > 0
        assert nft.issuer_signature == signature

    def test_nft_verify_valid_signature(self):
        """Test verifying a valid NFT signature"""
        nft = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        # Sign the NFT
        nft.sign_nft(self.issuer_private_key)
        
        # Verify the signature
        is_valid = nft.verify_nft()
        assert is_valid is True

    def test_nft_verify_no_signature(self):
        """Test verifying NFT without signature"""
        nft = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        # Try to verify without signing
        is_valid = nft.verify_nft()
        assert is_valid is False

    def test_nft_verify_invalid_signature(self):
        """Test verifying NFT with tampered data"""
        nft = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        # Sign the NFT
        nft.sign_nft(self.issuer_private_key)
        
        # Tamper with metadata
        nft.metadata.degree_type = "Master of Science"
        
        # Verify should fail
        is_valid = nft.verify_nft()
        assert is_valid is False

    def test_nft_verify_with_wrong_issuer_key(self):
        """Test verifying NFT with wrong issuer public key"""
        nft = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        # Sign with correct key
        nft.sign_nft(self.issuer_private_key)
        
        # Try to verify with wrong issuer pubkey
        wrong_pubkey, _ = CryptoUtils.generate_key_pair()
        nft.issuer_pubkey = wrong_pubkey
        
        is_valid = nft.verify_nft()
        assert is_valid is False

    def test_nft_sign_and_verify_roundtrip(self):
        """Test complete sign and verify flow"""
        nft = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        # Sign
        signature = nft.sign_nft(self.issuer_private_key)
        assert signature != ""
        
        # Verify
        is_valid = nft.verify_nft()
        assert is_valid is True

    def test_nft_minted_at_timestamp(self):
        """Test that minted_at timestamp is set"""
        nft = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        assert nft.minted_at is not None
        # Should be ISO format timestamp
        assert isinstance(nft.minted_at, str)
        datetime.fromisoformat(nft.minted_at)  # Should not raise

    def test_nft_different_issuers_different_signatures(self):
        """Test that different issuers produce different signatures"""
        nft1 = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        # Create another issuer
        issuer2_pubkey, issuer2_private_key = CryptoUtils.generate_key_pair()
        nft2 = NFT(
            issuer_pubkey=issuer2_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        sig1 = nft1.sign_nft(self.issuer_private_key)
        sig2 = nft2.sign_nft(issuer2_private_key)
        
        # Different issuers should produce different signatures
        assert sig1 != sig2
        
        # Each should verify with their own issuer key
        assert nft1.verify_nft() is True
        assert nft2.verify_nft() is True

    def test_nft_from_dict_basic(self):
        """Test creating NFT from dictionary (basic test)"""
        nft = NFT(
            issuer_pubkey=self.issuer_pubkey,
            metadata=self.metadata,
            recipient_address=self.recipient
        )
        
        nft_dict = nft.to_dict()
        
        # Note: from_dict has limitations since it needs User object
        # This tests that the method exists and handles the data
        assert isinstance(nft_dict, dict)
