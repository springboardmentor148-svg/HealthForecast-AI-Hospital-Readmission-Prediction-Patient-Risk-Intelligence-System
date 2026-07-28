"""
Application configuration.
All values can be overridden with environment variables (see .env.example).
"""
from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "HealthForecast AI"
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str = "change-this-secret-key-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours

    # Database (SQLite by default so the project runs with zero external
    # infrastructure; point DATABASE_URL at Postgres in production, e.g.
    # postgresql+psycopg2://user:pass@host:5432/healthforecast)
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'healthforecast.db'}"

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # ML model
    MODEL_PATH: Path = BASE_DIR / "ml" / "healthforecast_model.pkl"

    class Config:
        env_file = ".env"


settings = Settings()
