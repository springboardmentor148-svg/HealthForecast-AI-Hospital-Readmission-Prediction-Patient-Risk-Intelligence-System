import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth

app = FastAPI(title="HealthForecast AI")

# Standardize allowed origins into an explicit list
frontend_env = os.getenv("FRONTEND_URL", "")
allowed_origins = [
    "https://healthforecast-ai-frontend.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if frontend_env and frontend_env.rstrip("/") not in allowed_origins:
    allowed_origins.append(frontend_env.rstrip("/"))

# CORSMiddleware MUST be added directly after app initialization
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Mount routes below middleware
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "HealthForecast AI API"}

# Ensure app.include_router calls stay BELOW add_middleware

from app.config import settings


# ============================================================
# DATABASE
# ============================================================

from app.database.postgres import engine, Base

# Register all SQLAlchemy models
import app.models


# ============================================================
# ROUTES
# ============================================================

from app.routes.auth import router as auth_router
from app.routes.patients import router as patients_router
from app.routes.predictions import router as predictions_router
from app.routes.analytics import router as analytics_router
from app.routes.admin import router as admin_router
from app.routes.models import router as models_router
from app.routes.treatments import router as treatments_router
from app.routes.users import router as users_router


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
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# AUTHENTICATION
# ============================================================

app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# USERS
# ============================================================

app.include_router(
    users_router,
)


# ============================================================
# PATIENTS
# ============================================================

app.include_router(
    patients_router,
    prefix="/patients",
    tags=["Patients"],
)


# ============================================================
# PREDICTIONS
# ============================================================

app.include_router(
    predictions_router,
    prefix="/predictions",
    tags=["Predictions"],
)


# ============================================================
# ANALYTICS
# ============================================================

app.include_router(
    analytics_router,
    tags=["Analytics"],
)


# ============================================================
# ROLE BASED ACCESS CONTROL
#
# admin.py already contains:
#
#     prefix="/admin"
#
# Therefore DO NOT add another prefix here.
# ============================================================

app.include_router(
    admin_router,
)


# ============================================================
# MODELS
# ============================================================

app.include_router(
    models_router,
)


# ============================================================
# TREATMENTS
# ============================================================

app.include_router(
    treatments_router,
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to HealthForecast AI",
        "version": settings.APP_VERSION,
        "status": "running",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }