# core/utils/logger.py
import logging
import sys
import os
import time
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from typing import Optional

try:
    from pythonjsonlogger import jsonlogger
    JSON_LOGGER_AVAILABLE = True
except ImportError:  # pip install python-json-logger (tùy chọn)
    JSON_LOGGER_AVAILABLE = False

# ==================== CẤU HÌNH CHUNG ====================
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
LOG_DIR = PROJECT_ROOT / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Env config (có thể override)
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG").upper()
LOG_TO_CONSOLE = os.getenv("LOG_TO_CONSOLE", "True").lower() == "true"
LOG_TO_FILE = os.getenv("LOG_TO_FILE", "True").lower() == "true"
LOG_JSON_FORMAT = os.getenv("LOG_JSON_FORMAT", "False").lower() == "true"


# ==================== WINDOWS FILE ROTATION FIX ====================
def _safe_rotate(source: str, dest: str) -> None:
    """
    Safe file rotation that handles Windows file locking issues.
    Retries up to 3 times before giving up.
    """
    max_retries = 3
    retry_delay = 0.1  # Start with 100ms
    
    for attempt in range(max_retries):
        try:
            if os.path.exists(dest):
                os.remove(dest)
            os.rename(source, dest)
            return  # Success
        except PermissionError as e:
            if attempt < max_retries - 1:
                # Retry with exponential backoff
                time.sleep(retry_delay)
                retry_delay *= 2
            else:
                # Last attempt failed - log but don't crash
                print(f"⚠ Warning: Failed to rotate log file after {max_retries} attempts: {e}")
        except Exception as e:
            print(f"⚠ Warning: Unexpected error during log rotation: {e}")
            return


def _safe_namer(name: str) -> str:
    """
    Safely generate backup log filename.
    Input: "/path/to/app.log"
    Output: "/path/to/app.2026-04-18.log"
    """
    if name.endswith('.log'):
        return name  # Return as-is, the suffix will be added by TimedRotatingFileHandler
    return name



def _get_console_formatter(json_format: bool = False) -> logging.Formatter:
    if json_format:
        return logging.Formatter('%(message)s')
    return logging.Formatter(
        fmt="%(asctime)s | %(name)-20s | %(levelname)-8s | %(filename)s:%(lineno)-4d | %(message)s",
        datefmt="%H:%M:%S"
    )


def _get_file_formatter(json_format: bool = False) -> logging.Formatter:
    if json_format and JSON_LOGGER_AVAILABLE:
        return jsonlogger.JsonFormatter(
            '%(asctime)s %(name)s %(levelname)s %(filename)s %(lineno)d %(funcName)s %(message)s',
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    return logging.Formatter(
        fmt="%(asctime)s | %(name)-20s | %(levelname)-8s | %(filename)s:%(lineno)-4d | %(funcName)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )


def get_logger(
    name: Optional[str] = None,
    level: Optional[str] = None,
) -> logging.Logger:
    """
    Lấy logger đã được config sẵn.
    Cách dùng: logger = get_logger(__name__)
    """
    logger_name = name or "app"
    logger = logging.getLogger(logger_name)

    # Quan trọng: tránh thêm handler nhiều lần
    if logger.handlers:
        return logger

    logger.setLevel(getattr(logging, level or LOG_LEVEL))

    # ==================== 1. Console Handler ====================
    if LOG_TO_CONSOLE:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(_get_console_formatter(LOG_JSON_FORMAT))
        logger.addHandler(console_handler)

    # ==================== 2. File Handler - Rotate theo dung lượng ====================
    if LOG_TO_FILE:
        all_file_handler = RotatingFileHandler(
            LOG_DIR / "app.log",
            maxBytes=10_000_000,    # 10MB
            backupCount=10,
            encoding="utf-8",
            delay=False
        )
        all_file_handler.setLevel(logging.DEBUG)
        all_file_handler.setFormatter(_get_file_formatter(LOG_JSON_FORMAT))
        logger.addHandler(all_file_handler)

        # ==================== 3. Daily Handler - FIX 100% CHO WINDOWS ====================
        daily_dir = LOG_DIR / "daily"
        daily_dir.mkdir(parents=True, exist_ok=True)  # Tạo thư mục con

        daily_handler = TimedRotatingFileHandler(
            filename=str(daily_dir / "app.log"),  # str() để tránh lỗi Path trên Windows
            when="midnight",
            interval=1,
            backupCount=30,
            encoding="utf-8",
            delay=True  # QUAN TRỌNG NHẤT: Không mở file ngay → không lỗi khi thư mục chưa tồn tại
        )
        daily_handler.setLevel(logging.DEBUG)
        daily_handler.setFormatter(_get_file_formatter(LOG_JSON_FORMAT))
        
        # ✅ FIX: Use proper suffix and safe rotation for Windows
        daily_handler.suffix = "%Y-%m-%d"  # Will create: app.2026-04-18
        daily_handler.extMatch = r"^\d{4}-\d{2}-\d{2}$"  # Match date pattern
        daily_handler.namer = _safe_namer
        daily_handler.rotator = _safe_rotate  # Use safe rotation function
        
        logger.addHandler(daily_handler)


    # ==================== 4. Error-only File ====================
    error_handler = RotatingFileHandler(
        LOG_DIR / "error.log",
        maxBytes=5_000_000,
        backupCount=10,
        encoding="utf-8",
        delay=False
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(_get_file_formatter(LOG_JSON_FORMAT))
    logger.addHandler(error_handler)

    return logger


# ==================== Logger toàn cục (dùng nhanh) ====================
root_logger = get_logger("app")


# ==================== Logger có context (request_id, user_id, order_id...) ====================
class LoggerAdapter(logging.LoggerAdapter):
    """
    Ví dụ dùng trong FastAPI:
        log = LoggerAdapter(logger, {"request_id": "abc123", "user_id": 999})
        log.info("Xử lý thanh toán")
        → tự động thêm request_id, user_id vào extra
    """
    def process(self, msg, kwargs):
        extras = {k: v for k, v in self.extra.items() if v is not None}
        extra = kwargs.get("extra", {})
        extra.update(extras)
        kwargs["extra"] = extra
        return msg, kwargs