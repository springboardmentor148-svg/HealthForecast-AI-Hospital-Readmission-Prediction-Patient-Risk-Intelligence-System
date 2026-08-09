import json
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Patient, Prediction, User
from auth_utils import get_current_user

router = APIRouter(prefix="/doctor", tags=["Doctor Dashboard"])


def _parse_percent(value: str) -> float:
    """'91%' jaisi string se number nikalta hai. Fail hone par 0 return karta hai."""
    try:
        return float(str(value).replace("%", "").strip())
    except (ValueError, TypeError):
        return 0.0


def _get_real_model_accuracy() -> str:
    """
    dataset/model_metrics.json se real accuracy padhta hai
    (compute_metrics.py se generate hoti hai — asli test data pe evaluate ki gayi).
    File na mile toh "N/A" return karta hai — fake number kabhi nahi dikhata.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))   # backend_api\routes
    backend_api_dir = os.path.dirname(current_dir)               # backend_api
    project_root = os.path.dirname(backend_api_dir)               # HealthForecastAI
    metrics_path = os.path.join(project_root, "dataset", "model_metrics.json")

    try:
        with open(metrics_path, "r") as f:
            metrics = json.load(f)
        return f"{metrics['accuracy']}%"
    except (FileNotFoundError, KeyError, json.JSONDecodeError):
        return "N/A"


@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patients = db.query(Patient).filter(Patient.doctor_id == current_user.id).all()
    predictions = (
        db.query(Prediction)
        .filter(Prediction.doctor_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )

    high_risk_count = sum(1 for p in patients if p.risk_level == "High")
    low_risk_count = sum(1 for p in patients if p.risk_level == "Low")

    today = datetime.now(timezone.utc).date()
    predictions_today = sum(
        1 for p in predictions if p.created_at and p.created_at.date() == today
    )

    if predictions:
        avg_confidence = sum(_parse_percent(p.confidence) for p in predictions) / len(predictions)
    else:
        avg_confidence = 0.0

    recent = predictions[:5]

    return {
        "assignedPatients": len(patients),
        "predictionsToday": predictions_today,
        "highRiskPatients": high_risk_count,
        "lowRiskPatients": low_risk_count,
        "modelAccuracy": _get_real_model_accuracy(),  # dataset/model_metrics.json se real value
        "averageConfidence": f"{avg_confidence:.1f}%",
        "recentPredictions": [
            {
                "id": f"P-{p.id}",
                "name": p.patient_name or "—",
                "prediction": p.result,
                "confidence": p.confidence,
                "risk": p.risk_level,
                "date": p.created_at.strftime("%d %b %Y, %I:%M %p") if p.created_at else "",
            }
            for p in recent
        ],
    }