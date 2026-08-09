from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Prediction, Patient, User
from auth_utils import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


def _parse_percent(value: str) -> float:
    try:
        return float(str(value).replace("%", "").strip())
    except (ValueError, TypeError):
        return 0.0


@router.get("/summary")
def get_report_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)

    predictions = (
        db.query(Prediction)
        .filter(Prediction.doctor_id == current_user.id)
        .all()
    )

    monthly_predictions = [
        p for p in predictions
        if p.created_at and p.created_at.month == now.month and p.created_at.year == now.year
    ]

    high_risk = sum(1 for p in monthly_predictions if p.risk_level == "High")
    low_risk = sum(1 for p in monthly_predictions if p.risk_level == "Low")

    if monthly_predictions:
        avg_confidence = sum(_parse_percent(p.confidence) for p in monthly_predictions) / len(monthly_predictions)
    else:
        avg_confidence = 0.0

    return {
        "monthlyPredictions": len(monthly_predictions),
        "highRiskCases": high_risk,
        "lowRiskCases": low_risk,
        "averageConfidence": f"{avg_confidence:.1f}%",
    }


@router.get("/high-risk-patients")
def get_high_risk_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patients = (
        db.query(Patient)
        .filter(Patient.doctor_id == current_user.id, Patient.risk_level == "High")
        .order_by(Patient.created_at.desc())
        .all()
    )

    return [
        {
            "patientId": f"PT-{1000 + p.id}",
            "name": p.name,
            "condition": p.condition,
            "readmissionProbability": p.readmission_probability,
        }
        for p in patients
    ]


@router.get("/low-risk-patients")
def get_low_risk_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patients = (
        db.query(Patient)
        .filter(Patient.doctor_id == current_user.id, Patient.risk_level == "Low")
        .order_by(Patient.created_at.desc())
        .all()
    )

    return [
        {
            "patientId": f"PT-{1000 + p.id}",
            "name": p.name,
            "condition": p.condition,
            "readmissionProbability": p.readmission_probability,
        }
        for p in patients
    ]


@router.get("/monthly-stats")
def get_monthly_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)

    predictions = (
        db.query(Prediction)
        .filter(Prediction.doctor_id == current_user.id)
        .all()
    )

    monthly = [
        p for p in predictions
        if p.created_at and p.created_at.month == now.month and p.created_at.year == now.year
    ]

    readmission_count = sum(1 for p in monthly if p.result == "Readmission")
    no_readmission_count = sum(1 for p in monthly if p.result == "No Readmission")

    return {
        "readmissionPredicted": readmission_count,
        "noReadmissionPredicted": no_readmission_count,
        "totalThisMonth": len(monthly),
    }