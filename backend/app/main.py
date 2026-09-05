from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api import auth, patients, predictions, analytics, reports, notifications
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    logger.info("🚀 Application started")
    yield
    await close_mongo_connection()
    logger.info("👋 Application shutdown")

app = FastAPI(
    title="HealthForecast AI API",
    version="1.0.0",
    docs_url="/api/docs",
    lifespan=lifespan
)

# CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0", "timestamp": str(datetime.utcnow())}

@app.get("/")
async def root():
    return {"message": "HealthForecast AI API", "docs": "/api/docs"}