"""Dashboard endpoints: summaries, recent activity, and hospital overview."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.dashboard import DashboardSummary, HospitalOverview, ReadmissionStats, RecentPrediction
from services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """High-level KPI summary: patient counts, prediction counts, risk breakdown."""
    return DashboardService(db).get_summary()


@router.get("/recent-predictions", response_model=list[RecentPrediction])
def recent_predictions(
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Most recent predictions across the platform."""
    return DashboardService(db).get_recent_predictions(limit)


@router.get("/high-risk-patients", response_model=list[RecentPrediction])
def high_risk_patients(
    limit: int = Query(20, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Most recent high-risk / critical-risk predictions, useful for triage lists."""
    all_recent = DashboardService(db).get_recent_predictions(limit=200)
    high_risk = [p for p in all_recent if p.risk_category in {"high", "critical"}]
    return high_risk[:limit]


@router.get("/readmission-statistics", response_model=ReadmissionStats)
def readmission_statistics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Aggregate readmission vs. non-readmission statistics."""
    return DashboardService(db).get_readmission_stats()


@router.get("/hospital-overview", response_model=HospitalOverview)
def hospital_overview(
    hospital_name: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Hospital-level overview: patient counts, doctor counts, high-risk counts."""
    return DashboardService(db).get_hospital_overview(hospital_name or current_user.hospital_name)
