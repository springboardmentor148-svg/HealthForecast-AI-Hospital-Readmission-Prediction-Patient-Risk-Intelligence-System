"""
Loads the pre-trained XGBoost model exactly once (singleton) using joblib.

The backend NEVER retrains the model — it only loads `best_xgboost.pkl`
and serves predictions. If the model file is missing (e.g. in a fresh
dev checkout), a clear error is raised rather than failing silently.
"""
import os
import threading
from typing import Any, Optional

import joblib

from core.config import settings
from core.logging import get_logger

logger = get_logger("healthforecast.ml")

_model_lock = threading.Lock()
_model: Optional[Any] = None


class ModelNotLoadedError(RuntimeError):
    """Raised when the XGBoost model file cannot be found or loaded."""


def load_model() -> Any:
    """
    Load and cache the XGBoost model singleton.

    Thread-safe: multiple concurrent requests during startup will only
    trigger a single joblib.load() call.
    """
    global _model
    if _model is not None:
        return _model

    with _model_lock:
        if _model is not None:  # double-checked locking
            return _model

        model_path = settings.MODEL_PATH
        if not os.path.isfile(model_path):
            logger.error("XGBoost model file not found at '%s'", model_path)
            raise ModelNotLoadedError(
                f"Model file not found at '{model_path}'. Place the trained "
                f"'best_xgboost.pkl' file at this path (see MODEL_PATH in .env)."
            )

        logger.info("Loading XGBoost model from '%s'...", model_path)
        _model = joblib.load(model_path)
        logger.info("XGBoost model loaded successfully (version=%s).", settings.MODEL_VERSION)
        return _model


def get_model() -> Any:
    """Return the cached model, loading it on first access."""
    return load_model()


def is_model_loaded() -> bool:
    return _model is not None
