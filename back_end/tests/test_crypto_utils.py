"""
Test suite for CryptoUtils - Key generation, signing, verification, hashing
Chạy: python -m pytest tests/test_crypto_utils.py -v
"""
import unittest
from app.utils.Utils import CryptoUtils


class TestCryptoUtils(unittest.TestCase):
    """Test cases cho CryptoUtils"""

    def setUp(self):
        self.pub, self.priv = CryptoUtils.generate_key_pair()
        self.data = {"user": "alice", "amount": 100}

    def _is_hex(self, s: str) -> bool:
        """Kiểm tra string có phải hex"""
        return all(c in '0123456789abcdef' for c in s)

    def _is_valid_address(self, addr: str) -> bool:
        """Kiểm tra address hợp lệ"""
        return addr.startswith("0x") and len(addr) == 42 and self._is_hex(addr[2:])

    # ==================== Key Management ====================

    def test_generate_key_pair(self):
        """Sinh cặp khóa"""
        pub, priv = CryptoUtils.generate_key_pair()
        self.assertIsNotNone(pub)
        self.assertIsNotNone(priv)
        self.assertEqual(len(pub), 128)  # 64 bytes
        self.assertEqual(len(priv), 64)  # 32 bytes
        self.assertTrue(self._is_hex(pub) and self._is_hex(priv))

    def test_get_public_key_from_private(self):
        """Lấy public key từ private key"""
        pub = CryptoUtils.get_public_key_from_private(self.priv)
        self.assertEqual(pub, self.pub)
        self.assertEqual(len(pub), 128)

    def test_get_address_from_pubkey(self):
        """Tạo address từ public key"""
        addr = CryptoUtils.get_address_from_pubkey(self.pub)
        self.assertTrue(self._is_valid_address(addr))

    def test_address_deterministic(self):
        """Address xác định"""
        addr1 = CryptoUtils.get_address_from_pubkey(self.pub)
        addr2 = CryptoUtils.get_address_from_pubkey(self.pub)
        self.assertEqual(addr1, addr2)

    # ==================== Signing & Verification ====================

    def test_sign_data(self):
        """Ký dữ liệu"""
        sig = CryptoUtils.sign_data(self.data, self.priv)
        self.assertIsNotNone(sig)
        self.assertTrue(self._is_hex(sig))

    def test_verify_valid_signature(self):
        """Xác minh signature hợp lệ"""
        sig = CryptoUtils.sign_data(self.data, self.priv)
        self.assertTrue(CryptoUtils.verify_signature(self.data, sig, self.pub))

    def test_verify_invalid_signature(self):
        """Reject signature không hợp lệ"""
        sig = CryptoUtils.sign_data(self.data, self.priv)
        invalid_sig = sig[:-2] + "00"
        self.assertFalse(CryptoUtils.verify_signature(self.data, invalid_sig, self.pub))

    def test_verify_wrong_data(self):
        """Reject signature với dữ liệu khác"""
        sig = CryptoUtils.sign_data(self.data, self.priv)
        wrong_data = {"user": "bob", "amount": 200}
        self.assertFalse(CryptoUtils.verify_signature(wrong_data, sig, self.pub))

    def test_verify_wrong_pubkey(self):
        """Reject signature với public key khác"""
        sig = CryptoUtils.sign_data(self.data, self.priv)
        other_pub, _ = CryptoUtils.generate_key_pair()
        self.assertFalse(CryptoUtils.verify_signature(self.data, sig, other_pub))

    def test_sign_different_types(self):
        """Ký các loại dữ liệu khác nhau"""
        for data in [self.data, "hello", b"bytes"]:
            sig = CryptoUtils.sign_data(data, self.priv)
            self.assertTrue(self._is_hex(sig))
            if isinstance(data, dict):
                self.assertTrue(CryptoUtils.verify_signature(data, sig, self.pub))

    # ==================== Hashing ====================

    def test_hash_sha256(self):
        """Hash SHA256"""
        h = CryptoUtils.hash_sha256(self.data)
        self.assertEqual(len(h), 64)
        self.assertTrue(self._is_hex(h))

    def test_hash_keccak256(self):
        """Hash Keccak256"""
        h = CryptoUtils.hash_keccak256(self.data)
        self.assertEqual(len(h), 64)
        self.assertTrue(self._is_hex(h))

    def test_hash_deterministic(self):
        """Hash xác định"""
        h1 = CryptoUtils.hash_sha256(self.data)
        h2 = CryptoUtils.hash_sha256(self.data)
        self.assertEqual(h1, h2)

    def test_hash_different_types(self):
        """Hash các loại dữ liệu khác nhau"""
        for data in [self.data, "hello", b"bytes"]:
            h = CryptoUtils.hash_sha256(data)
            self.assertEqual(len(h), 64)

    # ==================== Integration ====================

    def test_full_workflow(self):
        """Quy trình hoàn chỉnh: key -> address -> sign -> verify -> hash"""
        pub, priv = CryptoUtils.generate_key_pair()
        addr = CryptoUtils.get_address_from_pubkey(pub)
        tx = {"from": addr, "to": "0x" + "1" * 40, "amount": 100}
        sig = CryptoUtils.sign_data(tx, priv)
        self.assertTrue(CryptoUtils.verify_signature(tx, sig, pub))
        h = CryptoUtils.hash_sha256(tx)
        self.assertEqual(len(h), 64)

    def test_multiple_signers(self):
        """Nhiều người ký cùng dữ liệu"""
        data = {"action": "transfer"}
        sigs = []
        for _ in range(3):
            pub, priv = CryptoUtils.generate_key_pair()
            sig = CryptoUtils.sign_data(data, priv)
            sigs.append((pub, sig))
        
        for pub, sig in sigs:
            self.assertTrue(CryptoUtils.verify_signature(data, sig, pub))


if __name__ == "__main__":
    unittest.main(verbosity=2)
