from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# ============================================================
# BASE DIRECTORIES
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

ML_MODELS_DIR = BASE_DIR / "ml_models"


# ============================================================
# APPLICATION SETTINGS
# ============================================================

class Settings(BaseSettings):

    # --------------------------------------------------------
    # APPLICATION
    # --------------------------------------------------------

    APP_NAME: str = "HealthForecast AI"

    APP_VERSION: str = "1.0.0"

    APP_ENV: str = "development"

    DEBUG: bool = True


    # --------------------------------------------------------
    # POSTGRESQL DATABASE
    # --------------------------------------------------------

    DATABASE_URL: str = (
         "postgresql+psycopg2://healthforecast:healthforecast@localhost:5433/healthforecast"
    )


    # --------------------------------------------------------
    # MONGODB

    # --------------------------------------------------------

    MONGO_URL: str = (
        "mongodb://localhost:27017"
    )

    MONGO_DB_NAME: str = (
        "healthforecast"
    )


    # --------------------------------------------------------
    # JWT AUTHENTICATION
    # --------------------------------------------------------

    # Main JWT secret key
    JWT_SECRET_KEY: str = (
        "healthforecast-super-secret-key-2026"
    )

    # Compatibility name
    # Used by jwt.py
    SECRET_KEY: str = (
        "healthforecast-super-secret-key-2026"
    )


    # Main JWT algorithm setting
    JWT_ALGORITHM: str = "HS256"

    # Compatibility name
    # Used by jwt.py
    ALGORITHM: str = "HS256"


    # Main token expiration setting
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Compatibility name
    # Used by jwt.py
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60


    # --------------------------------------------------------
    # FRONTEND
    # --------------------------------------------------------

    FRONTEND_URL: str = (
        "http://localhost:3000"
    )


    # --------------------------------------------------------
    # MACHINE LEARNING MODEL PATHS
    # --------------------------------------------------------

    MODEL_PATH: str = str(
        ML_MODELS_DIR / "model.pkl"
    )

    PREPROCESSOR_PATH: str = str(
        ML_MODELS_DIR / "preprocessor.pkl"
    )

    SCALER_PATH: str = str(
        ML_MODELS_DIR / "scaler.pkl"
    )

    FEATURE_NAMES_PATH: str = str(
        ML_MODELS_DIR / "feature_names.pkl"
    )


    # --------------------------------------------------------
    # PYDANTIC SETTINGS CONFIGURATION
    # --------------------------------------------------------

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


# ============================================================
# CREATE SETTINGS OBJECT
# ============================================================

settings = Settings()


# ============================================================
# BACKWARD COMPATIBILITY VARIABLES
# ============================================================

APP_NAME = settings.APP_NAME

APP_VERSION = settings.APP_VERSION

APP_ENV = settings.APP_ENV

DEBUG = settings.DEBUG


# ------------------------------------------------------------
# DATABASE
# ------------------------------------------------------------

DATABASE_URL = settings.DATABASE_URL


# ------------------------------------------------------------
# MONGODB
# ------------------------------------------------------------

MONGO_URL = settings.MONGO_URL

MONGO_DB_NAME = settings.MONGO_DB_NAME


# ------------------------------------------------------------
# JWT
# ------------------------------------------------------------

JWT_SECRET_KEY = settings.JWT_SECRET_KEY

SECRET_KEY = settings.SECRET_KEY

JWT_ALGORITHM = settings.JWT_ALGORITHM

ALGORITHM = settings.ALGORITHM

JWT_ACCESS_TOKEN_EXPIRE_MINUTES = (
    settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
)

ACCESS_TOKEN_EXPIRE_MINUTES = (
    settings.ACCESS_TOKEN_EXPIRE_MINUTES
)


# ------------------------------------------------------------
# FRONTEND
# ------------------------------------------------------------

FRONTEND_URL = settings.FRONTEND_URL


# ------------------------------------------------------------
# ML MODELS
# ------------------------------------------------------------

MODEL_PATH = settings.MODEL_PATH

PREPROCESSOR_PATH = settings.PREPROCESSOR_PATH

SCALER_PATH = settings.SCALER_PATH

FEATURE_NAMES_PATH = settings.FEATURE_NAMES_PATH


# ============================================================
# DISPLAY CONFIGURATION
# ============================================================

print("=" * 60)

print("HealthForecast AI Configuration")

print("=" * 60)

print(f"APP_NAME: {APP_NAME}")

print(f"APP_VERSION: {APP_VERSION}")

print(f"APP_ENV: {APP_ENV}")

print(f"DATABASE_URL: {DATABASE_URL}")

print(f"MONGO_URL: {MONGO_URL}")

print(f"MONGO_DB_NAME: {MONGO_DB_NAME}")

print(f"JWT_ALGORITHM: {JWT_ALGORITHM}")

print(f"ALGORITHM: {ALGORITHM}")

print(
    f"JWT_ACCESS_TOKEN_EXPIRE_MINUTES: "
    f"{JWT_ACCESS_TOKEN_EXPIRE_MINUTES}"
)

print(
    f"ACCESS_TOKEN_EXPIRE_MINUTES: "
    f"{ACCESS_TOKEN_EXPIRE_MINUTES}"
)

print(f"FRONTEND_URL: {FRONTEND_URL}")

print(f"MODEL_PATH: {MODEL_PATH}")

print(f"PREPROCESSOR_PATH: {PREPROCESSOR_PATH}")

print(f"SCALER_PATH: {SCALER_PATH}")

print(f"FEATURE_NAMES_PATH: {FEATURE_NAMES_PATH}")

print("=" * 60)