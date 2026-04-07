# Node Activation Protocol Implementation

## Overview

This document describes the complete node activation flow for EduChain, implementing a cryptographic authentication protocol where nodes can activate and announce themselves to the network with cryptographic verification.

## Architecture

The node activation system consists of three main components:

### 1. **Node A (Activating Node)**
- Loads keystore and unlocks private key
- Creates a signed payload containing node identification info
- Broadcasts the signed message to all seed nodes
- Creates an activation transaction for the mempool

### 2. **Node B, C, ... (Receiving Nodes)**
- Receives activation message from Node A
- Verifies authentication (signature verification)
- Checks authorization (peer is in approved validators list)
- Updates peer status in database (PENDING → ACTIVE)
- Optionally processes activation transaction

### 3. **System Components**
- `PeerRepository`: Database operations for peer management
- `NodeActivationService`: Core service handling the protocol
- `NodeActivator`: Command-line tool orchestrating the flow

---

## Detailed Flow

### **Phase 1: Node Initialization (Node A)**

#### Step 1: Load and Decrypt Credentials
```
active_node.py starts
├─ Load keystore from file
├─ Request passphrase from user
├─ Decrypt private key securely
└─ Extract public key
```

**File**: `active_node.py` → `NodeActivator.load_keystore()` & `unlock_private_key()`

#### Step 2: Activate Validator
```
├─ Send activation request to local running server (run.py)
├─ Server processes activation
└─ Validator is set as active in the blockchain
```

**File**: `active_node.py` → `NodeActivator.activate_validator()`
**Endpoint**: `POST /api/v1/auth/activate-with-key`

#### Step 3: Create Signed Payload
```
Payload = {
    "node_id": "0x04abc...",      // Public Key
    "ip": "192.168.1.100",         // Node IP
    "port": 5000,                  // Node Port
    "timestamp": 1234567890,       // Current timestamp
    "status": "ACTIVE"             // Status indicator
}
```

**Created by**: `NodeActivationService.create_activation_payload()`

#### Step 4: Sign the Payload
```
Signature = ECDSA-SECP256k1(
    data = JSON.stringify(Payload, sorted),
    private_key = node_private_key,
    hash_function = SHA256
)
```

**Implementation**: `NodeActivationService.sign_activation_payload()`
**Crypto**: `CryptoUtils.sign_data()` using ECDSA SECP256k1

#### Step 5: Broadcast Signed Message
```
BroadcastMessage = {
    "type": "NODE_ACTIVATION",
    "payload": Payload,
    "signature": Signature_hex
}

For each seed_node in config:
  POST /api/v1/network/peers/activation
  └─ BroadcastMessage
```

**Implementation**: `NodeActivationService.broadcast_activation()`
**Broadcast Target**: All seed nodes from `network/config.json`
**Endpoint Receiver**: `POST /api/v1/network/peers/activation` on each node

#### Step 6: Create Activation Transaction (Optional)
```
Transaction = {
    "type": "TX_TYPE_PEER_ACTIVATION",
    "tx_id": hash(signing_data + signature),
    "tx_hash": hash(signing_data),
    "sender_pubkey": node_public_key,
    "sender_address": address_from_pubkey,
    "recipient_address": "SYSTEM",
    "payload": {
        "type": "PEER_ACTIVATION",
        "node_id": node_public_key,
        "ip": node_ip,
        "port": node_port
    },
    "signature": transaction_signature,
    "timestamp": current_time
}
```

**Created by**: `NodeActivationService.create_activation_transaction()`
**Added to**: Mempool via `NodeActivationService.add_activation_to_mempool()`
**Processing**: Transaction will be included in upcoming blocks

---

### **Phase 2: Message Reception (Node B, C, ...)**

#### Step 1: Receive Activation Message
```
Endpoint: POST /api/v1/network/peers/activation
Receives: {
    "type": "NODE_ACTIVATION",
    "payload": { ... },
    "signature": "..."
}
```

**Handler**: `NetworkController.receive_node_activation()`
**Service**: `NodeActivationService.handle_activation_message()`

#### Step 2: Extract Information
```
node_id = payload['node_id']           // Public Key
ip = payload['ip']                     // IP Address  
port = payload['port']                 // Port Number
signature = message['signature']       // Signature to verify
```

#### Step 3: Verify Authentication
```
VERIFICATION PROCESS:
├─ Reconstruct payload JSON (sorted keys)
├─ Hash payload with SHA256
├─ Verify signature using public_key (node_id)
│   └─ If verification fails: REJECT (401 Unauthorized)
└─ Extract verified data
```

**Implementation**: `NodeActivationService.verify_activation_signature()`
**Crypto**: `CryptoUtils.verify_signature()` using ECDSA SECP256k1

▸ **Result**: 
- ✅ Valid signature → Continue to authorization
- ❌ Invalid signature → Reject with error

#### Step 4: Check Authorization
```
AUTHORIZATION CHECK:
├─ Query account table for public_key
├─ Check if role = 'validator'
│   └─ If not found/not validator: REJECT (403 Forbidden)
└─ Continue if authorized
```

**Implementation**: `PeerRepository.is_peer_authorized()`

Query executed:
```sql
SELECT count(*) FROM account 
WHERE public_key = ? AND role = 'validator'
```

▸ **Result**:
- ✅ Authorized → Continue to peer update
- ❌ Not authorized → Reject with error

#### Step 5: Update Peer Status
```
PEER UPDATE PROCESS:
├─ Generate peer_id from node_id
│   └─ peer_id = first 16 chars of public_key
│
├─ Check if peer exists:
│   ├─ YES: Update peer
│   │   └─ UPDATE peers 
│   │      SET status = 'ACTIVE', last_seen = now
│   │      WHERE peer_id = ?
│   │
│   └─ NO: Insert new peer
│       └─ INSERT peers
│          (peer_id, ip, port, public_key, node_type, status)
│          VALUES (?, ?, ?, ?, 'validator', 'ACTIVE')
```

**Implementation**: `PeerRepository.add_or_update_peer()` & `update_peer_status()`

▸ **Result**: Peer is now ACTIVE in the network

#### Step 6: Process Activation Transaction
```
If included in BroadcastMessage.payload.transaction:
├─ Verify transaction signature
├─ Add to mempool
└─ Include in next block
```

---

## Data Models

### Peer Table
```sql
CREATE TABLE peers (
    peer_id TEXT PRIMARY KEY,           -- First 16 chars of public_key
    ip_address TEXT NOT NULL,           -- Node IP
    port INTEGER NOT NULL,              -- Node port
    public_key TEXT,                    -- Full public key
    node_type TEXT,                     -- 'validator', 'observer'
    status TEXT DEFAULT 'PENDING',      -- 'PENDING', 'INACTIVE', 'ACTIVE'
    last_seen TIMESTAMP,                -- Last heartbeat
    created_at TIMESTAMP                -- Creation time
);
```

**Peer Lifecycle**:
1. `PENDING` → Registered, waiting for approval
2. `INACTIVE` → Approved, waiting for activation message
3. `ACTIVE` → Activated, can participate in consensus

### Account Table (for authorization)
```sql
CREATE TABLE account (
    address TEXT PRIMARY KEY,
    public_key TEXT NOT NULL,
    role TEXT,                          -- 'moet', 'validator', 'client'
    org_name TEXT,
    full_name TEXT,
    is_active INTEGER,
    created_at TIMESTAMP
);
```

### Transaction Model
```python
class Transaction:
    tx_id: str                  # Unique transaction ID
    tx_hash: str                # Transaction hash
    sender_pubkey: str          # Sender's public key
    sender_address: str         # Sender's address
    recipient_address: str      # Recipient address or "SYSTEM"
    payload: Dict[str, Any]     # Payload (can include PEER_ACTIVATION)
    signature: str              # Transaction signature
    timestamp: float            # Creation time
    block_id: str              # Block it belongs to
```

---

## API Endpoints

### 1. **Activation Endpoint** (Receives activation messages)
```
POST /api/v1/network/peers/activation

Request:
{
    "type": "NODE_ACTIVATION",
    "payload": {
        "node_id": "04abc...",
        "ip": "192.168.1.100",
        "port": 5000,
        "timestamp": 1234567890,
        "status": "ACTIVE"
    },
    "signature": "3045022100abc..."
}

Response:
{
    "success": true,
    "message": "Peer status updated to ACTIVE",
    "peer_id": "04abc123",
    "action": "added"  // or "updated"
}

Errors:
- 401: Signature verification failed
- 403: Node not authorized (not in approved validators)
- 400: Invalid request format
```

**Handler**: `NetworkController.receive_node_activation()`

### 2. **Status Update Endpoint** (Backward compatibility)
```
POST /api/v1/network/peers/status-update

Request:
{
    "ip_address": "192.168.1.100",
    "port": 5000,
    "public_key": "04abc...",
    "node_type": "validator"
}

Response:
{
    "success": true,
    "message": "Peer activated"
}
```

**Handler**: `NetworkController.update_peer_status()`

---

## Security Features

### 1. **Cryptographic Authentication**
- **Algorithm**: ECDSA SECP256k1
- **Hash Function**: SHA256
- **Key Format**: Hexadecimal strings
- Prevents forged activation messages

### 2. **Authorization Check**
- Nodes must be pre-registered as validators in account table
- Only authorized nodes can be activated
- Prevents unauthorized nodes from joining

### 3. **Secure Key Management**
- Private keys are encrypted in keystore files
- PBKDF2-HMAC-SHA256 for key derivation
- Passphrase-protected unlock mechanism
- Keys are securely deleted from memory after use

### 4. **Timestamp Validation**
- Activation payloads include timestamp
- Prevents replay attacks
- Can be enhanced with NTP time synchronization

---

## Usage Example

### 1. **Node A Activation**

```bash
# Terminal 1: Start the blockchain server
cd back_end
python run.py

# Terminal 2: Activate the node (in another terminal)
python active_node.py

# Output:
# ======================================================================
#   EduChain Node Activation
# ======================================================================
# ──────────────────────────────────────────────────────────────────
#   Step 1: Loading Keystore
# ──────────────────────────────────────────────────────────────────
# ✅ Keystore loaded successfully
# ℹ️  Public Key: 04abc123...xyz789...
# ℹ️  Node Type: validator
# 
# ──────────────────────────────────────────────────────────────────
#   Step 2: Unlock Private Key
# ──────────────────────────────────────────────────────────────────
# Enter passphrase (attempt 1/3): ****
# ✅ Private key unlocked successfully
#
# ──────────────────────────────────────────────────────────────────
#   Step 3: Activating Validator
# ──────────────────────────────────────────────────────────────────
# ℹ️  Sending activation request to local server...
# ✅ Validator activated successfully!
#
# ──────────────────────────────────────────────────────────────────
#   Step 4: Broadcasting Peer Status
# ──────────────────────────────────────────────────────────────────
# ℹ️  Broadcasting activation status to http://127.0.0.1:5000
# ✅ Status update broadcasted successfully!
#
# ──────────────────────────────────────────────────────────────────
#   Step 5: Broadcasting Signed Activation Message
# ──────────────────────────────────────────────────────────────────
# ℹ️  Step 5.1: Creating activation payload...
# ✅ Payload created: 04abc123... at 192.168.1.100:5000
# ℹ️  Step 5.2: Signing activation payload...
# ✅ Payload signed: 3045022100...
# ℹ️  Step 5.3: Broadcasting to seed nodes...
# ✅ Broadcast Results:
#   ✓ Successful: 2
#   ✗ Failed: 0
#   ✓ Node A (Local): Activated
#   ✓ Node B (Network): Activated
#
# ──────────────────────────────────────────────────────────────────
#   Step 6: Creating Activation Transaction
# ──────────────────────────────────────────────────────────────────
# ℹ️  Creating activation transaction...
# ✅ Activation transaction created: abc123def456...
# ℹ️  Transaction will be added to mempool for next block
# ✅ Transaction added to mempool
#
# ======================================================================
#   ✅ Node Activated Successfully!
# ======================================================================
```

### 2. **Network Reception (Node B)**

When Node B receives the activation message:

```python
# In NetworkController.receive_node_activation()
{
    "success": true,
    "message": "Peer status updated to ACTIVE",
    "peer_id": "04abc123...",
    "action": "added"  # New peer was added
}

# In database:
# peers table now contains:
# - peer_id: "04abc123..."
# - ip_address: "192.168.1.100"
# - port: 5000
# - public_key: "04abc123...xyz789..."
# - node_type: "validator"
# - status: "ACTIVE"  ← Updated from PENDING
# - last_seen: <current_timestamp>
```

---

## File Structure

```
back_end/
├── active_node.py                              # Main activation script
├── app/
│   ├── services/
│   │   ├── NodeActivationService.py            # Core service (NEW)
│   │   ├── TransactionService.py               # Transaction operations
│   │   └── NetworkService.py                   # Network operations
│   ├── repositories/
│   │   ├── PeerRepository.py                   # Peer DB operations (NEW)
│   │   ├── TransactionRepository.py            # Transaction DB operations
│   │   └── AccountRepository.py                # Account DB operations
│   ├── controllers/
│   │   └── v1/
│   │       └── NetworkController.py            # Network endpoints (UPDATED)
│   ├── models/
│   │   ├── Transaction.py                      # Transaction model
│   │   └── Account.py                          # Account model
│   ├── utils/
│   │   ├── CryptoUtils.py                      # Cryptographic functions
│   │   ├── KeystoreManager.py                  # Keystore operations
│   │   └── logger.py                           # Logging utilities
│   └── database/
│       ├── database.py                         # DB schema definition
│       └── connection.py                       # DB connection
├── network/
│   └── config.json                             # Network configuration
└── requirements.txt                            # Dependencies
```

---

## Configuration

### Network Configuration (`network/config.json`)
```json
{
    "seed_nodes": [
        {
            "name": "Node A (Local)",
            "ip": "127.0.0.1",
            "port": 5001,
            "public_key": "04abc...",
            "role": "validator"
        },
        {
            "name": "Node B (Network)",
            "ip": "192.168.1.100",
            "port": 5001,
            "public_key": "04def...",
            "role": "validator"
        }
    ]
}
```

### Environment Variables
```
NODE_IP=127.0.0.1              # Node listen IP
NODE_PORT=5000                 # Node listen port
KEYSTORE_PATH=node.keystore    # Keystore file location
BOOTSTRAP_NODE_URL=http://127.0.0.1:5000  # Bootstrap node
```

---

## Testing

### Test Scenarios

#### 1. **Successful Activation**
```python
def test_node_activation_success():
    # Setup: Create authorized validator in account table
    # Execute: Run active_node.py
    # Verify:
    # 1. Payload created with correct data
    # 2. Signature verifies correctly
    # 3. Broadcast succeeds
    # 4. Peer status updated to ACTIVE
    # 5. Transaction added to mempool
```

#### 2. **Unauthorized Node**
```python
def test_unauthorized_node():
    # Setup: Try to activate node not in account table
    # Execute: Receive activation message
    # Verify: Authorization check fails (403)
```

#### 3. **Invalid Signature**
```python
def test_invalid_signature():
    # Setup: Modify signature before verification
    # Execute: Receive activation message
    # Verify: Signature verification fails (401)
```

#### 4. **Duplicate Activation**
```python
def test_duplicate_activation():
    # Setup: Node already ACTIVE in peers table
    # Execute: Receive activation message again
    # Verify: Peer status updated to ACTIVE (idempotent)
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Keystore not found" | Keystore file missing | Run `setup.py` first |
| "Failed to decrypt private key" | Wrong passphrase | Re-run with correct passphrase |
| "Connection refused" | Server not running | Start `run.py` in another terminal |
| "Signature verification failed" | Wrong public key or modified payload | Check public key matches |
| "Node is not authorized" | Not in approved validators | Contact MOET administrator |
| "Peer not found or update failed" | DB connection issue | Check database connectivity |

---

## Performance Considerations

- **Signature verification**: ~1-5ms per signature
- **Database updates**: ~10-20ms per peer update
- **Broadcast latency**: ~50-200ms per seed node (network dependent)
- **Transaction creation**: ~2-5ms

### Optimization Tips
1. Batch multiple peer updates when possible
2. Use connection pooling for database operations
3. Implement request timeouts for broadcasts
4. Cache authorization checks with TTL

---

## Future Enhancements

1. **Reputation System**
   - Track peer reliability (uptime, message quality)
   - Penalize misbehaving peers

2. **Peer Rotation**
   - Dynamic seed node selection
   - Blacklisting unreliable peers

3. **Time Synchronization**
   - NTP-based timestamp validation
   - Reject activations with stale timestamps

4. **Metrics and Monitoring**
   - Track activation success rate
   - Monitor peer participation
   - Alert on repeated failures

5. **Multi-Sig Approval**
   - MOET quorum approval for new validators
   - On-chain voting for modifications

---

## References

- **ECDSA Specification**: SEC 2: Recommended Elliptic Curve Domain Parameters
- **SHA256**: FIPS 180-4 (Secure Hash Standard)
- **Blockchain P2P**: Bitcoin P2P Protocol
- **Consensus**: Proof of Authority (PoA) consensus
