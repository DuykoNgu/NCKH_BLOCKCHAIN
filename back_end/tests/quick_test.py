"""
Quick NFT Performance Test
Simplified version for quick testing with configurable NFT count
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
import time
import hashlib
from ecdsa import SigningKey, SECP256k1
from ecdsa.util import sigencode_der

BASE_URL = "http://127.0.0.1:5000"

def generate_keypair():
    """Generate ECDSA keypair"""
    private_key = SigningKey.generate(curve=SECP256k1)
    public_key = private_key.get_verifying_key()
    
    private_key_hex = private_key.to_string().hex()
    public_key_hex = public_key.to_string().hex()
    address = hashlib.sha256(public_key_hex.encode()).hexdigest()[:40]
    
    return private_key_hex, public_key_hex, address

def sign_data(data: str, private_key_hex: str) -> str:
    """Sign data with private key using DER encoding"""
    private_key = SigningKey.from_string(bytes.fromhex(private_key_hex), curve=SECP256k1)
    # Sign with SHA256 hash and DER encoding to match CryptoUtils
    signature = private_key.sign(data.encode(), hashfunc=hashlib.sha256, sigencode=sigencode_der)
    return signature.hex()

def quick_test(num_nfts: int = 10):
    """Quick test with specified number of NFTs"""
    print(f"\n🧪 Quick Test: Minting {num_nfts} NFTs\n")
    
    # Generate issuer
    print("Creating issuer account...")
    issuer_priv, issuer_pub, issuer_addr = generate_keypair()
    
    resp = requests.post(f"{BASE_URL}/api/v1/users/auth/register", json={
        "address": issuer_addr,
        "public_key": issuer_pub,
        "role": "moet"
    })
    
    if resp.status_code != 201:
        print(f"❌ Failed to create issuer: {resp.text}")
        return
    
    print(f"✅ Issuer: {issuer_addr[:20]}...")
    
    # Generate recipient
    print("Creating recipient account...")
    _, recip_pub, recip_addr = generate_keypair()
    
    resp = requests.post(f"{BASE_URL}/api/v1/users/auth/register", json={
        "address": recip_addr,
        "public_key": recip_pub,
        "role": "client"
    })
    
    if resp.status_code != 201:
        print(f"❌ Failed to create recipient: {resp.text}")
        return
    
    print(f"✅ Recipient: {recip_addr[:20]}...")
    
    # Mint NFTs
    print(f"\nMinting {num_nfts} NFTs...")
    start_time = time.time()
    success_count = 0
    
    # Import NFTmetadata for signing
    from app.models.NFTmetadata import NFTmetadata
    
    for i in range(num_nfts):
        pdf_url = f"https://educhain.edu.vn/cert_{i}.pdf"
        pdf_hash = hashlib.sha256(f"cert_{i}".encode()).hexdigest()
        degree = "Bachelor of Science"
        
        # Create metadata and use get_signing_data()
        metadata = NFTmetadata(
            degree_type=degree,
            pdf_url=pdf_url,
            pdf_hash=pdf_hash,
            institution_address=issuer_addr
        )
        
        signing_data = metadata.get_signing_data()
        signature = sign_data(signing_data, issuer_priv)
        
        resp = requests.post(f"{BASE_URL}/api/v1/nft/create", json={
            "degree_type": degree,
            "pdf_url": pdf_url,
            "pdf_hash": pdf_hash,
            "institution_address": issuer_addr,
            "recipient_address": recip_addr,
            "signature": signature
        })
        
        if resp.status_code == 201:
            success_count += 1
            print(f"  [OK] NFT {i+1}/{num_nfts} minted")
        else:
            print(f"  [FAIL] NFT {i+1}/{num_nfts} failed: {resp.json().get('error', 'Unknown')}")
    
    elapsed = time.time() - start_time
    
    print(f"\n{'='*60}")
    print(f"Results: {success_count}/{num_nfts} successful")
    print(f"Time: {elapsed:.2f}s")
    print(f"Rate: {success_count/elapsed:.2f} NFTs/sec")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Quick NFT performance test')
    parser.add_argument('-n', '--num', type=int, default=10, help='Number of NFTs to mint (default: 10)')
    args = parser.parse_args()
    
    try:
        quick_test(args.num)
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted")
    except Exception as e:
        print(f"\n❌ Error: {e}")

