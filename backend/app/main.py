"""
HealthForecast AI — application entrypoint.

Run with:
    uvicorn app.main:app --reload
from the `backend/` directory.
"""
import os
import sys
import time

# Ensure the backend root (parent of this `app/` package) is importable,
# regardless of the working directory the server is launched from — the
# project's core/, models/, routers/, etc. packages live at the backend
# root, not nested under app/.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from core.config import settings
from core.exceptions import register_exception_handlers
from core.logging import configure_logging, get_logger, request_logger
from core.database import Base, engine
import models  # noqa: F401 — ensures all models are registered on Base.metadata

from routers import analytics, auth, dashboard, patients, prediction, reports, users

configure_logging()
logger = get_logger("healthforecast.app")

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "HealthForecast AI — Hospital Readmission Prediction & Patient Risk "
        "Intelligence System. Backend-only REST API (FastAPI) for authentication, "
        "RBAC, patient management, AI prediction, analytics, dashboards, and reports."
    ),
    version=settings.MODEL_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    request_logger.info(
        "%s %s -> %s (%.2fms)",
        request.method, request.url.path, response.status_code, duration_ms,
    )
    return response


# ---------------------------------------------------------------------------
# Centralised exception handling
# ---------------------------------------------------------------------------
register_exception_handlers(app)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
api_prefix = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(patients.router, prefix=api_prefix)
app.include_router(prediction.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)


# ---------------------------------------------------------------------------
# Health check & startup
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
def health_check():
    """Liveness/readiness probe."""
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.MODEL_VERSION}


@app.on_event("startup")
def on_startup():
    logger.info("Starting %s (env=%s)", settings.APP_NAME, settings.APP_ENV)
    # NOTE: Table creation here is a convenience for local/dev use only.
    # In staging/production, schema changes must go through Alembic migrations.
    if settings.APP_ENV == "development":
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables ensured (development mode).")


# ---------------------------------------------------------------------------
# Root & API info routes (prevents "Not Found" when visiting base URL)
# ---------------------------------------------------------------------------
@app.get("/", tags=["Info"])
def root():
    """Root endpoint — returns API info."""
    return {
        "app": settings.APP_NAME,
        "version": settings.MODEL_VERSION,
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "api": settings.API_V1_PREFIX,
    }


@app.get("/api", tags=["Info"])
@app.get("/api/v1", tags=["Info"])
def api_info():
    """API version info."""
    return {
        "api_version": "v1",
        "prefix": settings.API_V1_PREFIX,
        "docs": "/docs",
        "endpoints": [
            f"{settings.API_V1_PREFIX}/auth",
            f"{settings.API_V1_PREFIX}/patients",
            f"{settings.API_V1_PREFIX}/prediction",
            f"{settings.API_V1_PREFIX}/dashboard",
            f"{settings.API_V1_PREFIX}/analytics",
            f"{settings.API_V1_PREFIX}/reports",
        ],
    }

