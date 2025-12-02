import pytest
import json
from datetime import datetime
from app.models.Block import Block
from app.models.BlockHeader import BlockHeader
from app.utils.Utils import CryptoUtils


class TestBlock:
    """Test cases for Block model"""

    def setup_method(self):
        """Setup test data before each test"""
        self.pubkey, self.private_key = CryptoUtils.generate_key_pair()
        self.validator_pubkey = self.pubkey
        
        # Create block header
        self.block_header = BlockHeader(
            index=1,
            pre_hash="0x" + "a" * 64,
            merkle_root="",
            validator_pubkey=self.validator_pubkey,
            timestamp=int(datetime.utcnow().timestamp())
        )
        
        self.transactions = [
            {"from": "alice", "to": "bob", "amount": 100},
            {"from": "bob", "to": "charlie", "amount": 50}
        ]

    def test_block_initialization(self):
        """Test Block object initialization"""
        block = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=self.transactions
        )
        
        assert block.index == 1
        assert block.block_id == "block_1"
        assert block.block_header == self.block_header
        assert block.transactions == self.transactions

    def test_calculate_merkle_root_with_transactions(self):
        """Test calculating merkle root from transactions"""
        block = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=self.transactions
        )
        
        merkle_root = block.calculate_merkle_root()
        
        assert isinstance(merkle_root, str)
        assert len(merkle_root) == 64  # SHA256 produces 64 hex chars

    def test_calculate_merkle_root_empty_transactions(self):
        """Test calculating merkle root with empty transactions"""
        block = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=[]
        )
        
        merkle_root = block.calculate_merkle_root()
        assert merkle_root == ""

    def test_calculate_hash(self):
        """Test calculating block hash"""
        block = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=self.transactions
        )
        
        block_hash = block.calculate_hash()
        
        assert isinstance(block_hash, str)
        assert len(block_hash) == 64  # SHA256 produces 64 hex chars

    def test_sign_block(self):
        """Test signing a block"""
        block = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=self.transactions
        )
        
        signature = block.sign_block(self.private_key)
        
        assert isinstance(signature, str)
        assert len(signature) > 0
        assert block.validator_signature == signature
        assert block.block_hash != ""

    def test_verify_valid_signature(self):
        """Test verifying a valid block signature"""
        block = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=self.transactions
        )
        
        # Sign the block
        block.sign_block(self.private_key)
        
        # Verify the signature
        is_valid = block.verify_block(self.validator_pubkey)
        assert is_valid is True

    def test_verify_invalid_signature(self):
        """Test verifying an invalid block signature"""
        block = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=self.transactions
        )
        
        # Sign the block with one key
        block.sign_block(self.private_key)
        
        # Try to verify with a different public key
        other_pubkey, _ = CryptoUtils.generate_key_pair()
        is_valid = block.verify_block(other_pubkey)
        assert is_valid is False

    def test_block_tampering_detection(self):
        """Test that block tampering is detected"""
        block = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=self.transactions
        )
        
        # Sign the block
        block.sign_block(self.private_key)
        original_hash = block.block_hash
        
        # Tamper with the block by modifying a transaction
        block.transactions[0]["amount"] = 999
        
        # Verify signature should still be valid (signature is on original data)
        # But hash should be different
        new_hash = block.calculate_hash()
        assert new_hash != original_hash

    def test_block_deterministic_hash(self):
        """Test that same block data produces same hash"""
        block1 = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=self.transactions
        )
        
        block2 = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=self.transactions
        )
        
        hash1 = block1.calculate_hash()
        hash2 = block2.calculate_hash()
        
        assert hash1 == hash2

    def test_block_different_data_different_hash(self):
        """Test that different block data produces different hash"""
        block1 = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=self.transactions
        )
        
        different_transactions = [
            {"from": "alice", "to": "david", "amount": 200}
        ]
        
        block2 = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=different_transactions
        )
        
        hash1 = block1.calculate_hash()
        hash2 = block2.calculate_hash()
        
        assert hash1 != hash2

    def test_sign_and_verify_roundtrip(self):
        """Test complete sign and verify flow"""
        block = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=self.transactions
        )
        
        # Sign
        signature = block.sign_block(self.private_key)
        assert signature != ""
        
        # Verify
        is_valid = block.verify_block(self.validator_pubkey)
        assert is_valid is True
        
        # Verify with wrong key should fail
        wrong_pubkey, _ = CryptoUtils.generate_key_pair()
        is_invalid = block.verify_block(wrong_pubkey)
        assert is_invalid is False

    def test_multiple_signatures(self):
        """Test signing same block multiple times"""
        block = Block(
            index=1,
            block_id="block_1",
            block_header=self.block_header,
            transactions=self.transactions
        )
        
        sig1 = block.sign_block(self.private_key)
        sig2 = block.sign_block(self.private_key)
        
        # Same data should produce consistent verification
        assert block.verify_block(self.validator_pubkey) is True
