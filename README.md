# EduChain — Hệ thống cấp phát & xác thực văn bằng trên Blockchain

Đề tài NCKH: một blockchain **permissioned** tự xây dựng (đồng thuận **Proof of Authority – Round Robin**) dùng để cấp phát văn bằng đại học dưới dạng **NFT**, cho phép bất kỳ ai xác minh tính xác thực của văn bằng mà không cần liên hệ trường cấp.

- **Bộ GD&ĐT (MOET)** đóng vai trò *Super Validator*: quản lý tập validator, phê duyệt node mới.
- **Các trường đại học** chạy node *Validator* (tạo khối, ký văn bằng) hoặc *Observer* (chỉ đọc).
- **Sinh viên / nhà tuyển dụng** dùng ví trên trình duyệt để xem và xác minh văn bằng.

Sơ đồ kiến trúc chi tiết (Mermaid): [`SystemEduChain.md`](SystemEduChain.md).

---

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Backend / Node | Python 3.10+, Flask, SQLite (WAL), ECDSA secp256k1, AES-256-GCM keystore, PyJWT, NTP |
| Mạng P2P | HTTP gossip, đồng bộ chuỗi, giám sát chuỗi (`back_end/network/`) |
| Lưu trữ file | Cloudinary (PDF văn bằng); trên chuỗi chỉ lưu URL + hash SHA-256 |
| Frontend | React 18, TypeScript, Vite (rolldown-vite), Tailwind CSS, shadcn/ui, TanStack Query, React Router |
| Ví phía client | `@noble/secp256k1`, `bip39` (mnemonic), ký giao dịch ngay trên trình duyệt |

---

## Cấu trúc thư mục

```
NCKH_BLOCKCHAIN/
├── back_end/
│   ├── run.py                 # Khởi động 1 node đầy đủ
│   ├── setup.py               # Tạo keystore cho node + đăng ký peer
│   ├── active_node.py         # Mở khóa keystore, kích hoạt validator
│   ├── deactivate_node.py
│   ├── create_admin.py        # Tạo tài khoản MOET (admin)
│   ├── app/
│   │   ├── main.py            # Flask app factory, đăng ký blueprint
│   │   ├── blockchain_instance.py  # Singleton chuỗi trong RAM, khởi tạo genesis
│   │   ├── controllers/v1/    # REST API (/api/v1/...)
│   │   ├── services/          # Nghiệp vụ (Block, Transaction, NFT, Network, ...)
│   │   ├── repositories/      # Truy cập SQLite (sqlite3 thuần, không ORM)
│   │   ├── models/            # Block, BlockHeader, Transaction, NFT, Account, ...
│   │   ├── database/          # Schema + kết nối + write lock
│   │   └── utils/             # Crypto, Hash, Keystore, logger
│   ├── consensus/
│   │   └── validator_worker.py  # Luồng nền tạo khối theo lượt
│   ├── network/               # Gossip, peer manager, chain sync, chain monitor, NTP
│   │   └── config.json        # Cấu hình mạng / seed node / đồng thuận
│   └── tests/quick_test.py    # Script thử tải: mint N NFT vào node đang chạy
├── front_end/
│   ├── configs/               # axios instance, secp256k1, pdf worker
│   └── src/
│       ├── pages/             # Landing, Login, PublicVerify, admin/*
│       ├── components/        # ui/ (shadcn), common/, admin/, landing/
│       ├── services/          # Gọi API
│       ├── hooks/             # Bọc services bằng TanStack Query
│       ├── contexts/          # AuthContext, WalletContext
│       ├── constants/         # api.ts (endpoint), permissions.ts (phân quyền)
│       └── routes/index.tsx
└── SystemEduChain.md          # Tài liệu thiết kế
```

---

## Cài đặt & chạy

### Yêu cầu
- Python **3.10+**
- Node.js **18+** và npm
- Tài khoản Cloudinary (để upload PDF văn bằng)

### 1. Backend

```bash
cd back_end
python3 -m venv venv
source venv/bin/activate          # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Tạo file `back_end/.env`:

```env
SECRET_KEY=thay_bang_chuoi_bi_mat
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Tùy chọn
NODE_IP=127.0.0.1
NODE_PORT=5000
LOG_LEVEL=INFO
```

Khởi tạo node lần đầu:

```bash
python setup.py          # Tạo node.keystore (private key mã hóa bằng passphrase) và đăng ký peer
python create_admin.py   # Tạo tài khoản MOET, in ra private key để đăng nhập trang admin
```

Chạy node:

```bash
python run.py                     # Mặc định cổng 5000
python run.py --port 5001         # Đổi cổng
python run.py --no-network        # Bỏ qua P2P (chạy đơn lẻ để thử nghiệm)
```

Sau khi node chạy, kích hoạt validator (nhập passphrase của keystore) để node bắt đầu tạo khối:

```bash
python active_node.py
```

Hoặc kích hoạt qua API `POST /api/v1/auth/activate`.

### 2. Frontend

```bash
cd front_end
npm install
echo "VITE_API_URL=http://127.0.0.1:5000/api/v1" > .env
npm run dev       # http://localhost:5173
```

Các lệnh khác: `npm run build`, `npm run lint`, `npm run preview`.

### 3. Chạy nhiều node trên một máy

Mỗi node dùng một cổng và một file DB riêng. Node có cổng trùng với `seed_nodes` trong `network/config.json` sẽ tạo khối genesis; các node còn lại tải genesis từ seed node.

```bash
# Terminal 1 — seed node
python run.py --port 5001 --validator-index 0 --total-validators 2

# Terminal 2
python run.py --port 5002 --db node_b.db --validator-index 1 --total-validators 2
```

---

## Kiến trúc & luồng hoạt động

### Đồng thuận PoA – Round Robin
- Thời gian được chia thành các **slot 5 giây**, đồng bộ qua NTP (`network/ntp_sync.py`).
- Validator thứ `i` được tạo khối khi `slot % total_validators == i`.
- `consensus/validator_worker.py` chạy nền: đến lượt và có giao dịch trong mempool thì đóng khối, ký bằng private key (chỉ giữ trong RAM sau khi kích hoạt) và phát tán khối cho các peer.

### Mạng P2P (`back_end/network/`)
- **Gossip**: lan truyền giao dịch/khối (`/network/gossip/*`).
- **Chain sync**: khi khởi động, node tải các khối còn thiếu từ peer.
- **Chain monitor**: định kỳ (30s) kiểm tra chênh lệch độ cao chuỗi và tự đồng bộ.
- **Network daemon**: health check peer (30s), đồng bộ danh sách peer (60s).

### Lưu trữ
- Chuỗi được giữ trong RAM (`app/blockchain_instance.py`) và ghi xuống SQLite. Khi node khởi động lại, toàn bộ chuỗi được nạp lại từ DB.
- Mọi thao tác ghi DB đi qua một **write lock** dùng chung (`app/database/connection.py`) vì nhiều luồng (Flask, validator, daemon) cùng ghi một file SQLite.
- Bảng chính: `account`, `nft`, `nft_metadata`, `transactions`, `block`, `block_header`, `peers`.

### Đăng nhập bằng ví
1. Người dùng tạo/khôi phục ví trên trình duyệt (mnemonic BIP39, khóa secp256k1). Địa chỉ = `0x` + 20 byte cuối của keccak256(public key).
2. `GET /users/auth/get_nonce` → client ký nonce bằng private key.
3. `POST /users/auth/verify` → server xác minh chữ ký, trả về **JWT**.
4. Vai trò: `moet` (Bộ GD&ĐT), `validator` (trường), `client` (sinh viên). Phân quyền giao diện trong `front_end/src/constants/permissions.ts`.

### Cấp phát văn bằng (NFT)
1. Trường upload PDF lên Cloudinary (đơn lẻ, hoặc hàng loạt qua `POST /nft/batch-upload` — tên file là `MaSV.pdf`, tối đa 200 file; danh sách sinh viên nhập từ Excel).
2. Server tính hash SHA-256 của PDF.
3. Trường ký metadata văn bằng bằng private key → `POST /nft/create`.
4. Server xác minh chữ ký, tạo giao dịch vào mempool → validator đóng khối.
5. Văn bằng có thể bị thu hồi qua `POST /nft/<token_id>/revoke`.

### Xác minh văn bằng
Trang công khai `/verify` (không cần đăng nhập): nhập mã token, hệ thống lấy thông tin NFT (`GET /nft/<token_id>`) và kiểm tra chữ ký người cấp + trạng thái thu hồi (`POST /nft/<token_id>/verify`).

---

## API (tiền tố `/api/v1`)

| Nhóm | Endpoint chính |
|---|---|
| `/users` | `auth/get_nonce`, `auth/register`, `auth/verify`, `profile/update`, `profile/<address>`, `all`, `pending_validators`, `approve_validator`, `reject_validator` |
| `/auth` (node) | `activate`, `activate-with-key`, `deactivate`, `status`, `create_key_store` |
| `/nft` | `create`, `batch-upload`, `all`, `<token_id>`, `user/<address>`, `issuer/<address>`, `<token_id>/verify`, `verify/batch`, `<token_id>/revoke`, `<token_id>/metadata-hash` |
| `/block` | `all`, `latest`, `count`, `genesis`, `range`, `<block_id>`, `index/<index>`, `<block_id>/verify` |
| `/transactions` | `all`, `address/<address>` |
| `/network` | `health`, `peers`, `peers/register`, `peers/pending`, `peers/<id>/approve`, `consensus/slot`, `stats`, `blocks/height`, `blocks/range`, `gossip/*` |
| `/monitor` | `status`, `statistics`, `chain-info`, `sync-status`, `peers` |
| `/admin` | `stats`, `recent-activities` |
| `/storage` | `signature` (chữ ký upload Cloudinary) |

---

## Kiểm thử nhanh

Với một node đang chạy ở `http://127.0.0.1:5000`:

```bash
cd back_end
python tests/quick_test.py
```

Script tạo tài khoản, mint hàng loạt NFT và đo hiệu năng.

> Lưu ý: `.gitignore` bỏ qua mọi file `test_*.py`, nên các file test đặt tên theo mẫu này sẽ không được commit.

---

## Giao diện chính

| Đường dẫn | Mô tả |
|---|---|
| `/` | Trang giới thiệu + đăng nhập ví |
| `/verify` | Xác minh văn bằng công khai |
| `/register-validator` | Trường đăng ký làm node validator |
| `/moet-login` | Đăng nhập Bộ GD&ĐT |
| `/admin/*` | Dashboard: văn bằng, sinh viên, giao dịch, mạng lưới, validator, phê duyệt đăng ký, cài đặt |
