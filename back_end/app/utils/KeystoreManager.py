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
    
    KDF_ITERATIONS = 100000
    SALT_LENGTH = 32
    KEY_LENGTH = 32
    NONCE_LENGTH = 12
    
    @staticmethod
    def derive_key(passphrase: str, salt: bytes) -> bytes:
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
        salt = os.urandom(KeystoreManager.SALT_LENGTH)
        nonce = os.urandom(KeystoreManager.NONCE_LENGTH)
        
        key = KeystoreManager.derive_key(passphrase, salt)
        
        aesgcm = AESGCM(key)
        ciphertext = aesgcm.encrypt(
            nonce,
            private_key_hex.encode('utf-8'),
            None
        )
        
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
        try:
            salt = base64.b64decode(keystore_data['salt'])
            nonce = base64.b64decode(keystore_data['nonce'])
            ciphertext = base64.b64decode(keystore_data['ciphertext'])
            
            key = KeystoreManager.derive_key(passphrase, salt)
            
            aesgcm = AESGCM(key)
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)
            
            return plaintext.decode('utf-8')
            
        except Exception as e:
            print(f"✗ Decryption failed: {e}")
            return None
    
    @staticmethod
    def save_keystore(filepath: str, keystore_data: Dict) -> bool:
        try:
            with open(filepath, 'w') as f:
                json.dump(keystore_data, f, indent=2)
            
            if os.name != 'nt':
                os.chmod(filepath, 0o600)
            
            return True
        except Exception as e:
            print(f"✗ Failed to save keystore: {e}")
            return False
    
    @staticmethod
    def load_keystore(filepath: str) -> Optional[Dict]:
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
        if isinstance(data, str):
            data = '0' * len(data)
        elif isinstance(data, bytes):
            data = b'0' * len(data)
        
        del data
    
    @staticmethod
    def validate_passphrase(passphrase: str) -> tuple[bool, str]:
        if len(passphrase) < 8:
            return False, "Passphrase must be at least 8 characters long"
        
        if len(passphrase) > 128:
            return False, "Passphrase must be at most 128 characters long"
        
        has_letter = any(c.isalpha() for c in passphrase)
        has_number = any(c.isdigit() for c in passphrase)
        
        if not (has_letter and has_number):
            return False, "Passphrase must contain both letters and numbers"
        
        return True, ""
def generate_keypair():
    private_key = SigningKey.generate(curve=SECP256k1)
    public_key = private_key.get_verifying_key()
    
    private_key_hex = private_key.to_string().hex()
    public_key_hex = public_key.to_string().hex()
    
    address = hashlib.sha256(public_key_hex.encode()).hexdigest()[:40]
    
    return private_key_hex, public_key_hex, address

@staticmethod
def create_keystore(passphrase: str):
    keystore_path = "node.keystore"
    if os.path.exists(keystore_path):
        print(f"⚠️  WARNING: Keystore file already exists: {keystore_path}")

    
    print("[1/3] Generating keypair...")
    private_key_hex, public_key_hex, address = generate_keypair()
    print("✓ Keypair generated")
    print(f"  Public Key: {public_key_hex[:32]}...{public_key_hex[-8:]}")
    print(f"  Address: {address}")
     
    if passphrase is None:
        KeystoreManager.secure_delete(private_key_hex)
        return
    
    print("✓ Passphrase accepted")
    
    try:
        keystore_data = KeystoreManager.encrypt_private_key(private_key_hex, passphrase)
        
        keystore_data['public_key'] = public_key_hex
        keystore_data['address'] = address
        
        if KeystoreManager.save_keystore(keystore_path, keystore_data):
            print(f"✓ Keystore saved to: {keystore_path}")
        else:
            print("✗ Failed to save keystore")
            return
        
    finally:
        KeystoreManager.secure_delete(private_key_hex)
        KeystoreManager.secure_delete(passphrase)

if __name__ == "__main__":
    print("=== Testing Keystore Manager ===\n")
    
    test_private_key = "a" * 64
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
        ("12345678", False),
        ("abcdefgh", False),
    ]
    
    for passphrase, expected_valid in test_cases:
        is_valid, msg = KeystoreManager.validate_passphrase(passphrase)
        status = "✓" if is_valid == expected_valid else "✗"
        print(f"{status} '{passphrase}': {is_valid} - {msg}")
