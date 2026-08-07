import csv
import io
from datetime import timedelta, datetime, date
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import Base, engine, get_db
import models
import schemas
import auth
import ml_service

Base.metadata.create_all(bind=engine)

app = FastAPI(title="HealthForecast AI", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

R = models.RoleEnum


def _log(db: Session, user: Optional[models.User], action: str, target: str = "", detail: str = ""):
    entry = models.AuditLog(
        actor_id=user.id if user else None,
        actor_name=user.full_name if user else "system",
        actor_role=(user.role.value if hasattr(user.role, "value") else str(user.role)) if user else "system",
        action=action, target=target, detail=detail,
    )
    db.add(entry)
    db.commit()


def _notify(db: Session, title: str, message: str, severity: str = "info",
            user_id: Optional[int] = None, role: Optional[str] = None, patient_id: Optional[int] = None):
    n = models.Notification(user_id=user_id, role=role, patient_id=patient_id,
                             title=title, message=message, severity=severity)
    db.add(n)
    db.commit()


# --------------------------------------------------------------------------
# AUTH
# --------------------------------------------------------------------------
@app.post("/auth/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(400, "Email already registered")
    user = models.User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=auth.hash_password(user_in.password),
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _log(db, user, "register", target=f"user:{user.id}")
    return user


@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is deactivated")
    token = auth.create_access_token(
        {"sub": str(user.id), "role": user.role}, timedelta(hours=8)
    )
    _log(db, user, "login")
    return schemas.Token(access_token=token, role=user.role, full_name=user.full_name)


@app.get("/auth/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(auth.get_current_user)):
    return user


# --------------------------------------------------------------------------
# USER MANAGEMENT MODULE (System Administrator only, per Access Matrix)
# --------------------------------------------------------------------------
@app.get("/users", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.system_admin])),
):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@app.post("/users", response_model=schemas.UserOut)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.system_admin])),
):
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(400, "Email already registered")
    new_user = models.User(
        full_name=user_in.full_name, email=user_in.email,
        hashed_password=auth.hash_password(user_in.password), role=user_in.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    _log(db, user, "create_user", target=f"user:{new_user.id}", detail=new_user.email)
    return new_user


@app.patch("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    patch: schemas.UserUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.system_admin])),
):
    target = db.query(models.User).get(user_id)
    if not target:
        raise HTTPException(404, "User not found")
    for k, v in patch.model_dump(exclude_unset=True).items():
        setattr(target, k, v)
    db.commit()
    db.refresh(target)
    _log(db, user, "update_user", target=f"user:{target.id}", detail=str(patch.model_dump(exclude_unset=True)))
    return target


# --------------------------------------------------------------------------
# PATIENTS  (Access Matrix: Doctor=assigned only, Admin=view-only all,
#            Researcher=anonymized only, SysAdmin=full)
# --------------------------------------------------------------------------
@app.post("/patients", response_model=schemas.PatientOut)
def create_patient(
    p: schemas.PatientCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.doctor, R.hospital_admin, R.system_admin])),
):
    patient = models.Patient(**p.model_dump(exclude={"medications"}), medications_json=p.medications)
    if user.role == R.doctor and not patient.assigned_doctor_id:
        patient.assigned_doctor_id = user.id
    db.add(patient)
    db.commit()
    db.refresh(patient)
    _log(db, user, "create_patient", target=f"patient:{patient.id}", detail=patient.mrn)
    return _patient_to_out(patient)


@app.get("/patients", response_model=List[schemas.PatientOut])
def list_patients(
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Patient)
    if user.role == R.doctor:
        q = q.filter(models.Patient.assigned_doctor_id == user.id)
    elif user.role == R.researcher:
        # Researchers get anonymized/aggregated access only — no individual PII listing
        raise HTTPException(403, "Researchers must use /analytics endpoints (anonymized data only)")
    patients = q.all()
    return [_patient_to_out(p) for p in patients]


@app.get("/patients/{patient_id}", response_model=schemas.PatientOut)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.doctor, R.hospital_admin, R.system_admin])),
):
    patient = _scoped_patient(db, user, patient_id)
    return _patient_to_out(patient)


@app.patch("/patients/{patient_id}", response_model=schemas.PatientOut)
def update_patient(
    patient_id: int,
    patch: schemas.PatientUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.doctor, R.system_admin])),
):
    patient = _scoped_patient(db, user, patient_id)
    data = patch.model_dump(exclude_unset=True)
    meds = data.pop("medications", None)
    for k, v in data.items():
        setattr(patient, k, v)
    if meds is not None:
        patient.medications_json = meds
    db.commit()
    db.refresh(patient)
    _log(db, user, "update_patient", target=f"patient:{patient.id}")
    return _patient_to_out(patient)


@app.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.system_admin])),
):
    patient = db.query(models.Patient).get(patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    db.delete(patient)
    db.commit()
    _log(db, user, "delete_patient", target=f"patient:{patient_id}")
    return {"status": "deleted"}


def _scoped_patient(db: Session, user: models.User, patient_id: int) -> models.Patient:
    patient = db.query(models.Patient).get(patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    if user.role == R.doctor and patient.assigned_doctor_id != user.id:
        raise HTTPException(403, "Patient not in your assigned scope")
    return patient


def _patient_to_out(p: models.Patient) -> schemas.PatientOut:
    data = {c.name: getattr(p, c.name) for c in p.__table__.columns}
    data["medications"] = data.pop("medications_json") or {}
    return schemas.PatientOut(**data)


# --------------------------------------------------------------------------
# RISK PREDICTION  (Doctor, Hospital Admin, System Admin = full patient-level;
#                    Researcher = aggregated only, handled in /analytics)
# --------------------------------------------------------------------------
@app.post("/patients/{patient_id}/predict", response_model=schemas.PredictionOut)
def predict_for_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.doctor, R.hospital_admin, R.system_admin])),
):
    patient = _scoped_patient(db, user, patient_id)

    patient_dict = {c.name: getattr(patient, c.name) for c in patient.__table__.columns}
    patient_dict["medications"] = patient.medications_json or {}
    result = ml_service.predict_risk(patient_dict)

    log = models.PredictionLog(patient_id=patient.id, **result)
    db.add(log)
    db.commit()
    db.refresh(log)
    _log(db, user, "run_prediction", target=f"patient:{patient.id}", detail=log.risk_category)

    if log.risk_category == "High":
        _notify(
            db, title=f"High readmission risk — {patient.full_name} ({patient.mrn})",
            message=f"30-day readmission probability {log.risk_score*100:.1f}%. Review care plan.",
            severity="critical", user_id=patient.assigned_doctor_id, role="hospital_admin",
            patient_id=patient.id,
        )
    return log


@app.get("/patients/{patient_id}/predictions", response_model=List[schemas.PredictionOut])
def prediction_history(
    patient_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.doctor, R.hospital_admin, R.system_admin])),
):
    _scoped_patient(db, user, patient_id)
    return db.query(models.PredictionLog).filter(models.PredictionLog.patient_id == patient_id).all()


# --------------------------------------------------------------------------
# TREATMENT EFFECTIVENESS MODULE
# --------------------------------------------------------------------------
@app.post("/patients/{patient_id}/treatments", response_model=schemas.TreatmentOut)
def add_treatment(
    patient_id: int,
    t: schemas.TreatmentCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.doctor, R.system_admin])),
):
    patient = _scoped_patient(db, user, patient_id)
    rec = models.TreatmentRecord(patient_id=patient.id, recorded_by_id=user.id, **t.model_dump())
    db.add(rec)
    db.commit()
    db.refresh(rec)
    _log(db, user, "add_treatment", target=f"patient:{patient.id}", detail=t.treatment_name)
    return rec


@app.get("/patients/{patient_id}/treatments", response_model=List[schemas.TreatmentOut])
def list_treatments(
    patient_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.doctor, R.hospital_admin, R.system_admin])),
):
    _scoped_patient(db, user, patient_id)
    return db.query(models.TreatmentRecord).filter(models.TreatmentRecord.patient_id == patient_id).all()


@app.get("/analytics/treatment-effectiveness")
def treatment_effectiveness(
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    """Aggregated — safe for all authenticated roles including Researcher."""
    rows = db.query(models.TreatmentRecord).all()
    total = len(rows)
    by_outcome = {}
    for r in rows:
        by_outcome[r.outcome] = by_outcome.get(r.outcome, 0) + 1
    avg_recovery = (sum(r.recovery_score for r in rows) / total) if total else 0.0
    return {
        "total_treatments": total,
        "by_outcome": by_outcome,
        "average_recovery_score": round(avg_recovery, 1),
    }


# --------------------------------------------------------------------------
# CLINICAL DECISION SUPPORT MODULE — saved follow-up / discharge care plans
# --------------------------------------------------------------------------
@app.post("/patients/{patient_id}/care-plan", response_model=schemas.CarePlanOut)
def create_care_plan(
    patient_id: int,
    cp: schemas.CarePlanCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.doctor, R.system_admin])),
):
    patient = _scoped_patient(db, user, patient_id)
    plan = models.CarePlan(patient_id=patient.id, created_by_id=user.id, **cp.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    _log(db, user, "create_care_plan", target=f"patient:{patient.id}")
    return plan


@app.get("/patients/{patient_id}/care-plan", response_model=List[schemas.CarePlanOut])
def get_care_plans(
    patient_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.doctor, R.hospital_admin, R.system_admin])),
):
    _scoped_patient(db, user, patient_id)
    return (
        db.query(models.CarePlan)
        .filter(models.CarePlan.patient_id == patient_id)
        .order_by(models.CarePlan.created_at.desc())
        .all()
    )


# --------------------------------------------------------------------------
# ANALYTICS / DASHBOARD  (aggregated — safe for Researcher role too)
# --------------------------------------------------------------------------
@app.get("/analytics/summary")
def analytics_summary(
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    total_patients = db.query(func.count(models.Patient.id)).scalar() or 0
    total_predictions = db.query(func.count(models.PredictionLog.id)).scalar() or 0
    high_risk = db.query(func.count(models.PredictionLog.id)).filter(
        models.PredictionLog.risk_category == "High"
    ).scalar() or 0
    avg_risk = db.query(func.avg(models.PredictionLog.risk_score)).scalar() or 0.0

    by_category = dict(
        db.query(models.PredictionLog.risk_category, func.count(models.PredictionLog.id))
        .group_by(models.PredictionLog.risk_category).all()
    )

    return {
        "total_patients": total_patients,
        "total_predictions": total_predictions,
        "high_risk_count": high_risk,
        "average_risk_score": round(float(avg_risk), 4),
        "risk_distribution": by_category,
    }


@app.get("/analytics/model-performance")
def model_performance(user: models.User = Depends(auth.get_current_user)):
    """Available to all authenticated roles — including Researcher (aggregated model metrics)."""
    return ml_service.get_model_metrics()


@app.get("/analytics/trends")
def analytics_trends(
    days: int = 30,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    """Daily prediction volume + average risk score, for the healthcare
    trend-visualization part of the Healthcare Analytics Dashboard module."""
    rows = db.query(models.PredictionLog).all()
    buckets = {}
    for r in rows:
        d = r.created_at.date().isoformat()
        b = buckets.setdefault(d, {"count": 0, "sum_risk": 0.0, "high": 0})
        b["count"] += 1
        b["sum_risk"] += r.risk_score
        if r.risk_category == "High":
            b["high"] += 1
    series = [
        {
            "date": d,
            "predictions": b["count"],
            "avg_risk_score": round(b["sum_risk"] / b["count"], 4),
            "high_risk_count": b["high"],
        }
        for d, b in sorted(buckets.items())
    ]
    return {"series": series[-days:]}


@app.get("/analytics/hospital-performance")
def hospital_performance(
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    """Hospital-performance reporting: avg length of stay, prior-utilization
    load, and a specialty breakdown — aggregated, safe for all roles."""
    patients = db.query(models.Patient).all()
    n = len(patients) or 1
    avg_los = sum(p.time_in_hospital or 0 for p in patients) / n
    avg_meds = sum(p.num_medications or 0 for p in patients) / n
    avg_prior_er = sum(p.number_emergency or 0 for p in patients) / n

    by_specialty = {}
    for p in patients:
        key = p.medical_specialty or "Missing"
        by_specialty[key] = by_specialty.get(key, 0) + 1

    return {
        "total_patients": len(patients),
        "avg_length_of_stay_days": round(avg_los, 2),
        "avg_medications_per_patient": round(avg_meds, 2),
        "avg_prior_emergency_visits": round(avg_prior_er, 2),
        "patients_by_specialty": by_specialty,
    }


@app.get("/analytics/export/patients")
def export_patients_csv(
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.doctor, R.hospital_admin, R.system_admin])),
):
    q = db.query(models.Patient)
    if user.role == R.doctor:
        q = q.filter(models.Patient.assigned_doctor_id == user.id)
    patients = q.all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["MRN", "Name", "Age Bracket", "Gender", "Time in Hospital",
                      "Num Medications", "Prior Inpatient", "Prior Emergency", "Diabetes Med"])
    for p in patients:
        writer.writerow([p.mrn, p.full_name, p.age_bracket, p.gender, p.time_in_hospital,
                          p.num_medications, p.number_inpatient, p.number_emergency, p.diabetesMed])
    buf.seek(0)
    _log(db, user, "export_patients_csv", detail=f"{len(patients)} rows")
    return StreamingResponse(
        iter([buf.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=patients_export.csv"},
    )


# --------------------------------------------------------------------------
# AI MODEL MANAGEMENT MODULE (System Administrator only)
# --------------------------------------------------------------------------
@app.get("/models")
def list_models(user: models.User = Depends(auth.require_roles([R.system_admin]))):
    metrics = ml_service.get_model_metrics()
    return {
        "active_model": {
            "name": "xgb_readmission_model",
            "algorithm": "XGBoost",
            "metrics": metrics.get("metrics", {}),
            "top_features": metrics.get("top_features", [])[:10],
        }
    }


@app.post("/models/retrain", response_model=schemas.ModelRunOut)
def request_retrain(
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.system_admin])),
):
    """Queues a retraining job. Actual training runs out-of-band via
    `model/train_model.py` against the latest data snapshot — this just
    records the request so it shows up in the Model Management dashboard."""
    run = models.ModelRun(requested_by_id=user.id, status="queued",
                           notes="Retrain requested from admin console. Run model/train_model.py to execute.")
    db.add(run)
    db.commit()
    db.refresh(run)
    _log(db, user, "request_retrain")
    return run


@app.get("/models/runs", response_model=List[schemas.ModelRunOut])
def model_runs(
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.system_admin])),
):
    return db.query(models.ModelRun).order_by(models.ModelRun.created_at.desc()).all()


# --------------------------------------------------------------------------
# AUDIT LOG (System Administrator only)
# --------------------------------------------------------------------------
@app.get("/audit-logs", response_model=List[schemas.AuditLogOut])
def audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.system_admin])),
):
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(limit).all()


# --------------------------------------------------------------------------
# NOTIFICATIONS
# --------------------------------------------------------------------------
@app.get("/notifications", response_model=List[schemas.NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    q = db.query(models.Notification).filter(
        (models.Notification.user_id == user.id) | (models.Notification.role == role_val)
    ).order_by(models.Notification.created_at.desc()).limit(50)
    return q.all()


@app.patch("/notifications/{notif_id}/read", response_model=schemas.NotificationOut)
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    n = db.query(models.Notification).get(notif_id)
    if not n:
        raise HTTPException(404, "Notification not found")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


@app.get("/health")
def health():
    return {"status": "ok", "service": "HealthForecast AI backend"}
