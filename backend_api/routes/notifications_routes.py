from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Prediction, Patient, User
from auth_utils import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _time_ago(dt) -> str:
    if not dt:
        return ""
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = diff.total_seconds()

    if seconds < 60:
        return "Just now"
    if seconds < 3600:
        return f"{int(seconds // 60)} min ago"
    if seconds < 86400:
        return f"{int(seconds // 3600)} hr ago"
    if seconds < 172800:
        return "Yesterday"
    return dt.strftime("%d %b %Y")


@router.get("/doctor")
def get_doctor_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = []

    # Recent predictions
    recent_predictions = (
        db.query(Prediction)
        .filter(Prediction.doctor_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .limit(5)
        .all()
    )
    for p in recent_predictions:
        name = p.patient_name or "a patient"
        items.append({
            "id": f"pred-{p.id}",
            "text": f"Prediction ready for {name}: {p.result}",
            "time": _time_ago(p.created_at),
            "createdAt": p.created_at,
        })

    # Recently added high-risk patients
    recent_high_risk = (
        db.query(Patient)
        .filter(Patient.doctor_id == current_user.id, Patient.risk_level == "High")
        .order_by(Patient.created_at.desc())
        .limit(5)
        .all()
    )
    for pt in recent_high_risk:
        items.append({
            "id": f"patient-{pt.id}",
            "text": f"New high-risk patient flagged: {pt.name}",
            "time": _time_ago(pt.created_at),
            "createdAt": pt.created_at,
        })

    # Sabse naya sabse upar
    items.sort(key=lambda x: x["createdAt"] or datetime.min, reverse=True)

    for item in items:
        item.pop("createdAt", None)

    return items[:8]