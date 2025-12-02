import pytest
from datetime import datetime
from app.models.NFTmetadata import NFTmetadata
from app.utils.Utils import CryptoUtils


class TestNFTmetadata:
    """Test cases for NFTmetadata model"""

    def setup_method(self):
        """Setup test data before each test"""
        self.student_id = "student123"
        self.degree_type = "Bachelor of Science"
        self.pdf_url = "https://example.com/cert.pdf"
        self.pdf_hash = CryptoUtils.hash_sha256("certificate_pdf_content")
        self.institution = "Harvard University"

    def test_nftmetadata_initialization(self):
        """Test NFTmetadata object initialization"""
        metadata = NFTmetadata(
            student_id=self.student_id,
            degree_type=self.degree_type,
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution=self.institution
        )
        
        assert metadata.student_id == self.student_id
        assert metadata.degree_type == self.degree_type
        assert metadata.pdf_url == self.pdf_url
        assert metadata.pdf_hash == self.pdf_hash
        assert metadata.institution == self.institution

    def test_nftmetadata_issued_at_auto_timestamp(self):
        """Test that issued_at is automatically set with current timestamp"""
        metadata = NFTmetadata(
            student_id=self.student_id,
            degree_type=self.degree_type,
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution=self.institution
        )
        
        assert metadata.issued_at is not None
        # Should be ISO format timestamp
        assert isinstance(metadata.issued_at, str)
        datetime.fromisoformat(metadata.issued_at)  # Should not raise

    def test_nftmetadata_issued_at_custom(self):
        """Test that custom issued_at can be provided"""
        custom_timestamp = "2024-01-15T10:30:00"
        metadata = NFTmetadata(
            student_id=self.student_id,
            degree_type=self.degree_type,
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution=self.institution,
            issued_at=custom_timestamp
        )
        
        assert metadata.issued_at == custom_timestamp

    def test_nftmetadata_to_dict(self):
        """Test converting NFTmetadata to dictionary"""
        metadata = NFTmetadata(
            student_id=self.student_id,
            degree_type=self.degree_type,
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution=self.institution
        )
        
        metadata_dict = metadata.to_dict()
        
        assert isinstance(metadata_dict, dict)
        assert metadata_dict["student_id"] == self.student_id
        assert metadata_dict["degree_type"] == self.degree_type
        assert metadata_dict["pdf_url"] == self.pdf_url
        assert metadata_dict["pdf_hash"] == self.pdf_hash
        assert metadata_dict["institution"] == self.institution
        assert "issued_at" in metadata_dict

    def test_nftmetadata_from_dict(self):
        """Test creating NFTmetadata from dictionary"""
        data = {
            "student_id": self.student_id,
            "degree_type": self.degree_type,
            "pdf_url": self.pdf_url,
            "pdf_hash": self.pdf_hash,
            "institution": self.institution
        }
        
        metadata = NFTmetadata.from_dict(data)
        
        assert metadata.student_id == self.student_id
        assert metadata.degree_type == self.degree_type
        assert metadata.pdf_url == self.pdf_url
        assert metadata.pdf_hash == self.pdf_hash
        assert metadata.institution == self.institution

    def test_nftmetadata_to_dict_and_from_dict_roundtrip(self):
        """Test converting to dict and back maintains data integrity"""
        original = NFTmetadata(
            student_id=self.student_id,
            degree_type=self.degree_type,
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution=self.institution
        )
        
        # Convert to dict and back
        metadata_dict = original.to_dict()
        reconstructed = NFTmetadata.from_dict(metadata_dict)
        
        # Verify all attributes match
        assert reconstructed.student_id == original.student_id
        assert reconstructed.degree_type == original.degree_type
        assert reconstructed.pdf_url == original.pdf_url
        assert reconstructed.pdf_hash == original.pdf_hash
        assert reconstructed.institution == original.institution

    def test_nftmetadata_hash_metadata(self):
        """Test hashing metadata"""
        metadata = NFTmetadata(
            student_id=self.student_id,
            degree_type=self.degree_type,
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution=self.institution
        )
        
        metadata_hash = metadata.hash_metadata()
        
        # Hash should be 64 hex characters (SHA256)
        assert isinstance(metadata_hash, str)
        assert len(metadata_hash) == 64

    def test_nftmetadata_hash_deterministic(self):
        """Test that same metadata produces same hash"""
        metadata1 = NFTmetadata(
            student_id=self.student_id,
            degree_type=self.degree_type,
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution=self.institution,
            issued_at="2024-01-15T10:30:00"  # Fixed timestamp for consistency
        )
        
        metadata2 = NFTmetadata(
            student_id=self.student_id,
            degree_type=self.degree_type,
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution=self.institution,
            issued_at="2024-01-15T10:30:00"  # Same timestamp
        )
        
        hash1 = metadata1.hash_metadata()
        hash2 = metadata2.hash_metadata()
        
        assert hash1 == hash2

    def test_nftmetadata_hash_different_for_different_data(self):
        """Test that different metadata produces different hash"""
        metadata1 = NFTmetadata(
            student_id=self.student_id,
            degree_type=self.degree_type,
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution=self.institution,
            issued_at="2024-01-15T10:30:00"
        )
        
        metadata2 = NFTmetadata(
            student_id="student456",  # Different student
            degree_type=self.degree_type,
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution=self.institution,
            issued_at="2024-01-15T10:30:00"
        )
        
        hash1 = metadata1.hash_metadata()
        hash2 = metadata2.hash_metadata()
        
        assert hash1 != hash2

    def test_nftmetadata_hash_different_degree_type(self):
        """Test that different degree_type produces different hash"""
        metadata1 = NFTmetadata(
            student_id=self.student_id,
            degree_type="Bachelor of Science",
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution=self.institution,
            issued_at="2024-01-15T10:30:00"
        )
        
        metadata2 = NFTmetadata(
            student_id=self.student_id,
            degree_type="Master of Science",
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution=self.institution,
            issued_at="2024-01-15T10:30:00"
        )
        
        hash1 = metadata1.hash_metadata()
        hash2 = metadata2.hash_metadata()
        
        assert hash1 != hash2

    def test_nftmetadata_hash_different_institution(self):
        """Test that different institution produces different hash"""
        metadata1 = NFTmetadata(
            student_id=self.student_id,
            degree_type=self.degree_type,
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution="Harvard University",
            issued_at="2024-01-15T10:30:00"
        )
        
        metadata2 = NFTmetadata(
            student_id=self.student_id,
            degree_type=self.degree_type,
            pdf_url=self.pdf_url,
            pdf_hash=self.pdf_hash,
            institution="MIT",
            issued_at="2024-01-15T10:30:00"
        )
        
        hash1 = metadata1.hash_metadata()
        hash2 = metadata2.hash_metadata()
        
        assert hash1 != hash2

    def test_nftmetadata_multiple_instances_independence(self):
        """Test that multiple NFTmetadata instances are independent"""
        metadata1 = NFTmetadata(
            student_id="student1",
            degree_type="Bachelor",
            pdf_url="url1",
            pdf_hash="hash1",
            institution="University1"
        )
        
        metadata2 = NFTmetadata(
            student_id="student2",
            degree_type="Master",
            pdf_url="url2",
            pdf_hash="hash2",
            institution="University2"
        )
        
        assert metadata1.student_id != metadata2.student_id
        assert metadata1.degree_type != metadata2.degree_type
        assert metadata1.institution != metadata2.institution
