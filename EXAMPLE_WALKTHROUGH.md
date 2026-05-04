#!/usr/bin/env python3
"""
Complete Node Activation Protocol - Example Walkthrough
This file demonstrates the complete activation flow step-by-step
"""

# ============================================================================
# EXAMPLE 1: Complete Activation Flow
# ============================================================================

"""
SCENARIO: Node A wants to activate and join the network

Step-by-step execution:
"""

# Step 1: Run active_node.py (user terminal)
"""
$ python active_node.py

======================================================================
  EduChain Node Activation
======================================================================
──────────────────────────────────────────────────────────────────
  Step 1: Loading Keystore
──────────────────────────────────────────────────────────────────
✅ Keystore loaded successfully
ℹ️  Public Key: 04abc123def456...xyz789...
ℹ️  Node Type:  validator

──────────────────────────────────────────────────────────────────
  Step 2: Unlock Private Key
──────────────────────────────────────────────────────────────────
Enter passphrase (attempt 1/3): ****
✅ Private key unlocked successfully

──────────────────────────────────────────────────────────────────
  Step 3: Activating Validator
──────────────────────────────────────────────────────────────────
ℹ️  Sending activation request to local server...
✅ Validator activated successfully!
ℹ️  Validator Index:  0
ℹ️  Total Validators: 3
ℹ️  Status:           Active ✓

──────────────────────────────────────────────────────────────────
  Step 4: Broadcasting Peer Status
──────────────────────────────────────────────────────────────────
ℹ️  Broadcasting activation status to http://127.0.0.1:5000
✅ Status update broadcasted successfully!
✓ Peer 192.168.1.100:5000 is now ACTIVE

──────────────────────────────────────────────────────────────────
  Step 5: Broadcasting Signed Activation Message
──────────────────────────────────────────────────────────────────
ℹ️  Step 5.1: Creating activation payload...
✅ Payload created: 04abc123def456... at 192.168.1.100:5000

ℹ️  Step 5.2: Signing activation payload...
✅ Payload signed: 3045022100abc123def456abc123def456abc123def456abc

ℹ️  Step 5.3: Broadcasting to seed nodes...
✅ Broadcast Results:
  ✓ Successful: 2
  ✗ Failed: 0
  ✓ Node A (Local): HTTP 200 - Activated
  ✓ Node B (Network): HTTP 200 - Activated

──────────────────────────────────────────────────────────────────
  Step 6: Creating Activation Transaction
──────────────────────────────────────────────────────────────────
ℹ️  Creating activation transaction for 0xabc123def456...
✅ Activation transaction created: abc123def456abc123def456abc123de
ℹ️  Transaction will be added to mempool for next block
✅ Transaction added to mempool

======================================================================
  ✅ Node Activated Successfully!
======================================================================

Activation Status:         🟢 ACTIVE
Public Key:                04abc123...xyz789...
Node Type:                 validator
Peer ID:                   04abc123...
Activation Transaction:    abc123def456...
Network Status:            Joined network successfully
"""

# ============================================================================
# EXAMPLE 2: What Happens Behind the Scenes
# ============================================================================

"""
When python active_node.py runs:

╔═══════════════════════════════════════════════════════════════════╗
║                      BEHIND THE SCENES                           ║
╚═══════════════════════════════════════════════════════════════════╝

1. LOAD & DECRYPT CREDENTIALS
   ├─ Read: node.keystore
   ├─ Parse: JSON encrypted key data
   ├─ Decrypt: Using PBKDF2-HMAC-SHA256 + passphrase
   └─ Extract: private_key, public_key

2. ACTIVATE WITH SERVER
   ├─ POST /api/v1/auth/activate-with-key
   ├─ Body: {private_key_hex: "abc123..."}
   ├─ Server: Stores validator state
   └─ Response: {"success": true, "validator_index": 0}

3. CREATE ACTIVATION PAYLOAD
   Payload = {
     "node_id": "04abc123def456...",      // Public Key
     "ip": "192.168.1.100",               // From .node_config.json
     "port": 5000,                        // From .node_config.json
     "timestamp": 1712567890,             // Current Unix timestamp
     "status": "ACTIVE"
   }

4. SIGN THE PAYLOAD
   ├─ JSON Stringify (with sorted keys)
   ├─ SHA256 Hash
   ├─ ECDSA Sign (SECP256k1)
   └─ Result: "3045022100abc123def456..." (DER encoded hex)

5. BROADCAST TO ALL SEED NODES
   For each seed_node in network/config.json:
     POST http://{seed_node.ip}:{seed_node.port}/api/v1/network/peers/activation
     
     Body:
     {
       "type": "NODE_ACTIVATION",
       "payload": {payload},
       "signature": "3045022100..."
     }
     
     Response:
     {
       "success": true,
       "message": "Peer status updated to ACTIVE",
       "peer_id": "04abc123...",
       "action": "added"
     }

6. CREATE ACTIVATION TRANSACTION
   TX = Transaction(
     tx_id: hash(signing_data + signature),
     tx_hash: hash(signing_data),
     sender_pubkey: "04abc123...",
     sender_address: "0xabc123def456...",
     recipient_address: "SYSTEM",
     payload: {
       "type": "PEER_ACTIVATION",
       "node_id": "04abc123...",
       "ip": "192.168.1.100",
       "port": 5000
     },
     signature: "def456...",
     timestamp: 1712567890
   )

7. ADD TO MEMPOOL
   ├─ Insert into TransactionRepository
   ├─ Add to local mempool cache
   └─ Broadcast to network via gossip protocol
"""

# ============================================================================
# EXAMPLE 3: Network Reception (Node B processes activation)
# ============================================================================

"""
When Node A's activation message arrives at Node B:

╔═══════════════════════════════════════════════════════════════════╗
║               NETWORK NODE (Node B) RECEIVES MESSAGE              ║
╚═══════════════════════════════════════════════════════════════════╝

1. RECEIVE HTTP REQUEST
   Endpoint: POST /api/v1/network/peers/activation
   
   Request Body:
   {
     "type": "NODE_ACTIVATION",
     "payload": {
       "node_id": "04abc123...",
       "ip": "192.168.1.100",
       "port": 5000,
       "timestamp": 1712567890,
       "status": "ACTIVE"
     },
     "signature": "3045022100abc123def456..."
   }

2. HANDLER: receive_node_activation()
   ├─ Extract payload and signature
   ├─ Call NodeActivationService.handle_activation_message()
   └─ Return JSON response

3. STEP 1: VERIFY AUTHENTICATION
   ├─ Reconstruct payload JSON (sorted keys, same order)
   ├─ Compute: SHA256(payload_json)
   ├─ Verify: ECDSA.verify(signature, hash, public_key)
   │
   ├─ If SIGNATURE VALID:
   │  └─ Continue to authorization check
   │
   └─ If SIGNATURE INVALID:
      └─ Response: HTTP 401 Unauthorized
         {
           "success": false,
           "message": "Signature verification failed",
           "step": "authentication"
         }

4. STEP 2: CHECK AUTHORIZATION
   ├─ Query database:
   │  SELECT count(*) FROM account
   │  WHERE public_key = '04abc123...'
   │    AND role = 'validator'
   │
   ├─ If FOUND (count > 0):
   │  └─ Continue to peer update
   │
   └─ If NOT FOUND (count = 0):
      └─ Response: HTTP 403 Forbidden
         {
           "success": false,
           "message": "Node is not authorized",
           "step": "authorization"
         }

5. STEP 3: UPDATE PEER DATABASE
   ├─ Generate: peer_id = first 16 chars of public_key
   │           peer_id = "04abc123def456ab"
   │
   ├─ Check: Does peer already exist?
   │
   ├─ If YES (peer exists):
   │  ├─ UPDATE peers
   │  │  SET status = 'ACTIVE', last_seen = now()
   │  │  WHERE peer_id = '04abc123def456ab'
   │  └─ Action: "updated"
   │
   └─ If NO (new peer):
      ├─ INSERT INTO peers
      │  (peer_id, ip_address, port, public_key, node_type, status)
      │  VALUES ('04abc123def456ab', '192.168.1.100', 5000,
      │          '04abc123...', 'validator', 'ACTIVE')
      └─ Action: "added"

6. DATABASE STATE AFTER UPDATE
   
   peers table:
   ┌──────────────────────────────────────────────────────────────┐
   │ peer_id | ip_address | port | public_key | node_type | status │
   ├──────────────────────────────────────────────────────────────┤
   │ 04abc12 | 192.168... | 5000 | 04abc123.. | validator | ACTIVE │
   │ ...other existing peers...                                     │
   └──────────────────────────────────────────────────────────────┘

7. SUCCESS RESPONSE
   HTTP 200 OK
   {
     "success": true,
     "message": "Peer status updated to ACTIVE",
     "peer_id": "04abc123def456ab",
     "action": "added"  // or "updated"
   }

8. OPTIONAL: PROCESS TRANSACTION
   ├─ Extract activation transaction from payload
   ├─ Verify transaction signature
   ├─ Add to mempool
   ├─ Include in next block
   └─ Node A's activation recorded on blockchain
"""

# ============================================================================
# EXAMPLE 4: Database State Before & After
# ============================================================================

"""
BEFORE ACTIVATION:

account table:
┌─────────────────────────────────────────────────────┐
│ address | public_key | role | is_active            │
├─────────────────────────────────────────────────────┤
│ 0xabc.. | 04abc123.. | validator | 1              │  ← Approved
│ 0xdef.. | 04def456.. | client | 1                 │
│ ...other accounts...                              │
└─────────────────────────────────────────────────────┘

peers table (empty or only old peers):
┌─────────────────────────────────────────────────────┐
│ peer_id | ip_address | port | status              │
├─────────────────────────────────────────────────────┤
│ 04def45 | 10.0.0.1 | 5001 | INACTIVE             │
│ ...other old peers...                             │
└─────────────────────────────────────────────────────┘

transactions table:
┌────────────────────────────────────────────────────┐
│ tx_hash | sender_address | payload | timestamp     │
├────────────────────────────────────────────────────┤
│ ...previous transactions...                        │
└────────────────────────────────────────────────────┘


AFTER ACTIVATION:

account table (unchanged):
┌─────────────────────────────────────────────────────┐
│ address | public_key | role | is_active            │
├─────────────────────────────────────────────────────┤
│ 0xabc.. | 04abc123.. | validator | 1              │  ← Still there
│ 0xdef.. | 04def456.. | client | 1                 │
│ ...other accounts...                              │
└─────────────────────────────────────────────────────┘

peers table (UPDATED):
┌─────────────────────────────────────────────────────┐
│ peer_id | ip_address | port | public_key | status │
├─────────────────────────────────────────────────────┤
│ 04abc12 | 192.168.1.100 | 5000 | 04abc123.. | ACTIVE │  ← NEW!
│ 04def45 | 10.0.0.1 | 5001 | 04def456.. | INACTIVE   │
│ ...other peers...                                  │
└─────────────────────────────────────────────────────┘

transactions table (UPDATED):
┌────────────────────────────────────────────────────┐
│ tx_hash | sender_address | payload | timestamp      │
├────────────────────────────────────────────────────┤
│ abc123d | 0xabc.. | {"type":"PEER_ACTIVATION"...} │  ← NEW!
│ ...previous transactions...                        │
└────────────────────────────────────────────────────┘
"""

# ============================================================================
# EXAMPLE 5: Real HTTP Requests & Responses
# ============================================================================

"""
CURL EXAMPLE: Manual Activation Broadcasting

First, create activation payload and sign it:

$ python3 << 'EOF'
from app.services.NodeActivationService import NodeActivationService
from app.utils.CryptoUtils import CryptoUtils

# Generate test keys
pub_key, priv_key = CryptoUtils.generate_key_pair()

# Create payload
payload = NodeActivationService.create_activation_payload(
    node_id=pub_key,
    ip="192.168.1.100",
    port=5000
)

# Sign it
signature = NodeActivationService.sign_activation_payload(
    payload,
    priv_key
)

import json
print(json.dumps({
    "type": "NODE_ACTIVATION",
    "payload": payload,
    "signature": signature
}, indent=2))
EOF

OUTPUT:
{
  "type": "NODE_ACTIVATION",
  "payload": {
    "node_id": "04a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
    "ip": "192.168.1.100",
    "port": 5000,
    "timestamp": 1712567890,
    "status": "ACTIVE"
  },
  "signature": "304502210094abc...def123"
}


Now broadcast using CURL:

$ curl -X POST http://localhost:5000/api/v1/network/peers/activation \
  -H "Content-Type: application/json" \
  -d '{
    "type": "NODE_ACTIVATION",
    "payload": {
      "node_id": "04a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
      "ip": "192.168.1.100",
      "port": 5000,
      "timestamp": 1712567890,
      "status": "ACTIVE"
    },
    "signature": "304502210094abc...def123"
  }' | jq .

RESPONSE (Success):
{
  "success": true,
  "message": "Peer status updated to ACTIVE",
  "peer_id": "04a1b2c3d4e5f6",
  "action": "added"
}

RESPONSE (Invalid signature):
HTTP 401 Unauthorized
{
  "success": false,
  "message": "Signature verification failed",
  "step": "authentication"
}

RESPONSE (Not authorized):
HTTP 403 Forbidden
{
  "success": false,
  "message": "Node is not authorized",
  "step": "authorization"
}
"""

# ============================================================================
# EXAMPLE 6: Monitoring & Debugging
# ============================================================================

"""
To monitor the activation process:

1. WATCH LOGS
   $ tail -f back_end/logs/daily/$(date +%Y-%m-%d).log
   
   Expected output:
   ---
   INFO - Keystore loaded successfully
   INFO - Private key unlocked successfully
   INFO - Validator activated successfully
   INFO - Creating activation payload...
   INFO - Payload created: 04a1b2c3... at 192.168.1.100:5000
   INFO - Payload signed successfully. Signature: 304502...
   INFO - Broadcasting activation to 2 seed nodes...
   INFO - ✓ Activation broadcast to Node A (Local) successful
   INFO - ✓ Activation broadcast to Node B (Network) successful
   INFO - Created activation transaction: abc123def456...
   INFO - Added activation transaction to mempool
   ---

2. CHECK DATABASE
   $ sqlite3 app/database/node_a.db
   
   sqlite> SELECT peer_id, ip_address, status FROM peers;
   04a1b2c3d4e5f6|192.168.1.100|ACTIVE
   
   sqlite> SELECT tx_id, payload FROM transactions 
           WHERE payload LIKE '%PEER_ACTIVATION%';
   abc123def456|{"type":"PEER_ACTIVATION",...}

3. CHECK API STATUS
   $ curl http://localhost:5000/api/v1/network/peers | jq '.[] | {peer_id, status}'
   
   Output:
   {
     "peer_id": "04a1b2c3d4e5f6",
     "status": "ACTIVE"
   }

4. CHECK MEMPOOL
   $ curl http://localhost:5000/api/v1/transactions/mempool | jq '.[] | select(.payload.type=="PEER_ACTIVATION")'
   
   Output:
   {
     "tx_id": "abc123def456...",
     "payload": {
       "type": "PEER_ACTIVATION",
       "node_id": "04a1b2c3...",
       "ip": "192.168.1.100",
       "port": 5000
     }
   }
"""

# ============================================================================
# EXAMPLE 7: Error Scenarios
# ============================================================================

"""
ERROR SCENARIO 1: Keystore Not Found

$ python active_node.py

======================================================================
  EduChain Node Activation
======================================================================
──────────────────────────────────────────────────────────────────
  Step 1: Loading Keystore
──────────────────────────────────────────────────────────────────
❌ Keystore not found: node.keystore
ℹ️  Please run setup.py first to create a keystore

SOLUTION: Run setup.py to create keystore
  $ python setup.py


ERROR SCENARIO 2: Wrong Passphrase

$ python active_node.py
...
──────────────────────────────────────────────────────────────────
  Step 2: Unlock Private Key
──────────────────────────────────────────────────────────────────
Enter passphrase (attempt 1/3): ****
❌ Failed to decrypt private key - wrong passphrase?

Enter passphrase (attempt 2/3): ****
❌ Failed to decrypt private key - wrong passphrase?

Enter passphrase (attempt 3/3): ****
❌ Failed to decrypt private key - wrong passphrase?
❌ Maximum passphrase attempts exceeded

SOLUTION: Use correct passphrase (same one used in setup.py)


ERROR SCENARIO 3: Server Not Running

$ python active_node.py
...
──────────────────────────────────────────────────────────────────
  Step 3: Activating Validator
──────────────────────────────────────────────────────────────────
ℹ️  Sending activation request to local server...
❌ Connection refused - server not running
ℹ️  Make sure 'python run.py' is running at http://127.0.0.1:5000

SOLUTION: Start server in another terminal
  $ python run.py


ERROR SCENARIO 4: Node Not Authorized

[Node B receives activation from unauthorized node]

HTTP 403 Forbidden
{
  "success": false,
  "message": "Node is not authorized",
  "step": "authorization"
}

SOLUTION: Contact MOET admin to authorize the node
  INSERT INTO account (address, public_key, role)
  VALUES ('0x...', '04abc...', 'validator');
"""

# ============================================================================
# EXAMPLE 8: Multi-Node Network Test
# ============================================================================

"""
TESTING WITH 3 NODES:

Initial Setup:
- Node A: 127.0.0.1:5000 (Primary seed)
- Node B: 192.168.1.100:5001 (Secondary seed)
- Node C: 192.168.1.101:5002 (Joining node)

Step 1: Activate Node A (already active as primary seed)
  $ python active_node.py
  ✅ Activation successful
  ✅ Broadcast to seed nodes
  ✅ Transaction added to mempool

Step 2: Start Node B server
  $ NODE_PORT=5001 NODE_IP=192.168.1.100 python run.py
  ✅ Server listening on 192.168.1.100:5001

Step 3: Activate Node B
  $ NODE_PORT=5001 NODE_IP=192.168.1.100 python active_node.py
  ✅ Loads keystore
  ✅ Signs activation with private key
  ✅ Broadcasts to Node A
  ✅ Node A receives and updates peer database
  ✅ Transaction added

Step 4: Verify all nodes see each other
  $ curl http://127.0.0.1:5000/api/v1/network/peers | jq '.[] | .status' | sort | uniq -c
  2 ACTIVE
  
  Both Node A and Node B are ACTIVE

Step 5: Start Node C and activate
  $ NODE_PORT=5002 NODE_IP=192.168.1.101 python run.py
  $ NODE_PORT=5002 NODE_IP=192.168.1.101 python active_node.py
  ✅ Node C activates and broadcasts
  ✅ Both Node A and B receive activation from Node C
  ✅ Both update their peer database

Step 6: Verify all 3 nodes see each other
  $ curl http://127.0.0.1:5000/api/v1/network/peers | jq '.[] | {peer_id, status}' | grep ACTIVE | wc -l
  3
  
  All three nodes are ACTIVE

Network is now fully interconnected! ✅
"""

print(__doc__)
