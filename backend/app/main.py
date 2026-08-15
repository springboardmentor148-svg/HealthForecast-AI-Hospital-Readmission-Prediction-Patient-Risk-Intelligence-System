from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

# Import database engine and Base models to auto-create missing tables
from app.database.postgres import engine, Base
import app.models  # Ensures all model definitions are registered

from app.routes.auth import router as auth_router
from app.routes.patients import router as patients_router
from app.routes.predictions import router as predictions_router
from app.routes.analytics import router as analytics_router
from app.routes.admin import router as admin_router
from app.routes.models import router as models_router
from app.routes.treatments import router as treatments_router
from app.routes.users import router as users_router

# ============================================================
# AUTO-CREATE DATABASE TABLES ON STARTUP
# ============================================================
Base.metadata.create_all(bind=engine)

# ============================================================
# CREATE APPLICATION
# ============================================================

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Based Hospital Management and Health Risk Prediction System",
)

# ============================================================
# CORS (Allows both local testing and Render live frontend)
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
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
    prefix="/analytics",
    tags=["Analytics"],
)

app.include_router(
    admin_router,
    prefix="/admin",
    tags=["Admin"],
)

app.include_router(
    models_router,
)

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