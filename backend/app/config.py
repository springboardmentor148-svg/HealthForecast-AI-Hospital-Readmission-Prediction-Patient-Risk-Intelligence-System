from __future__ import annotations

import os
from pathlib import Path
from datetime import timedelta

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / ".flaskenv")


def _parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _parse_origins(value: str | None) -> list[str]:
    if not value:
        return ["http://localhost:5173"]
    origins = [origin.strip() for origin in value.split(",") if origin.strip()]
    return origins or ["http://localhost:5173"]


def _normalize_database_url(url: str | None) -> str:
    if not url:
        return "sqlite:///healthforecast_ai.db"
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class BaseConfig:
    APP_NAME = os.getenv("APP_NAME", "HealthForecast AI Backend")
    API_VERSION = os.getenv("API_VERSION", "1.0.0")
    MODEL_ARTIFACTS_DIR = Path(os.getenv("MODEL_ARTIFACTS_DIR", str(BASE_DIR.parent / "models")))
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "60"))
    )
    SQLALCHEMY_DATABASE_URI = _normalize_database_url(os.getenv("DATABASE_URL"))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    CORS_ORIGINS = _parse_origins(os.getenv("CORS_ORIGINS"))
    JSON_SORT_KEYS = False


class DevelopmentConfig(BaseConfig):
    DEBUG = _parse_bool(os.getenv("FLASK_DEBUG"), True)
    TESTING = False


class ProductionConfig(BaseConfig):
    DEBUG = False
    TESTING = False


def get_config_object(config_name: str | None = None):
    selected = (config_name or os.getenv("FLASK_ENV", "development")).strip().lower()
    if selected == "production":
        return ProductionConfig
    return DevelopmentConfig
