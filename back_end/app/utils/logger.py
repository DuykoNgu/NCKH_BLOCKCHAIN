# core/utils/logger.py
import logging
import sys
import os
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
        daily_handler.suffix = "%Y-%m-%d.log"   # Tự động đổi tên: app.2025-11-27.log
        daily_handler.namer = lambda name: name.replace(".log", "") + ".log"  # Fix tên file khi rotate
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