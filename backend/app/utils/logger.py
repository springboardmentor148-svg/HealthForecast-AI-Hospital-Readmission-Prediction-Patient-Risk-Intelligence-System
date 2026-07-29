from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from flask import request


def configure_logging(app):
    log_dir = Path(app.root_path) / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "healthforecast_ai.log"

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s [%(name)s] %(message)s"
    )

    app.logger.handlers.clear()
    app.logger.setLevel(logging.INFO)
    app.logger.propagate = False

    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging.INFO)
    stream_handler.setFormatter(formatter)

    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=1_048_576,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    app.logger.addHandler(stream_handler)
    app.logger.addHandler(file_handler)

    werkzeug_logger = logging.getLogger("werkzeug")
    werkzeug_logger.setLevel(logging.INFO)


def register_request_logging(app):
    @app.after_request
    def log_request(response):
        app.logger.info("%s %s %s", request.method, request.path, response.status_code)
        return response
