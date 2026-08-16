from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Prediction, Patient, User, AuditLog, Dataset, ExportLog, Report
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

    items.sort(key=lambda x: x["createdAt"] or datetime.min, reverse=True)
    for item in items:
        item.pop("createdAt", None)

    return items[:8]


# ---------- SYSTEM ADMIN ----------
@router.get("/admin")
def get_admin_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = []

    recent_logs = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(8)
        .all()
    )
    for log in recent_logs:
        text = log.action.replace("_", " ").title()
        if log.target:
            text += f": {log.target}"
        items.append({
            "id": f"audit-{log.id}",
            "text": text,
            "time": _time_ago(log.timestamp),
            "createdAt": log.timestamp,
        })

    items.sort(key=lambda x: x["createdAt"] or datetime.min, reverse=True)
    for item in items:
        item.pop("createdAt", None)

    return items[:8]


# ---------- HEALTHCARE RESEARCHER ----------
@router.get("/researcher")
def get_researcher_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = []

    # Apne khud ke recent dataset exports
    recent_exports = (
        db.query(ExportLog)
        .filter(ExportLog.researcher_id == current_user.id)
        .order_by(ExportLog.created_at.desc())
        .limit(5)
        .all()
    )
    for e in recent_exports:
        items.append({
            "id": f"export-{e.id}",
            "text": f"Dataset export completed: {e.dataset_name} ({e.record_count} records)",
            "time": _time_ago(e.created_at),
            "createdAt": e.created_at,
        })

    # Naye datasets jo platform pe add hue
    recent_datasets = (
        db.query(Dataset)
        .order_by(Dataset.created_at.desc())
        .limit(5)
        .all()
    )
    for d in recent_datasets:
        items.append({
            "id": f"dataset-{d.id}",
            "text": f"New dataset available: {d.name}",
            "time": _time_ago(d.created_at),
            "createdAt": d.created_at,
        })

    items.sort(key=lambda x: x["createdAt"] or datetime.min, reverse=True)
    for item in items:
        item.pop("createdAt", None)

    return items[:8]


# ---------- HOSPITAL ADMINISTRATOR ----------
@router.get("/hospital-admin")
def get_hospital_admin_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = []

    # Apne hospital ke ready reports
    recent_reports = (
        db.query(Report)
        .filter(Report.hospital_name == current_user.hospital_name, Report.status == "Ready")
        .order_by(Report.created_at.desc())
        .limit(5)
        .all()
    )
    for r in recent_reports:
        items.append({
            "id": f"report-{r.id}",
            "text": f"{r.title} is ready to view.",
            "time": _time_ago(r.created_at),
            "createdAt": r.created_at,
        })

    # Apne hospital ke doctors ke naye high-risk patients
    recent_high_risk = (
        db.query(Patient)
        .join(User, Patient.doctor_id == User.id)
        .filter(User.hospital_name == current_user.hospital_name, Patient.risk_level == "High")
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

    items.sort(key=lambda x: x["createdAt"] or datetime.min, reverse=True)
    for item in items:
        item.pop("createdAt", None)

    return items[:8]