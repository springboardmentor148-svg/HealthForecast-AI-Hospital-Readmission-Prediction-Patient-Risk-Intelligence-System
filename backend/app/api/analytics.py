from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import RiskAssessment, Patient

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    total_assessments = db.query(RiskAssessment).count() or 1
    high_risk = db.query(RiskAssessment).filter(RiskAssessment.risk_level == "High Risk").count()
    low_risk = db.query(RiskAssessment).filter(RiskAssessment.risk_level == "Low Risk").count()

    high_risk_pct = round((high_risk / total_assessments) * 100, 1)
    low_risk_pct = round((low_risk / total_assessments) * 100, 1)

    return {
        "total_assessments": total_assessments,
        "high_risk_count": high_risk,
        "high_risk_pct": high_risk_pct,
        "low_risk_count": low_risk,
        "low_risk_pct": low_risk_pct,
        "feature_weights": [
            {"feature": "Number of Inpatient Visits", "weight": "34%"},
            {"feature": "Discharge Disposition ID", "weight": "22%"},
            {"feature": "Emergency Room Visits", "weight": "18%"},
            {"feature": "Number of Diagnoses", "weight": "14%"},
            {"feature": "Diabetes Medication Prescribed", "weight": "12%"},
        ]
    }