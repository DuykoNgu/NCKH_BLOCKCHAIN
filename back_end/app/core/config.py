"""
Configuration module - Load settings from environment variables
"""
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your_super_secret_key_change_in_production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

# Redis Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

# Database Configuration
DATABASE_PATH = os.getenv("DATABASE_PATH", "NCKH_educhain.db")

# Server Configuration
SERVER_HOST = os.getenv("SERVER_HOST", "127.0.0.1")
SERVER_PORT = int(os.getenv("SERVER_PORT", "5000"))
DEBUG_MODE = os.getenv("DEBUG_MODE", "True").lower() == "true"
