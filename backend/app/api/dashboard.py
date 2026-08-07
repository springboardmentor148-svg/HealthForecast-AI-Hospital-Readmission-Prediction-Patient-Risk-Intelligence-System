from datetime import date, datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Patient, RiskAssessment

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_patients = db.query(Patient).count()

    high_risk_count = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.risk_level == "High Risk")
        .count()
    )
    low_risk_count = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.risk_level == "Low Risk")
        .count()
    )

    today = date.today()
    assessments_today = (
        db.query(RiskAssessment)
        .filter(
            RiskAssessment.created_at
            >= datetime(today.year, today.month, today.day)
        )
        .count()
    )

    recent_assessments_raw = (
        db.query(RiskAssessment, Patient)
        .join(Patient, RiskAssessment.patient_id == Patient.id)
        .order_by(RiskAssessment.id.desc())
        .limit(5)
        .all()
    )

    recent_assessments = []
    for assessment, patient in recent_assessments_raw:
        time_str = (
            assessment.created_at.strftime("%I:%M %p") 
            if hasattr(assessment, "created_at") and assessment.created_at 
            else "Just now"
        )
        recent_assessments.append(
            {
                "id": patient.patient_code or f"PAT-{patient.id}",
                "name": patient.full_name,
                "age": patient.age,
                "risk": assessment.risk_level,
                "prob": f"{assessment.probability:.1f}%",
                "date": time_str,
            }
        )

    return {
        "stats": [
            {
                "title": "Total Patients Managed",
                "value": f"{total_patients:,}",
                "change": "Active DB Records",
                "color": "#0284c7",
                "bg": "#e0f2fe",
            },
            {
                "title": "High Readmission Risk",
                "value": str(high_risk_count),
                "change": f"{((high_risk_count / (total_patients or 1)) * 100):.1f}% of active patients",
                "color": "#dc2626",
                "bg": "#fee2e2",
            },
            {
                "title": "Low Risk Clearances",
                "value": str(low_risk_count),
                "change": "Overall success rate",
                "color": "#16a34a",
                "bg": "#dcfce7",
            },
            {
                "title": "Assessments Run Today",
                "value": str(assessments_today),
                "change": "Updated live",
                "color": "#9333ea",
                "bg": "#f3e8ff",
            },
        ],
        "recent_activity": recent_assessments,
    }