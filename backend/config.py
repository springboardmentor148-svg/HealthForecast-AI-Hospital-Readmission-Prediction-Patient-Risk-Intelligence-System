"""
config.py
Configuration module for the Diabetes Readmission Prediction System backend.
Handles environmental variables, cryptographic keys, and database paths securely.
"""

import os
from datetime import timedelta

class Config:
    """Base configuration settings shared across environments."""
    
    # Cryptographic secret key for signing session cookies and JWT arrays
    SECRET_KEY = os.environ.get('SECRET_KEY', '7d98345c2a10bfdbe73efca89104b281f6e9102c4b8b8f2d')
    
    # Path configuration for the SQLite relational data layer
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    DATABASE_PATH = os.path.join(BASE_DIR, 'database', 'database.db')
    
    # Enforce strict cross-origin tracking rules or allow credentials
    CORS_HEADERS = 'Content-Type'
    
    # JWT expiration thresholds (tokens expire after 24 hours)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Path settings for the compiled machine learning production pickles
    MODEL_DIR = os.path.join(BASE_DIR, 'models')
    MODEL_PATH = os.path.join(MODEL_DIR, "diabetes_model.json")
    SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.pkl')

class DevelopmentConfig(Config):
    """Configuration overrides specifically for local development cycles."""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production-grade security configurations."""
    DEBUG = False
    TESTING = False
    
    # In production, require the secret key to be injected via an environment variable
    def __init__(self):
        if os.environ.get('SECRET_KEY') == '7d98345c2a10bfdbe73efca89104b281f6e9102c4b8b8f2d':
            raise ValueError("CRITICAL SECURITY ALERT: Production SECRET_KEY must be modified!")

# Select configuration scheme based on system runtime variable
def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    if env == 'production':
        return ProductionConfig()
    return DevelopmentConfig()