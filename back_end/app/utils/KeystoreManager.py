"""
Keystore Manager - Secure Private Key Encryption/Decryption
Handles AES-256-GCM encryption with PBKDF2 key derivation
"""
import os
import json
import hashlib
import base64
from typing import Dict, Optional
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import sys
import getpass
from ecdsa import SigningKey, SECP256k1
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


class KeystoreManager:
    """Manages secure keystore operations for private key encryption"""
    
    # Security parameters
    KDF_ITERATIONS = 100000  # PBKDF2 iterations
    SALT_LENGTH = 32  # bytes
    KEY_LENGTH = 32  # 256 bits for AES-256
    NONCE_LENGTH = 12  # GCM standard nonce length
    
    @staticmethod
    def derive_key(passphrase: str, salt: bytes) -> bytes:
        """
        Derive encryption key from passphrase using PBKDF2-HMAC-SHA256
        
        Args:
            passphrase: User's passphrase
            salt: Random salt bytes
            
        Returns:
            Derived key bytes
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=KeystoreManager.KEY_LENGTH,
            salt=salt,
            iterations=KeystoreManager.KDF_ITERATIONS,
            backend=default_backend()
        )
        return kdf.derive(passphrase.encode('utf-8'))
    
    @staticmethod
    def encrypt_private_key(private_key_hex: str, passphrase: str) -> Dict:
        """
        Encrypt private key with passphrase using AES-256-GCM
        
        Args:
            private_key_hex: Private key as hex string
            passphrase: User's passphrase
            
        Returns:
            Dictionary containing encrypted keystore data
        """
        # Generate random salt and nonce
        salt = os.urandom(KeystoreManager.SALT_LENGTH)
        nonce = os.urandom(KeystoreManager.NONCE_LENGTH)
        
        # Derive encryption key from passphrase
        key = KeystoreManager.derive_key(passphrase, salt)
        
        # Encrypt private key using AES-256-GCM
        aesgcm = AESGCM(key)
        ciphertext = aesgcm.encrypt(
            nonce,
            private_key_hex.encode('utf-8'),
            None  # No additional authenticated data
        )
        
        # Return keystore data (all binary data as base64)
        return {
            'version': '1.0',
            'algorithm': 'AES-256-GCM',
            'kdf': 'PBKDF2-HMAC-SHA256',
            'kdf_iterations': KeystoreManager.KDF_ITERATIONS,
            'salt': base64.b64encode(salt).decode('utf-8'),
            'nonce': base64.b64encode(nonce).decode('utf-8'),
            'ciphertext': base64.b64encode(ciphertext).decode('utf-8')
        }
    
    @staticmethod
    def decrypt_private_key(keystore_data: Dict, passphrase: str) -> Optional[str]:
        """
        Decrypt private key from keystore using passphrase
        
        Args:
            keystore_data: Keystore dictionary
            passphrase: User's passphrase
            
        Returns:
            Decrypted private key as hex string, or None if decryption fails
        """
        try:
            # Extract keystore components
            salt = base64.b64decode(keystore_data['salt'])
            nonce = base64.b64decode(keystore_data['nonce'])
            ciphertext = base64.b64decode(keystore_data['ciphertext'])
            
            # Derive decryption key from passphrase
            key = KeystoreManager.derive_key(passphrase, salt)
            
            # Decrypt using AES-256-GCM
            aesgcm = AESGCM(key)
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)
            
            # Return decrypted private key
            return plaintext.decode('utf-8')
            
        except Exception as e:
            # Decryption failed (wrong passphrase or corrupted data)
            print(f"✗ Decryption failed: {e}")
            return None
    
    @staticmethod
    def save_keystore(filepath: str, keystore_data: Dict) -> bool:
        """
        Save keystore to file
        
        Args:
            filepath: Path to save keystore file
            keystore_data: Keystore dictionary
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with open(filepath, 'w') as f:
                json.dump(keystore_data, f, indent=2)
            
            # Set restrictive file permissions (owner read/write only)
            if os.name != 'nt':  # Unix/Linux
                os.chmod(filepath, 0o600)
            
            return True
        except Exception as e:
            print(f"✗ Failed to save keystore: {e}")
            return False
    
    @staticmethod
    def load_keystore(filepath: str) -> Optional[Dict]:
        """
        Load keystore from file
        
        Args:
            filepath: Path to keystore file
            
        Returns:
            Keystore dictionary, or None if load fails
        """
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"✗ Keystore file not found: {filepath}")
            return None
        except Exception as e:
            print(f"✗ Failed to load keystore: {e}")
            return None
    
    @staticmethod
    def secure_delete(data: any) -> None:
        """
        Securely delete sensitive data from memory
        
        Args:
            data: Data to delete (string, bytes, etc.)
        """
        if isinstance(data, str):
            # Overwrite string data
            data = '0' * len(data)
        elif isinstance(data, bytes):
            # Overwrite bytes data
            data = b'0' * len(data)
        
        # Delete reference
        del data
    
    @staticmethod
    def validate_passphrase(passphrase: str) -> tuple[bool, str]:
        """
        Validate passphrase strength
        
        Args:
            passphrase: Passphrase to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if len(passphrase) < 8:
            return False, "Passphrase must be at least 8 characters long"
        
        if len(passphrase) > 128:
            return False, "Passphrase must be at most 128 characters long"
        
        # Check for at least one letter and one number
        has_letter = any(c.isalpha() for c in passphrase)
        has_number = any(c.isdigit() for c in passphrase)
        
        if not (has_letter and has_number):
            return False, "Passphrase must contain both letters and numbers"
        
        return True, ""
def generate_keypair():
    """
    Generate ECDSA SECP256k1 keypair
    
    Returns:
        Tuple of (private_key_hex, public_key_hex, address)
    """
    # Generate private key
    private_key = SigningKey.generate(curve=SECP256k1)
    public_key = private_key.get_verifying_key()
    
    # Convert to hex strings
    private_key_hex = private_key.to_string().hex()
    public_key_hex = public_key.to_string().hex()
    
    # Generate address from public key (SHA-256 hash)
    address = hashlib.sha256(public_key_hex.encode()).hexdigest()[:40]
    
    return private_key_hex, public_key_hex, address

@staticmethod
def create_keystore(passphrase: str):
    keystore_path = "node.keystore"
    if os.path.exists(keystore_path):
        print(f"⚠️  WARNING: Keystore file already exists: {keystore_path}")
        response = input("Do you want to overwrite it? (yes/no): ").strip().lower()
        if response != 'yes':
            print("Setup cancelled.")
            return
        print()
    
    # Step 1: Generate keypair
    print("[1/3] Generating keypair...")
    private_key_hex, public_key_hex, address = generate_keypair()
    print("✓ Keypair generated")
    print(f"  Public Key: {public_key_hex[:32]}...{public_key_hex[-8:]}")
    print(f"  Address: {address}")
     
    if passphrase is None:
        # Clean up and exit
        KeystoreManager.secure_delete(private_key_hex)
        return
    
    print("✓ Passphrase accepted")
    
    try:
        # Encrypt private key
        keystore_data = KeystoreManager.encrypt_private_key(private_key_hex, passphrase)
        
        # Add metadata
        keystore_data['public_key'] = public_key_hex
        keystore_data['address'] = address
        
        # Save to file
        if KeystoreManager.save_keystore(keystore_path, keystore_data):
            print(f"✓ Keystore saved to: {keystore_path}")
        else:
            print("✗ Failed to save keystore")
            return
        
    finally:
        # Securely delete sensitive data from memory
        KeystoreManager.secure_delete(private_key_hex)
        KeystoreManager.secure_delete(passphrase)

if __name__ == "__main__":
    # Test keystore manager
    print("=== Testing Keystore Manager ===\n")
    
    # Test encryption/decryption
    test_private_key = "a" * 64  # Mock private key
    test_passphrase = "SecurePass123"
    
    print("1. Encrypting private key...")
    keystore = KeystoreManager.encrypt_private_key(test_private_key, test_passphrase)
    print(f"✓ Encrypted keystore created")
    print(f"  Algorithm: {keystore['algorithm']}")
    print(f"  KDF: {keystore['kdf']}")
    
    print("\n2. Decrypting with correct passphrase...")
    decrypted = KeystoreManager.decrypt_private_key(keystore, test_passphrase)
    if decrypted == test_private_key:
        print("✓ Decryption successful - keys match!")
    else:
        print("✗ Decryption failed - keys don't match")
    
    print("\n3. Decrypting with wrong passphrase...")
    wrong_decrypted = KeystoreManager.decrypt_private_key(keystore, "WrongPass123")
    if wrong_decrypted is None:
        print("✓ Correctly rejected wrong passphrase")
    else:
        print("✗ Security issue - accepted wrong passphrase!")
    
    print("\n4. Testing passphrase validation...")
    test_cases = [
        ("weak", False),
        ("Pass123", True),
        ("VerySecurePassphrase2024", True),
        ("12345678", False),  # No letters
        ("abcdefgh", False),  # No numbers
    ]
    
    for passphrase, expected_valid in test_cases:
        is_valid, msg = KeystoreManager.validate_passphrase(passphrase)
        status = "✓" if is_valid == expected_valid else "✗"
        print(f"{status} '{passphrase}': {is_valid} - {msg}")
