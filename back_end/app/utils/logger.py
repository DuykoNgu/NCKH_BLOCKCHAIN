import logging
import sys
import os
import time
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from typing import Optional

class SafeRotatingFileHandler(RotatingFileHandler):
    def doRollover(self):
        try:
            super().doRollover()
        except PermissionError:
            pass

class SafeTimedRotatingFileHandler(TimedRotatingFileHandler):
    def doRollover(self):
        try:
            super().doRollover()
        except PermissionError:
            pass

try:
    from pythonjsonlogger import jsonlogger
    JSON_LOGGER_AVAILABLE = True
except ImportError:
    JSON_LOGGER_AVAILABLE = False

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
LOG_DIR = PROJECT_ROOT / "logs"
LOG_DIR.mkdir(exist_ok=True)

LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG").upper()
LOG_TO_CONSOLE = os.getenv("LOG_TO_CONSOLE", "True").lower() == "true"
LOG_TO_FILE = os.getenv("LOG_TO_FILE", "True").lower() == "true"
LOG_JSON_FORMAT = os.getenv("LOG_JSON_FORMAT", "False").lower() == "true"


def _safe_rotate(source: str, dest: str) -> None:
    max_retries = 3
    retry_delay = 0.1
    
    for attempt in range(max_retries):
        try:
            if os.path.exists(dest):
                os.remove(dest)
            os.rename(source, dest)
            return
        except PermissionError as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 2
            else:
                print(f"⚠ Warning: Failed to rotate log file after {max_retries} attempts: {e}")
        except Exception as e:
            print(f"⚠ Warning: Unexpected error during log rotation: {e}")
            return


def _safe_namer(name: str) -> str:
    if name.endswith('.log'):
        return name
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
    logger_name = name or "app"
    logger = logging.getLogger(logger_name)

    if logger.handlers:
        return logger

    logger.setLevel(getattr(logging, level or LOG_LEVEL))

    if LOG_TO_CONSOLE:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(_get_console_formatter(LOG_JSON_FORMAT))
        logger.addHandler(console_handler)

    if LOG_TO_FILE:
        all_file_handler = SafeRotatingFileHandler(
            LOG_DIR / "app.log",
            maxBytes=10_000_000,
            backupCount=10,
            encoding="utf-8",
            delay=False
        )
        all_file_handler.setLevel(logging.DEBUG)
        all_file_handler.setFormatter(_get_file_formatter(LOG_JSON_FORMAT))
        logger.addHandler(all_file_handler)

        daily_dir = LOG_DIR / "daily"
        daily_dir.mkdir(parents=True, exist_ok=True)

        daily_handler = SafeTimedRotatingFileHandler(
            filename=str(daily_dir / "app.log"),
            when="midnight",
            interval=1,
            backupCount=30,
            encoding="utf-8",
            delay=True
        )
        daily_handler.setLevel(logging.DEBUG)
        daily_handler.setFormatter(_get_file_formatter(LOG_JSON_FORMAT))
        
        daily_handler.suffix = "%Y-%m-%d"
        daily_handler.extMatch = r"^\d{4}-\d{2}-\d{2}$"
        daily_handler.namer = _safe_namer
        daily_handler.rotator = _safe_rotate
        
        logger.addHandler(daily_handler)


    error_handler = SafeRotatingFileHandler(
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


root_logger = get_logger("app")


class LoggerAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        extras = {k: v for k, v in self.extra.items() if v is not None}
        extra = kwargs.get("extra", {})
        extra.update(extras)
        kwargs["extra"] = extra
        return msg, kwargs