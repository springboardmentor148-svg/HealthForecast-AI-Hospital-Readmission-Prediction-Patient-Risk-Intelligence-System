"""Analytics endpoints: trends, distributions, and breakdowns for research/reporting."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import RequireRoles
from schemas.dashboard import AgeDistributionPoint, MonthlyAnalyticsPoint, TrendPoint
from services.analytics_service import AnalyticsService
from utils.constants import ANALYTICS_ROLES

router = APIRouter(prefix="/analytics", tags=["Analytics"],
                    dependencies=[Depends(RequireRoles(*ANALYTICS_ROLES))])


@router.get("/age-distribution", response_model=list[AgeDistributionPoint])
def age_distribution(db: Session = Depends(get_db)):
    """Patient age distribution, bucketed into 10-year bands."""
    return AnalyticsService(db).get_age_distribution()


@router.get("/monthly", response_model=list[MonthlyAnalyticsPoint])
def monthly_analytics(db: Session = Depends(get_db)):
    """Monthly prediction volume and average risk probability."""
    return AnalyticsService(db).get_monthly_analytics()


@router.get("/readmission-distribution", response_model=list[TrendPoint])
def readmission_distribution(db: Session = Depends(get_db)):
    """Distribution of predictions across risk categories (low/moderate/high/critical)."""
    return AnalyticsService(db).get_readmission_distribution()


@router.get("/patient-trends", response_model=list[TrendPoint])
def patient_trends(db: Session = Depends(get_db)):
    """High-level patient volume trend indicators."""
    return AnalyticsService(db).get_patient_trends()
