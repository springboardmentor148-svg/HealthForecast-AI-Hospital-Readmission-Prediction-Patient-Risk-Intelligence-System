from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

# Import routers
from app.routes.auth import router as auth_router
from app.routes.patients import router as patients_router
from app.routes.predictions import router as predictions_router
from app.routes.analytics import router as analytics_router
from app.routes.admin import router as admin_router


# ============================================================
# Create FastAPI Application
# ============================================================

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Based Hospital Management and Health Risk Prediction System",
)


# ============================================================
# CORS Configuration
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
# Include API Routers
# ============================================================

# Authentication
app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"],
)

# Patients
app.include_router(
    patients_router,
    prefix="/patients",
    tags=["Patients"],
)

# Predictions
app.include_router(
    predictions_router,
    prefix="/predictions",
    tags=["Predictions"],
)

# Analytics / Dashboard
app.include_router(
    analytics_router,
    prefix="/analytics",
    tags=["Analytics"],
)

# Admin
app.include_router(
    admin_router,
    prefix="/admin",
    tags=["Admin"],
)


# ============================================================
# Root Endpoint
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to HealthForecast AI",
        "version": settings.APP_VERSION,
        "status": "running",
    }


# ============================================================
# Health Check
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }