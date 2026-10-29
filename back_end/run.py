import sys
import os
import argparse

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

def parse_args():
    parser = argparse.ArgumentParser(description='EduChain node — cấu hình qua biến môi trường / file .env')
    parser.add_argument('--env', type=str, default=None,
                        help='File .env của node (mặc định: back_end/.env)')
    parser.add_argument('--no-network', action='store_true',
                        help='Skip P2P network initialization (for testing)')
    return parser.parse_args()


def initialize_p2p_network(node_ip, port, public_key=""):
    from app.services.NetworkService import initialize_network
    
    try:
        success = initialize_network(node_ip=node_ip, node_port=port, public_key=public_key)
        if success:
            print("✅ P2P Network initialized successfully")
        else:
            print("⚠️  P2P Network initialization had warnings (continuing anyway)")
    except Exception as e:
        print(f"⚠️  P2P Network initialization error: {e}")
        print("   Server will start but P2P features may be limited")


def sync_chain_from_peers():
    from app.services.NetworkService import get_network_service
    from network.chain_sync import ChainSync
    from app.blockchain_instance import get_blockchain_instance
    
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
    from app.services.NetworkService import get_network_service
    from network.network_daemon import start_network_daemon
    from network.config_loader import get_config
    from app.blockchain_instance import get_blockchain_instance
    
    service = get_network_service()
    daemon = start_network_daemon(
        network_service=service,
        health_interval=30,
        sync_interval=60
    )
    print("✅ Network daemon started (health check: 30s, peer sync: 60s)")
    
    try:
        config = get_config()
        monitor_config = config.get_monitor_config()
        monitor_enabled = monitor_config.get('enabled', True)
        
        if not monitor_enabled:
            print("ℹ️  Chain monitor is DISABLED in config")
            return daemon
        
        print("→ Initializing chain monitor...")
        
        from network.chain_monitor import init_chain_monitor, start_chain_monitoring
        
        blockchain = get_blockchain_instance()
        check_interval = monitor_config.get('check_interval', 30)
        
        print(f"  Config: check_interval={check_interval}s, threshold={monitor_config.get('block_gap_threshold', 5)} blocks")
        
        monitor = init_chain_monitor(
            peer_manager=service.peer_manager,
            blockchain=blockchain,
            check_interval=check_interval
        )
        
        start_chain_monitoring()
        
        print(f"✅ Chain monitor started (check interval: {check_interval}s)")
        print(f"   Monitor auto-sync: {'ENABLED' if monitor_config.get('auto_sync_enabled', True) else 'DISABLED'}")
    
    except ImportError as e:
        print(f"⚠️  Chain monitor import error: {e}")
        print("   Module chain_monitor not found - skipping")
    except Exception as e:
        print(f"⚠️  Chain monitor initialization error: {e}")
        import traceback
        traceback.print_exc()
    
    return daemon


if __name__ == "__main__":
    args = parse_args()
    if args.env:
        from dotenv import load_dotenv
        load_dotenv(args.env, override=True)
    
    from app.core.config import NODE_NAME, NODE_ROLE, NODE_HOST, NODE_PORT, NODE_IP, DATA_DIR, KEYSTORE_PATH
    
    print("=" * 60)
    print(f"🚀 Starting EduChain node '{NODE_NAME}' ({NODE_ROLE})")
    print(f"   Listen: {NODE_HOST}:{NODE_PORT}  |  Public: {NODE_IP}:{NODE_PORT}")
    print(f"   Data:   {DATA_DIR}")
    print("=" * 60)
    
    from app.main import app, init_db
    from app.blockchain_instance import initialize_blockchain
    from app.core.node_bootstrap import load_node_identity, activate_validator, ensure_moet_admin
    from consensus.validator_worker import start_validator_worker
    from network.config_loader import get_config
    
    total_steps = 5 if not args.no_network else 3
    step = 1
    
    print(f"\n[{step}/{total_steps}] Initializing database...")
    init_db()
    
    step += 1
    print(f"\n[{step}/{total_steps}] Initializing blockchain...")
    public_key, private_key = "", None
    if NODE_ROLE != "observer":
        print(f"  Keystore: {KEYSTORE_PATH}")
        public_key, private_key = load_node_identity(KEYSTORE_PATH)
    if NODE_ROLE == "moet" and not private_key:
        sys.exit("✗ Node MOET phải mở khoá được keystore (đặt NODE_PASSPHRASE hoặc nhập khi khởi động)")
    
    try:
        initialize_blockchain(public_key, is_moet=(NODE_ROLE == "moet"), seed_nodes=get_config().get_seed_nodes())
    except RuntimeError as e:
        sys.exit(f"✗ {e}")
    
    if not args.no_network:
        step += 1
        print(f"\n[{step}/{total_steps}] Initializing P2P network...")
        initialize_p2p_network(NODE_IP, NODE_PORT, public_key)
        
        step += 1
        print(f"\n[{step}/{total_steps}] Syncing blockchain from peers...")
        sync_chain_from_peers()
    
    step += 1
    print(f"\n[{step}/{total_steps}] Starting services...")
    
    start_validator_worker(public_key=public_key)
    if private_key:
        if activate_validator(public_key, private_key):
            print("✅ Validator activated")
        else:
            print("⚠️  Không kích hoạt được validator")
    if NODE_ROLE == "moet":
        ensure_moet_admin(public_key, private_key)
    
    if not args.no_network:
        try:
            start_network_background_tasks()
            print("✅ All background services started")
        except Exception as e:
            print(f"⚠️  Network daemon warning: {e}")
    
    print("\n" + "=" * 60)
    print(f"🌐 Server running at: http://{NODE_HOST}:{NODE_PORT}")
    print(f"📡 P2P Network: {'ENABLED' if not args.no_network else 'DISABLED'}")
    print(f"🔑 Role: {NODE_ROLE} ({'ACTIVE' if private_key else 'observer'})")
    print("Press CTRL+C to stop")
    print("=" * 60 + "\n")
    
    app.run(host=NODE_HOST, port=NODE_PORT, debug=True, use_reloader=False)
