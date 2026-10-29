import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your_super_secret_key_change_in_production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

NODE_NAME = os.getenv("NODE_NAME", "node")
NODE_ROLE = os.getenv("NODE_ROLE", "validator").lower()
NODE_HOST = os.getenv("NODE_HOST", "0.0.0.0")
NODE_PORT = int(os.getenv("NODE_PORT", "5000"))
NODE_IP = os.getenv("NODE_IP", "127.0.0.1")
DATA_DIR = os.getenv("DATA_DIR") or os.path.join(BACKEND_DIR, "data", NODE_NAME)
KEYSTORE_PATH = os.path.join(DATA_DIR, "node.keystore")
MOET_ADMIN_KEY_PATH = os.path.join(DATA_DIR, "moet_admin.key")

if NODE_ROLE not in ("moet", "validator", "observer"):
    raise ValueError(f"NODE_ROLE phải là moet | validator | observer (đang là '{NODE_ROLE}')")

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
