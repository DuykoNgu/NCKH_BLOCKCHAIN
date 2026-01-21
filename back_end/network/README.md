# EduChain P2P Network Module

## Tổng Quan

Module P2P Network cung cấp các chức năng mạng ngang hàng cho EduChain blockchain, bao gồm:

- **Node Discovery**: Khám phá và kết nối với các node khác trong mạng
- **Gossip Protocol**: Lan truyền transaction và block hiệu quả
- **Time Synchronization**: Đồng bộ thời gian NTP cho consensus
- **Slot-based PoA**: Quản lý lượt tạo block cho validators

## Cấu Trúc Thư Mục

```
back_end/
├── network/                    # Core P2P networking
│   ├── config.json            # Cấu hình mạng
│   ├── config_loader.py       # Load configuration
│   ├── peer_manager.py        # Quản lý peers
│   ├── gossip_protocol.py     # Giao thức gossip
│   └── ntp_sync.py           # Đồng bộ NTP
├── app/
│   ├── controllers/v1/
│   │   └── NetworkController.py  # API endpoints
│   ├── services/
│   │   └── NetworkService.py     # Business logic
│   └── utils/
│       └── network_utils.py      # Utilities
└── tests/
    └── test_network.py        # Unit tests
```

## Cài Đặt

### 1. Cài đặt dependencies

```bash
cd back_end
pip install -r requirements.txt
```

### 2. Khởi tạo database

```bash
python app/database/database.py
```

### 3. Cấu hình seed nodes

Chỉnh sửa `network/config.json`:

```json
{
  "seed_nodes": [
    {
      "name": "MOET Super Validator",
      "ip": "10.0.1.1",
      "port": 5000,
      "public_key": "04a1b2c3d4e5f6...",
      "role": "super_validator"
    }
  ]
}
```

## Sử Dụng

### Khởi tạo Network Service

```python
from app.services.NetworkService import NetworkService

# Tạo service
service = NetworkService()

# Khởi tạo (kết nối seed nodes, sync time)
if service.initialize():
    print("Network initialized!")
```

### Peer Discovery (PEX)

```python
# Lấy danh sách peers
peers = service.get_peer_list()

# Đăng ký peer mới
peer = service.register_peer(
    ip_address="10.0.1.100",
    port=5000,
    public_key="04xyz...",
    node_type="validator"
)
```

### Gossip Protocol

#### Broadcast Transaction

```python
transaction = {
    'tx_hash': 'abc123',
    'sender_address': 'addr1',
    'recipient_address': 'addr2',
    'payload': {...}
}

# Gossip tới k peers (fan-out)
peers_notified = service.broadcast_transaction(transaction)
```

#### Broadcast Block

```python
block = {
    'block_hash': 'xyz789',
    'index': 105,
    'transactions': [...]
}

# Sử dụng INV message (hiệu quả)
peers_notified = service.broadcast_block(block, use_inv=True)
```

### Consensus Timing

```python
# Lấy thông tin slot hiện tại
total_validators = 3
slot_info = service.get_current_slot_info(total_validators)

print(f"Current slot: {slot_info['current_slot']}")
print(f"Leader: Validator #{slot_info['leader_index']}")

# Kiểm tra lượt của mình
my_index = 1
if service.is_my_turn(my_index, total_validators):
    print("It's my turn to create block!")
```

## API Endpoints

### GET /api/v1/network/peers

Lấy danh sách peers (PEX protocol)

**Response:**
```json
[
  {
    "peer_id": "abc123...",
    "ip_address": "10.0.1.2",
    "port": 5000,
    "node_type": "validator",
    "is_active": true
  }
]
```

### POST /api/v1/network/peers/register

Đăng ký peer mới

**Request:**
```json
{
  "ip_address": "10.0.1.5",
  "port": 5000,
  "public_key": "04xyz...",
  "node_type": "observer"
}
```

### POST /api/v1/network/gossip/transaction

Nhận transaction từ gossip

**Request:**
```json
{
  "msg_type": "transaction",
  "data": {
    "tx_hash": "abc123",
    ...
  }
}
```

### POST /api/v1/network/gossip/block

Nhận block từ gossip

### POST /api/v1/network/gossip/inv

Nhận INV message

### GET /api/v1/network/consensus/slot

Lấy thông tin slot consensus

**Query params:**
- `total_validators`: Số lượng validators

### GET /api/v1/network/stats

Lấy thống kê mạng

## Công Thức Consensus

### Tính Slot Hiện Tại

```
Current Slot = ⌊Current Timestamp / Slot Duration⌋
```

Với `Slot Duration = 5 giây`

### Chọn Leader

```
Leader Index = Current Slot mod Total Validators
```

Ví dụ với 3 validators:
- Slot 0, 3, 6, 9... → Validator #0
- Slot 1, 4, 7, 10... → Validator #1
- Slot 2, 5, 8, 11... → Validator #2

## Gossip Protocol

### Fan-out Formula

```
k = √N × factor
```

Với:
- `N` = tổng số peers
- `factor` = 0.5 (configurable)
- `min_k` = 3
- `max_k` = 10

### Deduplication

Mỗi message có `msg_id` duy nhất. Node chỉ xử lý message lần đầu tiên, bỏ qua các lần sau.

## Testing

### Chạy unit tests

```bash
cd back_end
python tests/test_network.py
```

### Chạy examples

```bash
python examples/network_examples.py
```

## Troubleshooting

### Lỗi NTP sync

**Triệu chứng:** "Failed to query NTP servers"

**Giải pháp:**
- Kiểm tra kết nối internet
- Windows: Khởi động service `w32time`
- Linux: Cài đặt `ntpd` hoặc `chronyd`

### Lỗi peer discovery

**Triệu chứng:** "No peers discovered"

**Giải pháp:**
- Kiểm tra seed nodes trong `config.json`
- Đảm bảo seed nodes đang chạy
- Kiểm tra firewall/network connectivity

### Lỗi whitelist

**Triệu chứng:** "Peer not authorized"

**Giải pháp:**
- Thêm public key vào whitelist trong `config.json`
- Hoặc tắt whitelist: `"enabled": false`

## Best Practices

1. **Time Sync**: Luôn đảm bảo NTP sync trước khi start consensus
2. **Whitelist**: Trong production, luôn enable whitelist
3. **Health Check**: Chạy health check định kỳ để phát hiện dead peers
4. **Monitoring**: Theo dõi network stats để phát hiện vấn đề sớm

## Tham Khảo

- [SystemEduChain.md](../../SystemEduChain.md) - Kiến trúc tổng thể
- [Implementation Plan](../../../.gemini/antigravity/brain/.../implementation_plan.md)
