"""
Generate Test Key Pairs
Usage: python3 -m app.utils.generate_keys [number of keys]
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.utils.CryptoUtils import CryptoUtils

if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    
    print("\n" + "="*80)
    print(f" Generating {count} test key pair(s)...")
    print("="*80 + "\n")
    
    for i in range(count):
        pub, priv = CryptoUtils.generate_key_pair()
        addr = CryptoUtils.get_address_from_pubkey(pub)
        
        print(f"KEY #{i+1}")
        print(f"  Address:     {addr}")
        print(f"  Public:      {pub}")
        print(f"  Private:     {priv}\n")
