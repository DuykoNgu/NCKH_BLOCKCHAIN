# Node Activation Protocol - Implementation Summary

## Overview

This implementation adds a complete cryptographic node activation protocol to the EduChain blockchain. It enables nodes to:

1. **Sign their activation messages** using ECDSA SECP256k1
2. **Broadcast signed payloads** to all seed nodes in the network
3. **Verify and authenticate** activation messages on receiving nodes
4. **Update peer status** in the network database
5. **Create activation transactions** for blockchain consensus tracking

---

## What Was Implemented

### New Files Created

#### 1. **Core Service**: `app/services/NodeActivationService.py`
- **Purpose**: Implements the node activation protocol logic
- **Key Methods**:
  - `create_activation_payload()` - Creates JSON payload with node info
  - `sign_activation_payload()` - Signs payload using ECDSA SECP256k1
  - `verify_activation_signature()` - Verifies signature authenticity
  - `broadcast_activation()` - Broadcasts to all seed nodes
  - `handle_activation_message()` - Processes received activation (verification + authentication + authorization)
  - `create_activation_transaction()` - Creates transaction for mempool
  - `add_activation_to_mempool()` - Adds transaction to mempool

**Lines**: ~380 | **Language**: Python | **Dependencies**: CryptoUtils, PeerRepository, TransactionService

#### 2. **Data Repository**: `app/repositories/PeerRepository.py`
- **Purpose**: Database operations for peer management
- **Key Methods**:
  - `add_or_update_peer()` - Insert or update peer record
  - `get_peer_by_id()` - Retrieve peer by ID
  - `get_peers_by_status()` - Get all peers with specific status
  - `update_peer_status()` - Update peer status (PENDING → ACTIVE)
  - `get_peer_by_public_key()` - Find peer by public key
  - `is_peer_authorized()` - Check if peer is in authorized validators

**Lines**: ~200 | **Language**: Python | **Database**: SQLite

#### 3. **Test Suite**: `back_end/tests/test_node_activation.py`
- **Purpose**: Unit and integration tests for activation protocol
- **Test Classes**:
  - `TestNodeActivationService` - Tests service methods
  - `TestPeerRepository` - Tests database operations
  - `TestActivationProtocol` - Integration tests

**Lines**: ~440 | **Language**: Python | **Framework**: unittest

### Files Modified

#### 1. **API Controller**: `app/controllers/v1/NetworkController.py`
- **Added Endpoint**: `POST /api/v1/network/peers/activation`
- **Purpose**: Receives and processes node activation messages
- **Handler**: `receive_node_activation()`
- **Changes**: Added ~100 lines of code after `/peers/status-update` endpoint

#### 2. **Node Activation Script**: `active_node.py`
- **Added Imports**: `NodeActivationService`, `CryptoUtils`, type hints
- **Added Methods**:
  - `broadcast_signed_activation()` - Creates and broadcasts signed payload
  - `create_activation_transaction()` - Creates activation transaction
- **Modified Methods**: `run()` - Now includes signed broadcast and transaction creation
- **Changes**: Added ~250 lines of code with detailed logging

### Documentation Files

#### 1. **NODE_ACTIVATION_PROTOCOL.md**
- Comprehensive protocol documentation
- Architecture overview
- Detailed Phase 1 & Phase 2 flows
- Data models and SQL schemas
- API endpoint specifications
- Security features explanation
- Usage examples and testing scenarios
- Future enhancements

#### 2. **NODE_ACTIVATION_QUICK_START.md**
- Quick reference guide
- Setup instructions
- Python API usage examples
- CURL examples for testing
- Database inspection commands
- Debugging tips
- Common issues and solutions

---

## How It Works

### **Activation Flow Overview**

```
┌──────────────────────────────────────────────────────────────────┐
│                     NODE A ACTIVATION                            │
└──────────────────────────────────────────────────────────────────┘

1. User runs: python active_node.py
   ├─ Load & decrypt keystore
   ├─ Activate validator with server
   ├─ Create activation payload
   ├─ Sign payload with private key
   ├─ Broadcast to all seed nodes
   └─ Create activation transaction

    Broadcast Message:
    {
      "type": "NODE_ACTIVATION",
      "payload": {
        "node_id": "04abc...",
        "ip": "192.168.1.100",
        "port": 5000,
        "timestamp": 123456789,
        "status": "ACTIVE"
      },
      "signature": "3045022100abc..."
    }

┌──────────────────────────────────────────────────────────────────┐
│               NETWORK RECEPTION (Nodes B, C, ...)                │
└──────────────────────────────────────────────────────────────────┘

Endpoint: POST /api/v1/network/peers/activation

Process:
1. Receive activation message
2. Extract payload & signature
3. Verify signature authenticity
   └─ ECDSA.verify(signature, hash, public_key)
   └─ If FAIL → Return 401
4. Check authorization
   └─ Query: SELECT WHERE public_key='0x...' AND role='validator'
   └─ If NOT found → Return 403
5. Update peer in database
   ├─ If exists: UPDATE peer SET status='ACTIVE'
   ├─ If new: INSERT peer WITH status='ACTIVE'
   └─ Peer now ACTIVE in network
6. Return success response

Response:
{
  "success": true,
  "message": "Peer status updated to ACTIVE",
  "peer_id": "04abc123...",
  "action": "added"  // or "updated"
}
```

---

## Key Features

### 1. **Cryptographic Authentication**
- ✅ ECDSA SECP256k1 signature scheme
- ✅ SHA256 hashing for payload
- ✅ Prevents forged activation messages
- ✅ Ensures message integrity

### 2. **Authorization Layer**
- ✅ Checks if node is approved validator
- ✅ Prevents unauthorized nodes from joining
- ✅ Requires pre-registration in account table

### 3. **Peer Status Lifecycle**
- ✅ `PENDING` → Registered, awaiting approval
- ✅ `INACTIVE` → Approved, awaiting activation
- ✅ `ACTIVE` → Activated, can participate

### 4. **Blockchain Integration**
- ✅ Creates activation transactions for consensus
- ✅ Transactions added to mempool
- ✅ Included in upcoming blocks
- ✅ Provides on-chain activation record

### 5. **Network Broadcasting**
- ✅ Broadcasts to all seed nodes
- ✅ Handles partial failures gracefully
- ✅ Retry mechanism with configurable delays
- ✅ Detailed success/failure reporting

---

## Usage

### Step 1: Start Blockchain Server
```bash
cd back_end
python run.py
# Server runs at http://127.0.0.1:5000
```

### Step 2: Activate Node
```bash
python active_node.py

# Follow prompts:
# 1. Keystore loads automatically
# 2. Enter passphrase to decrypt private key
# 3. Node activates locally
# 4. Signed activation message broadcasts to network
# 5. Activation transaction created
```

### Step 3: Verify Activation
```bash
# Check peers
curl http://127.0.0.1:5000/api/v1/network/peers

# Check activation transactions in mempool
curl http://127.0.0.1:5000/api/v1/transactions/mempool

# Check database
sqlite3 app/database/node_a.db "SELECT * FROM peers WHERE status='ACTIVE';"
```

---

## API Endpoints

### Activation Endpoint
```
POST /api/v1/network/peers/activation

Request:
{
  "type": "NODE_ACTIVATION",
  "payload": {
    "node_id": "04abc123...",
    "ip": "192.168.1.100",
    "port": 5000,
    "timestamp": 1234567890,
    "status": "ACTIVE"
  },
  "signature": "3045022100abc..."
}

Response (Success - 200):
{
  "success": true,
  "message": "Peer status updated to ACTIVE",
  "peer_id": "04abc123...",
  "action": "added"  // or "updated"
}

Response (Invalid Signature - 401):
{
  "success": false,
  "message": "Signature verification failed",
  "step": "authentication"
}

Response (Unauthorized - 403):
{
  "success": false,
  "message": "Node is not authorized",
  "step": "authorization"
}
```

---

## Python API Usage

```python
from app.services.NodeActivationService import NodeActivationService

# 1. Create payload
payload = NodeActivationService.create_activation_payload(
    node_id="04abc...",
    ip="192.168.1.100",
    port=5000
)

# 2. Sign payload
signature = NodeActivationService.sign_activation_payload(
    payload,
    private_key="def456..."
)

# 3. Verify signature
is_valid = NodeActivationService.verify_activation_signature(
    payload,
    signature,
    public_key="04abc..."
)

# 4. Broadcast
results = NodeActivationService.broadcast_activation(
    node_id="04abc...",
    ip="192.168.1.100",
    port=5000,
    signature=signature,
    seed_nodes=[...]
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

# 7. Handle received activation
result = NodeActivationService.handle_activation_message({
    "type": "NODE_ACTIVATION",
    "payload": payload,
    "signature": signature
})
```

---

## Database Schema

### Peers Table
```sql
CREATE TABLE peers (
    peer_id TEXT PRIMARY KEY,
    ip_address TEXT NOT NULL,
    port INTEGER NOT NULL,
    public_key TEXT,
    node_type TEXT,
    status TEXT DEFAULT 'PENDING',
    last_seen TIMESTAMP,
    created_at TIMESTAMP
);

-- After activation, peer record looks like:
-- peer_id | ip_address | port | public_key | node_type | status | last_seen | created_at
-- 04abc123 | 192.168.1.100 | 5000 | 04abc... | validator | ACTIVE | 1234567890 | 1234567800
```

### Account Table (for authorization)
```sql
-- Must have record like:
-- address | public_key | role | is_active
-- 0xabc123 | 04abc... | validator | 1
```

---

## Configuration

### Network Config (`network/config.json`)
```json
{
  "seed_nodes": [
    {
      "name": "Node A",
      "ip": "127.0.0.1",
      "port": 5001,
      "public_key": "04abc...",
      "role": "validator"
    }
  ]
}
```

### Environment Variables
```
NODE_IP=127.0.0.1
NODE_PORT=5000
KEYSTORE_PATH=node.keystore
BOOTSTRAP_NODE_URL=http://127.0.0.1:5000
```

---

## Testing

### Run Unit Tests
```bash
cd back_end
python -m pytest tests/test_node_activation.py -v

# Or use unittest
python -m unittest tests.test_node_activation -v
```

### Manual Testing with curl
```bash
# Activate node first
python active_node.py

# Check peers list
curl http://localhost:5000/api/v1/network/peers | jq '.[].status'

# Check activation transaction
curl http://localhost:5000/api/v1/transactions/mempool | \
  grep -i 'peer_activation' -A5
```

---

## File Structure

```
NCKH_BLOCKCHAIN/
├── NODE_ACTIVATION_PROTOCOL.md           ← Full documentation
├── NODE_ACTIVATION_QUICK_START.md        ← Quick reference
├── active_node.py                        ← Updated: Added signed broadcast
├── back_end/
│   ├── tests/
│   │   └── test_node_activation.py       ← New: Test suite
│   ├── app/
│   │   ├── services/
│   │   │   ├── NodeActivationService.py  ← New: Core service
│   │   │   ├── TransactionService.py
│   │   │   └── NetworkService.py
│   │   ├── repositories/
│   │   │   ├── PeerRepository.py         ← New: Peer DB ops
│   │   │   ├── TransactionRepository.py
│   │   │   └── AccountRepository.py
│   │   ├── controllers/
│   │   │   └── v1/
│   │   │       └── NetworkController.py  ← Updated: Added /peers/activation
│   │   └── database/
│   │       └── database.py
│   └── network/
│       └── config.json
```

---

## Security Considerations

### ✅ Implemented
- ECDSA SECP256k1 cryptography
- SHA256 hashing
- Private key encryption (PBKDF2)
- Authorization checks
- Timestamp validation support

### 🔒 Additional Recommendations
1. **Rate Limiting**: Limit activation attempts per IP/node
2. **Time Windows**: Reject activations outside time window
3. **Reputation System**: Track peer reliability
4. **Blacklisting**: Temporarily block misbehaving nodes
5. **Multi-Sig Approval**: MOET quorum approval for changes

---

## Troubleshooting

### Common Issues

**Issue**: "Keystore not found"
- **Solution**: Run `setup.py` to create keystore

**Issue**: "Signature verification failed"
- **Solution**: Ensure public_key matches private_key, verify payload is sorted

**Issue**: "Node is not authorized"
- **Solution**: Contact MOET to approve validator in account table

**Issue**: "Connection refused"
- **Solution**: Ensure `run.py` is running in another terminal

**Issue**: "Peer not found or update failed"
- **Solution**: Check database connectivity and peers table

### Debug Mode
```python
# Enable detailed logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Check logs
tail -f back_end/logs/daily/$(date +%Y-%m-%d).log
```

---

## Summary of Changes

| Component | Type | Lines | Purpose |
|-----------|------|-------|---------|
| NodeActivationService.py | New | 380 | Core activation protocol |
| PeerRepository.py | New | 200 | Peer database operations |
| test_node_activation.py | New | 440 | Test suite |
| active_node.py | Modified | +250 | Added signing & broadcast |
| NetworkController.py | Modified | +100 | Added activation endpoint |
| NODE_ACTIVATION_PROTOCOL.md | New | 600+ | Full documentation |
| NODE_ACTIVATION_QUICK_START.md | New | 400+ | Quick reference guide |

**Total New Code**: ~2,400 lines
**Documentation**: ~1,000 lines
**Test Coverage**: ~440 lines

---

## Next Steps

1. ✅ **Review Implementation**: Check code for security and quality
2. ✅ **Run Tests**: Execute `test_node_activation.py`
3. ✅ **Manual Testing**: Activate a node and verify broadcast
4. ✅ **Monitor Logs**: Watch activation flow in real-time
5. 🔜 **Production Deployment**: Deploy to network
6. 🔜 **Monitoring**: Set up alerts for activation failures

---

## Support

For issues or questions:
1. Check **NODE_ACTIVATION_QUICK_START.md** for common issues
2. Review **NODE_ACTIVATION_PROTOCOL.md** for detailed explanations
3. Run **test_node_activation.py** to verify functionality
4. Check logs in **back_end/logs/daily/**
5. Contact blockchain team for additional support
