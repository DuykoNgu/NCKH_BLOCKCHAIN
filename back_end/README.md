python3 -m venv venv

.\venv\Scripts\Activate.ps1

MacOS
source ./venv/bin/activate

pip install -r requirements.txt

Cấu trúc dự án(backend)
back_end/
│
├── app/
│ ├── main.py # entry point
│ ├── config.py # cấu hình hệ thống (env, db,...)
│ ├── dependencies.py # DI (FastAPI)
│ ├── database.py # DB init + session
│ │
│ ├── api/ # Layer: Controllers (routes)
│ │ ├── v1/
│ │ │ ├── user_controller.py
│ │ │ ├── auth_controller.py
│ │ │ └── nft_controller.py
│ │ └── router.py # gộp tất cả routers
│ │
│ ├── models/ # Layer: Models (ORM)
│ │ ├── user_model.py
│ │ ├── nft_model.py
│ │ └── base.py
│ │
│ ├── schemas/ # Layer: DTO / request-response
│ │ ├── user_schema.py
│ │ ├── auth_schema.py
│ │ └── nft_schema.py
│ │
│ ├── services/ # Layer: Business logic
│ │ ├── user_service.py
│ │ └── nft_service.py
│ │
│ ├── repositories/ # Layer: Data access
│ │ ├── user_repository.py
│ │ └── nft_repository.py
│ │
│ ├── utils/ # Helper functions
│ ├── core/ # blockchain modules (Crypto, Web3,...)
│ │ ├── crypto_utils.py
│ │ └── chain_connector.py
│ │
│ └── middleware/
│ ├── auth_middleware.py
│ └── logger_middleware.py
│
├── tests/
│ └── ...
│
├── requirements.txt
└── README.md
