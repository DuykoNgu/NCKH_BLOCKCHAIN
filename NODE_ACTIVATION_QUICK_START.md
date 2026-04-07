"""
Node Activation Protocol - Quick Start Guide

This guide shows how to use the node activation system.
"""

# ============================================================================
# STEP 1: SETUP - Create and Configure Nodes
# ============================================================================

"""
1. Generate keystore for each node
   python setup.py
   
   This creates:
   - node.keystore (encrypted private key)
   - Public key extracted from keystore
   - Node account in database

2. Configure seed nodes in network/config.json
   {
     "seed_nodes": [
       {"name": "Node A", "ip": "127.0.0.1", "port": 5001, ...},
       {"name": "Node B", "ip": "192.168.1.100", "port": 5001", ...}
     ]
   }

3. Approve nodes as validators (by MOET)
   - Insert into account table with role='validator'
"""

# ============================================================================
# STEP 2: RUN - Start Node and Activate
# ============================================================================

"""
Terminal 1 - Start Blockchain Server:
  cd back_end
  python run.py
  # Server runs at http://127.0.0.1:5000

Terminal 2 - Activate Node:
  python active_node.py
  # Follow prompts:
  # 1. Keystore loads automatically
  # 2. Enter passphrase to decrypt private key
  # 3. Node activates
  # 4. Signed activation broadcast to network
  # 5. Activation transaction created
"""

# ============================================================================
# STEP 3: VERIFY - Check Activation Status
# ============================================================================

"""
Check Peer Status:
  curl http://127.0.0.1:5000/api/v1/network/peers
  
  Response:
  [
    {
      "peer_id": "04abc123...",
      "ip_address": "192.168.1.100",
      "port": 5000,
      "public_key": "04abc...",
      "status": "ACTIVE",
      "node_type": "validator"
    }
  ]

Check Transaction Mempool:
  curl http://127.0.0.1:5000/api/v1/transactions/mempool
  
  Look for transactions with:
  "payload": {
    "type": "PEER_ACTIVATION",
    "node_id": "04abc...",
    "ip": "192.168.1.100",
    "port": 5000
  }
"""

# ============================================================================
# STEP 4: UNDERSTAND - Protocol Flow
# ============================================================================

"""
Node Activation Flow:

┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: Node A Activation                                      │
└─────────────────────────────────────────────────────────────────┘

1. Load Keystore
   ├─ Read encrypted keystore file
   └─ Extract public key and encrypted private key

2. Unlock Private Key
   ├─ Request passphrase from user
   └─ Decrypt private key using PBKDF2

3. Activate Validator
   ├─ Send activation request to local server
   └─ Server marks node as active in blockchain

4. Create Activation Payload
   Payload = {
     "node_id": "04abc...",      # Public key
     "ip": "192.168.1.100",      # Node IP
     "port": 5000,               # Node port
     "timestamp": 1234567890,    # Current time
     "status": "ACTIVE"
   }

5. Sign the Payload
   Signature = ECDSA-SECP256k1(
     data = JSON.stringify(Payload),
     private_key = node_private_key,
     hash = SHA256
   )

6. Broadcast Signed Message
   For each seed_node:
     POST /api/v1/network/peers/activation
     Header: Content-Type: application/json
     Body: {
       "type": "NODE_ACTIVATION",
       "payload": Payload,
       "signature": Signature
     }

7. Create Activation Transaction
   TX = Transaction(
     sender_pubkey = node_public_key,
     recipient_address = "SYSTEM",
     payload.type = "PEER_ACTIVATION",
     signature = TX_signature
   )
   └─ Add to mempool

┌─────────────────────────────────────────────────────────────────┐
│ Phase 2: Network Reception (Node B, C, ...)                     │
└─────────────────────────────────────────────────────────────────┘

1. Receive Activation Message
   POST /api/v1/network/peers/activation
   ├─ Extract: payload, signature, node_id

2. Verify Authentication
   ├─ Reconstruct: JSON(payload, sorted)
   ├─ Hash: SHA256(payload)
   ├─ Verify: ECDSA.verify(signature, hash, node_id)
   └─ If FAIL → Return 401 Unauthorized

3. Check Authorization
   ├─ Query: SELECT * FROM account WHERE public_key=? AND role='validator'
   └─ If NOT FOUND → Return 403 Forbidden

4. Update Peer Status
   ├─ If peer exists: UPDATE peers SET status='ACTIVE'
   └─ If new peer: INSERT into peers WITH status='ACTIVE'

5. Log Success
   └─ Peer is now ACTIVE in network
"""

# ============================================================================
# PYTHON API USAGE
# ============================================================================

"""
Use NodeActivationService Directly:

from app.services.NodeActivationService import NodeActivationService
from app.models.Transaction import Transaction

# 1. Create activation payload
payload = NodeActivationService.create_activation_payload(
    node_id="04abc...",
    ip="192.168.1.100",
    port=5000
)

# 2. Sign the payload
signature = NodeActivationService.sign_activation_payload(
    payload,
    private_key="abc123def456..."
)

# 3. Verify signature
is_valid = NodeActivationService.verify_activation_signature(
    payload,
    signature,
    public_key="04abc..."
)

# 4. Broadcast to peers
results = NodeActivationService.broadcast_activation(
    node_id="04abc...",
    ip="192.168.1.100",
    port=5000,
    signature=signature,
    seed_nodes=[
        {"name": "Node A", "ip": "127.0.0.1", "port": 5001},
        {"name": "Node B", "ip": "192.168.1.100", "port": 5001}
    ]
)

# 5. Create transaction
tx = NodeActivationService.create_activation_transaction(
    node_id="04abc...",
    ip="192.168.1.100",
    port=5000,
    sender_address="0xabc...",
    private_key="def456..."
)

# 6. Add to mempool
NodeActivationService.add_activation_to_mempool(tx)

# 7. Handle received activation (on other nodes)
result = NodeActivationService.handle_activation_message({
    "type": "NODE_ACTIVATION",
    "payload": payload,
    "signature": signature
})
"""

# ============================================================================
# CURL EXAMPLES
# ============================================================================

"""
1. Broadcast Activation Message:
   curl -X POST http://localhost:5000/api/v1/network/peers/activation \
     -H "Content-Type: application/json" \
     -d '{
       "type": "NODE_ACTIVATION",
       "payload": {
         "node_id": "04abc123...",
         "ip": "192.168.1.100",
         "port": 5000,
         "timestamp": 1234567890,
         "status": "ACTIVE"
       },
       "signature": "3045022100abc..."
     }'

2. Get All Peers:
   curl http://localhost:5000/api/v1/network/peers

3. Get Active Peer:
   curl http://localhost:5000/api/v1/network/peers \
     | grep -A5 '"status": "ACTIVE"'

4. Get Pending Peers:
   curl http://localhost:5000/api/v1/network/peers/pending
"""

# ============================================================================
# DATABASE INSPECTION
# ============================================================================

"""
Check Peers in Database:
  sqlite3 app/database/node_a.db "SELECT * FROM peers;"
  
  Output:
  peer_id|ip_address|port|public_key|node_type|status|last_seen
  04abc123|192.168.1.100|5000|04abc...|validator|ACTIVE|1234567890

Check Authorized Validators:
  sqlite3 app/database/node_a.db \
    "SELECT address, public_key, role FROM account WHERE role='validator';"

Check Activation Transactions:
  sqlite3 app/database/node_a.db \
    "SELECT tx_id, payload FROM transactions WHERE payload LIKE '%PEER_ACTIVATION%';"
"""

# ============================================================================
# DEBUGGING TIPS
# ============================================================================

"""
1. Enable Detailed Logging:
   - Set LOG_LEVEL=DEBUG in .env
   - Check logs/daily/ folder for dated logs

2. Verify Cryptography:
   - Ensure private_key is hex format (64 chars for SECP256k1)
   - Ensure public_key is hex format (128 chars)
   - Both can be prefixed with "04" or complete form

3. Check Network Connectivity:
   - Verify seed nodes are reachable: ping <ip>
   - Check ports are open: nc -zv <ip> <port>
   - Check firewall rules

4. Database Issues:
   - Verify database file exists: app/database/node_a.db
   - Check permissions: ls -la app/database/
   - Try resetting: rm app/database/node_a.db && python app/database/database.py

5. Signature Issues:
   - Verify payload JSON is sorted by keys
   - Use same hash function: SHA256
   - Use same crypto curve: SECP256k1
"""

# ============================================================================
# COMMON ISSUES AND SOLUTIONS
# ============================================================================

"""
Issue: "Keystore not found"
  Solution: Run setup.py to create keystore

Issue: "Failed to decrypt private key - wrong passphrase?"
  Solution: Use the passphrase you set during setup.py

Issue: "Connection refused - server not running"
  Solution: Start run.py in another terminal before running active_node.py

Issue: "Signature verification failed"
  Solution: 
  - Check that public_key matches private_key
  - Ensure payload JSON is sorted
  - Verify hash function is SHA256

Issue: "Node is not authorized"
  Solution: Contact MOET administrator to approve your validator
    INSERT INTO account (address, public_key, role) VALUES (?, ?, 'validator');

Issue: "Peer not found or update failed"
  Solution: 
  - Check database connectivity
  - Verify peers table exists
  - Check database permissions
"""
