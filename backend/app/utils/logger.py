import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
import time
from collections import deque

from flask import request, g

START_TIME = time.time()
REQUEST_TIMES = deque(maxlen=100)


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
    @app.before_request
    def start_timer():
        g.start_time = time.time()

    @app.after_request
    def log_request(response):
        elapsed = 0.0
        if hasattr(g, 'start_time'):
            elapsed = (time.time() - g.start_time) * 1000.0
            REQUEST_TIMES.append(elapsed)
        app.logger.info("%s %s %s (%.2fms)", request.method, request.path, response.status_code, elapsed)
        return response

