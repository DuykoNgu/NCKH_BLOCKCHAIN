"""
Run script for EduChain Backend
This script properly sets up the Python path and starts the Flask server
with full P2P network initialization and chain synchronization.

Usage:
    python run.py                           # Default: port 5000
    python run.py --port 5001               # Custom port
    python run.py --port 5001 --db node_b.db  # Custom port + DB (multi-node local test)
"""
import sys
import os
import argparse

# Add back_end directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from app.utils.KeystoreManager import KeystoreManager
from app.main import app, init_db
from app.blockchain_instance import get_blockchain_instance, initialize_blockchain
from consensus.validator_worker import start_validator_worker


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='EduChain Backend Server')
    parser.add_argument('--port', type=int, default=5000,
                        help='Port to run the server on (default: 5000)')
    parser.add_argument('--host', type=str, default='127.0.0.1',
                        help='Host to bind to (default: 127.0.0.1)')
    parser.add_argument('--db', type=str, default=None,
                        help='Custom database filename (for multi-node testing)')
    parser.add_argument('--no-network', action='store_true',
                        help='Skip P2P network initialization (for testing)')
    parser.add_argument('--validator-index', type=int, default=0,
                        help='Validator index for this node (default: 0)')
    parser.add_argument('--total-validators', type=int, default=1,
                        help='Total number of validators (default: 1)')
    return parser.parse_args()


def setup_custom_db(db_filename):
    """Override database path for multi-node testing"""
    import app.database.database as db_module
    custom_db_path = os.path.join(current_dir, db_filename)
    db_module.DB_PATH = custom_db_path
    print(f"  Using custom DB: {custom_db_path}")


def initialize_p2p_network(port):
    """
    Initialize P2P network: NTP sync, bootstrap peers, health check
    
    Args:
        port: The port this node is running on (for self-registration)
    """
    from app.services.NetworkService import get_network_service, initialize_network
    from network.config_loader import get_config
    
    # Update node config with actual port
    config = get_config()
    network_config = config.get_network_config()
    network_config['listen_port'] = port
    
    # Initialize network (NTP sync + bootstrap + health check)
    try:
        success = initialize_network()
        if success:
            print("✅ P2P Network initialized successfully")
        else:
            print("⚠️  P2P Network initialization had warnings (continuing anyway)")
    except Exception as e:
        print(f"⚠️  P2P Network initialization error: {e}")
        print("   Server will start but P2P features may be limited")


def sync_chain_from_peers():
    """Sync blockchain from peers if local chain is behind"""
    from app.services.NetworkService import get_network_service
    from network.chain_sync import ChainSync
    
    try:
        service = get_network_service()
        blockchain = get_blockchain_instance()
        
        chain_sync = ChainSync(
            peer_manager=service.peer_manager,
            blockchain=blockchain
        )
        
        synced = chain_sync.sync()
        if synced > 0:
            print(f"✅ Synced {synced} blocks from peers")
        else:
            print("✅ Chain is up to date")
    except Exception as e:
        print(f"⚠️  Chain sync error: {e}")
        print("   Starting with local chain state")


def start_network_background_tasks():
    """Start background daemon for health checks and peer sync"""
    from app.services.NetworkService import get_network_service
    from network.network_daemon import start_network_daemon
    
    service = get_network_service()
    daemon = start_network_daemon(
        network_service=service,
        health_interval=30,
        sync_interval=60
    )
    print("✅ Network daemon started (health check: 30s, peer sync: 60s)")
    return daemon


if __name__ == "__main__":
    args = parse_args()
    
    print("=" * 60)
    print("🚀 Starting EduChain Backend Server")
    print(f"   Host: {args.host}:{args.port}")
    print("=" * 60)
    
    # Step 0: Custom DB if specified (for multi-node testing)
    if args.db:
        setup_custom_db(args.db)
    
    # Step 1: Initialize database
    total_steps = 5 if not args.no_network else 3
    step = 1
    
    print(f"\n[{step}/{total_steps}] Initializing database...")
    try:
        init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"⚠️  Database initialization warning: {e}")
    
    # Step 2: Initialize blockchain
    step += 1
    print(f"\n[{step}/{total_steps}] Initializing blockchain...")
    try:
        keystore_data = KeystoreManager.load_keystore('node.keystore')
        public_key = keystore_data['public_key']
        
        initialize_blockchain(public_key)
        print(f"✅ Blockchain initialized (pubkey: {public_key[:32]}...)")
    except Exception as e:
        print(f"⚠️  Blockchain initialization warning: {e}")
        public_key = ""
    
    if not args.no_network:
        # Step 3: Initialize P2P network
        step += 1
        print(f"\n[{step}/{total_steps}] Initializing P2P network...")
        initialize_p2p_network(args.port)
        
        # Step 4: Sync chain from peers
        step += 1
        print(f"\n[{step}/{total_steps}] Syncing blockchain from peers...")
        sync_chain_from_peers()
    
    # Step 5 (or 3): Start services and Flask server
    step += 1
    print(f"\n[{step}/{total_steps}] Starting services...")
    
    # Initialize validator worker
    try:
        start_validator_worker(
            my_validator_index=args.validator_index,
            total_validators=args.total_validators,
            public_key=public_key,
        )
        print("✅ Validator worker initialized")
    except Exception as e:
        print(f"⚠️  Validator worker warning: {e}")
    
    # Start network background daemon
    if not args.no_network:
        try:
            start_network_background_tasks()
        except Exception as e:
            print(f"⚠️  Network daemon warning: {e}")
    
    # Start Flask server
    print("\n" + "=" * 60)
    print(f"🌐 Server running at: http://{args.host}:{args.port}")
    print(f"📡 P2P Network: {'ENABLED' if not args.no_network else 'DISABLED'}")
    print(f"🔑 Validator: #{args.validator_index}/{args.total_validators}")
    print("Press CTRL+C to stop")
    print("=" * 60 + "\n")
    
    # Use use_reloader=False to prevent duplicate startup with threads
    app.run(host=args.host, port=args.port, debug=True, use_reloader=False)
