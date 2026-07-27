"""
Centralised application logging configuration.

Provides a single `get_logger(name)` factory used across routers, services
and repositories so that authentication events, predictions, errors and
API requests are all logged consistently to both console and a rotating
file handler.
"""
import logging
import os
import sys
from logging.handlers import RotatingFileHandler

from core.config import settings

_LOG_FORMAT = (
    "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
)

_configured = False


def configure_logging() -> None:
    """Configure the root logger once, on application startup."""
    global _configured
    if _configured:
        return

    log_dir = os.path.dirname(settings.LOG_FILE) or "."
    os.makedirs(log_dir, exist_ok=True)

    root_logger = logging.getLogger()
    root_logger.setLevel(settings.LOG_LEVEL)

    formatter = logging.Formatter(_LOG_FORMAT)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    file_handler = RotatingFileHandler(
        settings.LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=5
    )
    file_handler.setFormatter(formatter)

    root_logger.handlers = [console_handler, file_handler]
    _configured = True


def get_logger(name: str) -> logging.Logger:
    """Return a module-scoped logger, ensuring logging is configured."""
    configure_logging()
    return logging.getLogger(name)


# Dedicated loggers for domain-specific concerns, as required by the spec:
auth_logger = get_logger("healthforecast.auth")
prediction_logger = get_logger("healthforecast.prediction")
error_logger = get_logger("healthforecast.error")
request_logger = get_logger("healthforecast.request")
audit_logger = get_logger("healthforecast.audit")
