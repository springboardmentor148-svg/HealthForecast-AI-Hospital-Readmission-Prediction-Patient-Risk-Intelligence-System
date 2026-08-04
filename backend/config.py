# ==========================================================
# Prognexa AI
# Configuration File
# ==========================================================

import os

# ==========================================================
# PROJECT ROOT
# ==========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ==========================================================
# MODEL DIRECTORY
# ==========================================================

MODEL_DIR = os.path.join(BASE_DIR, "model")

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "readmission_model.json"
)

FEATURE_PATH = os.path.join(
    MODEL_DIR,
    "feature_columns.json"
)

ENCODER_PATH = os.path.join(
    MODEL_DIR,
    "label_encoders.pkl"
)

# ==========================================================
# MONGODB
# ==========================================================

# Environment variable takes precedence; fallback to local default
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

DB_NAME = os.getenv("DB_NAME", "prognexa_db")

# ==========================================================
# JWT SETTINGS
# ==========================================================

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "prognexa-super-secret-key-change-in-production")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))