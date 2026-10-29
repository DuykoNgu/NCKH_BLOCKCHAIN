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
│   ├── run.py                 # Điểm chạy duy nhất của mọi node (cấu hình qua .env)
│   ├── Dockerfile
│   ├── data/<NODE_NAME>/      # Dữ liệu từng node (tự sinh, gitignore): node.db, node.keystore, moet_admin.key
│   ├── app/
│   │   ├── main.py            # Flask app factory, đăng ký blueprint
│   │   ├── blockchain_instance.py  # Singleton chuỗi trong RAM, khởi tạo genesis
│   │   ├── controllers/v1/    # REST API (/api/v1/...)
│   │   ├── services/          # Nghiệp vụ (Block, Transaction, NFT, Network, ...)
│   │   ├── repositories/      # Truy cập SQLite (sqlite3 thuần, không ORM)
│   │   ├── models/            # Block, BlockHeader, Transaction, NFT, Account, ...
│   │   ├── core/              # config.py (biến môi trường), node_bootstrap.py (tự khởi tạo node)
│   │   ├── database/          # Schema + kết nối + write lock
│   │   └── utils/             # Crypto, Hash, Keystore, logger
│   ├── consensus/
│   │   └── validator_worker.py  # Luồng nền tạo khối theo lượt
│   ├── network/               # Gossip, peer manager, chain sync, chain monitor, NTP
│   │   └── config.json        # Cấu hình chung của mạng — GIỐNG NHAU trên mọi node
│   └── tests/                 # quick_test.py (thử tải), check_authority.py (kiểm tra đồng thuận)
├── docker-compose.yml         # Mạng mẫu 3 node: moet, truong-a, truong-b
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

# Node
NODE_NAME=moet            # tên node → dữ liệu ở back_end/data/<NODE_NAME>/
NODE_ROLE=moet            # moet | validator | observer
NODE_IP=127.0.0.1         # địa chỉ các node khác dùng để gọi tới node này
NODE_PORT=5000
# NODE_PASSPHRASE=...     # có thì tự mở khoá keystore, không cần nhập tay (deploy/chạy nền)
# SEED_NODES=host:port    # ghi đè seed_nodes trong network/config.json
LOG_LEVEL=INFO
```

Chạy node — mọi node đều chạy **cùng một lệnh**, chỉ khác file `.env`:

```bash
python run.py                          # dùng back_end/.env
python run.py --env .env.truong-a      # dùng file env khác (chạy nhiều node trên một máy)
python run.py --no-network             # bỏ qua P2P (thử nghiệm đơn lẻ)
```

Khi khởi động, node tự làm theo `NODE_ROLE`:

| | `moet` | `validator` | `observer` |
|---|---|---|---|
| Keystore | Tự tạo nếu chưa có, **bắt buộc** mở khoá | Tự tạo nếu chưa có, mở khoá → tự kích hoạt | Không dùng |
| Genesis | Tự tạo | Tải từ seed node (chờ tới khi MOET chạy) | Tải từ seed node |
| Admin MOET | Tự tạo và đăng ký **lên chain** → mọi node có cùng 1 admin. Private key ở `data/<NODE_NAME>/moet_admin.key` | — | — |
| Tạo khối | Có | Sau khi MOET duyệt | Không |

Passphrase lấy từ `NODE_PASSPHRASE`, hoặc được hỏi khi chạy trong terminal; nhấn Enter để bỏ qua → chạy như observer.

**Danh sách validator nằm trên chain:**
- Validator mới kích hoạt sẽ gửi giao dịch `validator_activate`.
- MOET duyệt bằng giao dịch `validator_add`, do chính MOET ký.
- Lượt tạo khối được tính bằng `sorted(authority_set)[slot % n]`, nên mọi node tự tính ra cùng một kết quả mà không cần cấu hình tay.
- Block do key nằm ngoài authority set tạo ra sẽ bị từ chối.
- Chính sách duyệt nằm ở `whitelist` trong `network/config.json`:
  - `enabled: false`: MOET tự duyệt mọi node (dùng khi dev).
  - `enabled: true`: MOET chỉ duyệt các public key có trong `authorized_validators`.
- Muốn cố định danh tính MOET thì đặt `moet_public_key` trong config. Khi đó node sẽ từ chối genesis của MOET khác.

Bật/tắt validator khi node đang chạy: `POST /api/v1/auth/activate` (body `{"passphrase": "..."}`) / `POST /api/v1/auth/deactivate`.

### 2. Frontend

```bash
cd front_end
npm install
echo "VITE_API_URL=http://127.0.0.1:5000/api/v1" > .env
npm run dev       # http://localhost:5173
```

Các lệnh khác: `npm run build`, `npm run lint`, `npm run preview`.

### 3. Chạy cả mạng bằng Docker

```bash
docker compose up --build        # moet → :5001, truong-a → :5002, truong-b → :5003
```

Mỗi node chạy trong một container riêng, có volume dữ liệu riêng và dùng chung `back_end/.env` cho các secret (JWT, Cloudinary). Passphrase mặc định trong `docker-compose.yml` chỉ dùng cho dev; khi chạy thật, hãy đặt `MOET_PASSPHRASE`, `TRUONG_A_PASSPHRASE`, `TRUONG_B_PASSPHRASE`. Frontend trỏ tới node nào cũng được, ví dụ `VITE_API_URL=http://localhost:5001/api/v1`.

Thêm một trường: copy một service `truong-*` trong `docker-compose.yml` rồi đổi tên, `NODE_NAME`, `NODE_IP`, volume và port.

Không dùng Docker: tạo `.env.truong-a` (`NODE_NAME=truong-a`, `NODE_ROLE=validator`, `NODE_PORT=5001`, `SEED_NODES=127.0.0.1:5000`) rồi chạy `python run.py --env .env.truong-a`.

> macOS: cổng 5000 thường bị AirPlay Receiver chiếm. Tắt AirPlay Receiver trong System Settings, hoặc đặt `NODE_PORT` khác.

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
