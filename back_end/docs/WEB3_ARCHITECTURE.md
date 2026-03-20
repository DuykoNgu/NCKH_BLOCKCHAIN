# Web3 + Backend API Pattern - Architecture Overview

## Tổng quan Kiến trúc

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT                                       │
│  - Tạo transaction (REGISTER_IDENTITY, MINT_NFT, UPDATE_PROFILE...)        │
│  - Sign bằng private key                                                    │
│  - Gửi lên backend API                                                      │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API                                     │
│  - Nhận transaction từ client                                               │
│  - Verify signature (không cần DB lookup)                                   │
│  - Thêm vào mempool                                                         │
│  - Trả về tx_hash cho client                                               │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MEMPOOL (Trong memory)                            │
│  - Chứa các transactions chờ được confirm                                   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼ (Validator mine block)
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BLOCKCHAIN (Chain)                                 │
│  - Block được tạo và confirm                                               │
│  - Source of truth                                                          │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ChainIndexer                                      │
│  - Lắng nghe block mới từ chain                                           │
│  - Index tất cả tx vào DB                                                   │
│  - Dispatch đến handlers phù hợp                                           │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  AccountService │   │    NFTService   │   │  Transaction   │
│                 │   │                 │   │   Repository   │
│ - on_register   │   │ - on_mint_nft   │   │                │
│   _identity     │   │ - revoke_nft    │   │ - create()     │
│ - on_update     │   │                 │   │ - get_by_hash()│
│   _profile      │   │                 │   │ - get_by_type()│
│ - on_assign_role│   │                 │   │                │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND DB (Cache/Index)                             │
│  - Lưu trữ: address, role, is_active, profile_tx_hash                      │
│  - Source of truth: ON-CHAIN                                                │
│  - DB chỉ là cache/index cho query nhanh                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Các Files đã được cập nhật

### 1. Models

#### [`app/models/Transaction.py`](app/models/Transaction.py:1)
- Thêm `TxType` enum với các loại: REGISTER_IDENTITY, UPDATE_PROFILE, ASSIGN_ROLE, REVOKE_ROLE, MINT_NFT, REVOKE_NFT, VALIDATE_BLOCK
- Thêm `nonce` vào signing data → chống replay attack
- Methods:
  - `get_signing_data()` - Data để ký (bao gồm tx_type + nonce)
  - `compute_hash()` - Tính hash
  - `to_dict()` / `from_dict()` - Serialization

#### [`app/models/Account.py`](app/models/Account.py:1)
- Address là identity duy nhất (KHÔNG dùng public_key làm identity)
- Thêm `profile_tx_hash` → anchor đến on-chain data
- public_key chỉ là optional cache

---

### 2. Services

#### [`app/services/TransactionService.py`](app/services/TransactionService.py:1)
- **`verify()`** - Web3 pattern: verify bằng sender_pubkey trong tx, sau đó kiểm tra derive ra đúng sender_address → không cần DB lookup
- **`sign()`** - Ký transaction bằng private key
- **Build helpers:**
  - `build_register_identity()` - Tạo tx đăng ký identity
  - `build_update_profile()` - Tạo tx cập nhật profile
  - `build_assign_role()` - Tạo tx gán role (MOET)
  - `build_mint_nft()` - Tạo tx cấp bằng NFT
  - `build_revoke_nft()` - Tạo tx thu hồi bằng

#### [`app/services/AccountService.py`](app/services/AccountService.py:1)
- **`verify_login_signature()`** - Verify login mà không cần lookup DB
- **`get_or_create()`** - Lấy account nếu tồn tại, tạo mới nếu chưa có
- **On-chain handlers** (được gọi bởi ChainIndexer):
  - `on_register_identity_confirmed()` - Tạo account sau khi tx confirm
  - `on_update_profile_confirmed()` - Cache profile + tx_hash
  - `on_assign_role_confirmed()` - Cập nhật role

#### [`app/services/ChainIndexer.py`](app/services/ChainIndexer.py:1) *(MỚI)*
- Layer quan trọng nhất - kết nối Chain với Backend DB
- **`index_block()`** - Index tất cả transactions trong block
- Map TxType → Handler tương ứng

#### [`app/services/BlockChainService.py`](app/services/BlockChainService.py:1)
- Tích hợp ChainIndexer
- **`add_block()`** - Thêm block + gọi ChainIndexer.index_block()

---

### 3. Repositories

#### [`app/repositories/AccountRepository.py`](app/repositories/AccountRepository.py:1)
- Schema: address (PK), role, is_active, profile_tx_hash
- KHÔNG lưu public_key làm identity
- Methods:
  - `create_account()` - Tạo account (không lưu public_key)
  - `update_role()` - Cập nhật role
  - `update_profile_tx_hash()` - Cache profile + tx_hash
  - `get_by_address()` - Lấy account

#### [`app/repositories/TransactionRepository.py`](app/repositories/TransactionRepository.py:1)
- Schema đầy đủ: tx_hash, tx_id, tx_type, sender_address, sender_pubkey, recipient_address, payload, nonce, signature, timestamp, block_id
- Index theo tx_type để query nhanh
- Methods:
  - `create()` - Lưu tx
  - `get_by_hash()`, `get_by_sender()`, `get_by_recipient()`
  - `get_by_type()` - Query theo loại tx (MINT_NFT, ASSIGN_ROLE...)
  - `get_pending()` - Lấy txs chưa confirm

---

## Flow Mới

### 1. User Login lần đầu (REGISTER_IDENTITY)

```
Client                    Backend                     Chain              DB
  │                         │                          │                 │
  │─── SIGN(tx) ──────────►│                          │                 │
  │   - tx_type=           │                          │                 │
  │     REGISTER_IDENTITY  │                          │                 │
  │   - sender_address     │                          │                 │
  │   - sender_pubkey      │                          │                 │
  │   - payload={role}     │                          │                 │
  │   - nonce              │                          │                 │
  │                         │                          │                 │
  │                    verify()                       │                 │
  │                    (no DB lookup)                 │                 │
  │                         │                          │                 │
  │◄─── tx_hash ──────────│                          │                 │
  │                         │                          │                 │
  │                         │─── Submit to chain ────►│                 │
  │                         │                          │                 │
  │                         │         (block confirm) │                 │
  │                         │◄────────────────────────│                 │
  │                         │                          │                 │
  │                         │─── ChainIndexer ───────►│                 │
  │                         │    index_block()        │                 │
  │                         │                          │                 │
  │                         │                          │    create_account()
  │                         │                          │    (address, role)
  │                         │◄─────────────────────────│                 │
```

### 2. Cấp bằng (MINT_NFT)

```
MOET                     Backend                     Chain              DB
  │                         │                          │                 │
  │─── SIGN(tx) ──────────►│                          │                 │
  │   - tx_type=MINT_NFT  │                          │                 │
  │   - recipient_address │                          │                 │
  │   - payload={metadata}│                          │                 │
  │                         │                          │                 │
  │                    verify()                       │                 │
  │                         │                          │                 │
  │◄─── tx_hash ──────────│                          │                 │
  │                         │                          │                 │
  │                         │─── Submit to chain ────►│                 │
  │                         │                          │                 │
  │                         │         (block confirm)│                 │
  │                         │◄────────────────────────│                 │
  │                         │                          │                 │
  │                         │─── ChainIndexer ───────►│                 │
  │                         │    _handle_mint_nft()   │                 │
  │                         │                          │                 │
  │                         │                          │    NFTService
  │                         │                          │    .on_mint_nft()
  │                         │◄─────────────────────────│                 │
```

### 3. Cập nhật Profile (UPDATE_PROFILE)

```
User                     Backend                     Chain              DB
  │                         │                          │                 │
  │─── SIGN(tx) ──────────►│                          │                 │
  │   - tx_type=           │                          │                 │
  │     UPDATE_PROFILE    │                          │                 │
  │   - payload={          │                          │                 │
  │       full_name,       │                          │                 │
  │       avatar_url       │                          │                 │
  │     }                  │                          │                 │
  │                         │                          │                 │
  │                    verify()                       │                 │
  │                         │                          │                 │
  │◄─── tx_hash ──────────│                          │                 │
  │                         │                          │                 │
  │                         │─── Submit to chain ────►│                 │
  │                         │                          │                 │
  │                         │         (block confirm)│                 │
  │                         │◄────────────────────────│                 │
  │                         │                          │                 │
  │                         │─── ChainIndexer ───────►│                 │
  │                         │    _handle_update_       │                 │
  │                         │    profile()            │                 │
  │                         │                          │                 │
  │                         │                          │  update_profile
  │                         │                          │  _tx_hash()
  │                         │                          │  (cache profile)
  │                         │◄─────────────────────────│                 │
```

---

## API Endpoints

### Authentication

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/v1/users/auth/get_nonce` | GET | Client lấy nonce để ký |
| `/api/v1/users/auth/verify` | POST | Verify signature → get_or_create account → JWT |

### Transactions

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/v1/users/transactions/submit` | POST | Nhận signed tx → verify → mempool → broadcast |
| `/api/v1/users/transactions/<address>` | GET | Lịch sử tx của address |

### Profile

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/v1/users/profile/<address>` | GET | Trả account info + profile_tx_hash |

---

### Chi tiết API Flow

#### 1. Login Flow (Auth)

```
┌──────────────┐     GET /auth/get_nonce      ┌──────────────┐
│              │ ─────────────────────────────►│              │
│   CLIENT     │                               │   BACKEND    │
│              │ ◄─────────────────────────────│   (Redis)    │
└──────────────┘     {nonce: "xxx"}            └──────────────┘
        │
        │ SIGN(tx REGISTER_IDENTITY + nonce)
        │ tx = {
        │   tx_type: "REGISTER_IDENTITY",
        │   sender_address: "0x...",
        │   sender_pubkey: "04...",
        │   payload: {role: "client"},
        │   nonce: 1
        │ }
        ▼
┌──────────────┐     POST /auth/verify       ┌──────────────┐
│              │ ─────────────────────────────►│              │
│   CLIENT     │   {address, pubkey,         │   BACKEND    │
│              │    signature}                │              │
│              │                               │  1. verify() │
│              │                               │  2. get_or_  │
│              │                               │     create() │
│              │                               │  3. JWT      │
│              │ ◄─────────────────────────────│              │
└──────────────┘     {token, user}            └──────────────┘
```

**Request/Response:**

```http
GET /api/v1/users/auth/get_nonce?address=0x123...
```
```json
{
  "nonce": "abc123def456"
}
```

```http
POST /api/v1/users/auth/verify
```
```json
{
  "address": "0x123...",
  "pubkey": "04abc...",
  "signature": "a1b2c3..."
}
```
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "is_new": true,
  "user": {
    "address": "0x123...",
    "role": "client",
    "full_name": null,
    "avatar_url": null,
    "profile_tx_hash": null
  }
}
```

#### 2. Submit Transaction Flow

```
┌──────────────┐     POST /transactions/submit ┌──────────────┐
│              │ ─────────────────────────────►│              │
│   CLIENT     │   {transaction, signature}   │   BACKEND    │
│   (Signed)   │   + Authorization: Bearer    │              │
│              │                               │  1. verify() │
│              │                               │  2. mempool  │
│              │                               │  3. broadcast│
│              │ ◄─────────────────────────────│              │
└──────────────┘     {status, tx_hash}        └──────────────┘
```

**Request:**

```http
POST /api/v1/users/transactions/submit
Authorization: Bearer <jwt_token>
```
```json
{
  "transaction": {
    "tx_type": "MINT_NFT",
    "sender_address": "0x123...",
    "sender_pubkey": "04abc...",
    "recipient_address": "0x456...",
    "payload": {
      "metadata": {
        "degree_type": "Bachelor",
        "pdf_hash": "abc123...",
        "institution_address": "0x789...",
        "issued_at": "2024-01-15"
      }
    },
    "nonce": 1,
    "timestamp": 1705312800.0
  },
  "signature": "a1b2c3..."
}
```

**Response:**
```json
{
  "status": "pending",
  "tx_hash": "def456...",
  "message": "Transaction submitted to mempool"
}
```

#### 3. Get Profile Flow

```http
GET /api/v1/users/profile/0x123...
```
```json
{
  "address": "0x123...",
  "role": "client",
  "org_name": null,
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "profile_tx_hash": "tx_hash_on_chain",
  "is_active": 1
}
```

#### 4. Get Transaction History Flow

```http
GET /api/v1/users/transactions/0x123...
```
```json
{
  "address": "0x123...",
  "transactions": [
    {
      "tx_type": "MINT_NFT",
      "tx_hash": "abc123...",
      "sender_address": "0x123...",
      "recipient_address": "0x456...",
      "payload": {...},
      "nonce": 1,
      "timestamp": 1705312800.0,
      "block_id": "BLOCK_5"
    }
  ],
  "total": 1
}
```

---

## Nguyên tắc Web3 + Backend API

1. **Address = Identity duy nhất** - KHÔNG cần public_key trong DB
2. **Public key recover từ signature** - Khi cần verify
3. **Role lưu backend** - Vì là business logic
4. **Profile tx_hash = Anchor** - Trỏ đến on-chain data (source of truth)
5. **KHÔNG ghi DB từ API request trực tiếp** - Chỉ ghi sau khi tx confirm
6. **ChainIndexer** - Layer quan trọng kết nối Chain với Backend DB
7. **DB chỉ là cache/index** - Source of truth luôn là chain

---

## Database Schema (Giả định)

### Table: accounts
```sql
CREATE TABLE accounts (
    address TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    org_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    profile_tx_hash TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT
);
```

### Table: transactions
```sql
CREATE TABLE transactions (
    tx_hash TEXT PRIMARY KEY,
    tx_id TEXT,
    tx_type TEXT NOT NULL,
    sender_address TEXT NOT NULL,
    sender_pubkey TEXT,
    recipient_address TEXT,
    payload TEXT,
    nonce INTEGER,
    signature TEXT,
    timestamp REAL,
    block_id TEXT
);

CREATE INDEX idx_tx_type ON transactions(tx_type);
CREATE INDEX idx_sender ON transactions(sender_address);
```
