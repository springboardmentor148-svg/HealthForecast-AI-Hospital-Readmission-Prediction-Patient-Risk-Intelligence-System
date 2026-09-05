from fastapi import APIRouter
from app.services.analytics_service import AnalyticsService

router = APIRouter()
analytics_service = AnalyticsService()

@router.get("/dashboard")
async def get_dashboard():
    return await analytics_service.get_dashboard_metrics()

@router.get("/readmissions")
async def get_readmission_stats():
    return await analytics_service.get_readmission_stats()

@router.get("/treatments")
async def get_treatment_effectiveness():
    return await analytics_service.get_treatment_effectiveness()

@router.get("/features")
async def get_feature_importance():
    return await analytics_service.get_feature_importance()

@router.get("/risk-distribution")
async def get_risk_distribution():
    return await analytics_service.get_risk_distribution()