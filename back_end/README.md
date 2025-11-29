python3 -m venv venv

.\venv\Scripts\Activate.ps1

MacOS
source ./venv/bin/activate

pip install -r requirements.txt

Cấu trúc dự án(backend)

# Backend Project Structure

```
back_end/
│
├── app/
│   ├── main.py               # Entry point của ứng dụng
│   ├── config.py             # Cấu hình hệ thống (env, database, ...)
│   ├── dependencies.py       # Dependency Injection (FastAPI)
│   ├── database.py           # Khởi tạo database và session
│   │
│   ├── api/                  # Layer: Controllers (routes)
│   │   ├── v1/
│   │   │   ├── user_controller.py
│   │   │   ├── auth_controller.py
│   │   │   └── nft_controller.py
│   │   └── router.py         # Gộp tất cả routers
│   │
│   ├── models/               # Layer: Models (ORM)
│   │   ├── user_model.py
│   │   ├── nft_model.py
│   │   └── base.py
│   │
│   ├── schemas/              # Layer: DTO / request-response
│   │   ├── user_schema.py
│   │   ├── auth_schema.py
│   │   └── nft_schema.py
│   │
│   ├── services/             # Layer: Business logic
│   │   ├── user_service.py
│   │   └── nft_service.py
│   │
│   ├── repositories/         # Layer: Data access
│   │   ├── user_repository.py
│   │   └── nft_repository.py
│   │
│   ├── utils/                # Các helper functions
│   │
│   ├── core/                 # Blockchain modules (Crypto, Web3,...)
│   │   ├── crypto_utils.py
│   │   └── chain_connector.py
│   │
│   └── middleware/
│       ├── auth_middleware.py
│       └── logger_middleware.py
│
├── tests/                    # Thư mục chứa unit tests
│
├── requirements.txt          # File liệt kê các dependencies
└── README.md                 # File này

```

### Mô tả các thư mục chính

- **app/**: Chứa toàn bộ code nguồn của ứng dụng.
- **api/**: Chứa các controller, route và gộp router.
- **models/**: Định nghĩa các ORM models.
- **schemas/**: Chứa các DTO, schema cho request/response.
- **services/**: Chứa business logic.
- **repositories/**: Chứa logic truy cập dữ liệu.
- **core/**: Các module liên quan blockchain, crypto.
- **middleware/**: Chứa middleware cho authentication, logging,...
- **utils/**: Các helper functions hỗ trợ chung.
- **tests/**: Chứa unit test cho ứng dụng.

```

```

test connect database
python3 tests/dtb_connect.py 2>&1 | head -100
