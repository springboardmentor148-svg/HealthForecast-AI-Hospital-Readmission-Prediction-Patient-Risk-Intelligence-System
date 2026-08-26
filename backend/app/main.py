import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Relative imports to avoid ModuleNotFoundError on Render
from .config import settings
from .database.postgres import engine, Base
from . import models  # Register SQLAlchemy models

from .routes.auth import router as auth_router
from .routes.patients import router as patients_router
from .routes.predictions import router as predictions_router
from .routes.analytics import router as analytics_router
from .routes.admin import router as admin_router
from .routes.models import router as models_router
from .routes.treatments import router as treatments_router
from .routes.users import router as users_router

# ============================================================
# AUTO-CREATE DATABASE TABLES
# ============================================================
Base.metadata.create_all(bind=engine)

# ============================================================
# CREATE APPLICATION
# ============================================================
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-Based Hospital Management and "
        "Health Risk Prediction System"
    ),
)

# ============================================================
# CORS MIDDLEWARE
# ============================================================
frontend_env = os.getenv("FRONTEND_URL", "")
allowed_origins = [
    "https://healthforecast-ai-frontend.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if frontend_env and frontend_env.rstrip("/") not in allowed_origins:
    allowed_origins.append(frontend_env.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ============================================================
# ROUTES
# ============================================================
app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"],
)

app.include_router(
    users_router,
)

app.include_router(
    patients_router,
    prefix="/patients",
    tags=["Patients"],
)

app.include_router(
    predictions_router,
    prefix="/predictions",
    tags=["Predictions"],
)

app.include_router(
    analytics_router,
    tags=["Analytics"],
)

app.include_router(
    admin_router,
)

app.include_router(
    models_router,
)

app.include_router(
    treatments_router,
)

# ============================================================
# ROOT & HEALTH CHECK
# ============================================================
@app.get("/")
def root():
    return {
        "message": "Welcome to HealthForecast AI",
        "version": settings.APP_VERSION,
        "status": "running",
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }