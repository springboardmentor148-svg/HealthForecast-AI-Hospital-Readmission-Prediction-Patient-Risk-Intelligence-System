from datetime import timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import Base, engine, get_db
import models
import schemas
import auth
import ml_service

Base.metadata.create_all(bind=engine)

app = FastAPI(title="HealthForecast AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

R = models.RoleEnum

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
    return user


@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    token = auth.create_access_token(
        {"sub": str(user.id), "role": user.role}, timedelta(hours=8)
    )
    return schemas.Token(access_token=token, role=user.role, full_name=user.full_name)


@app.get("/auth/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(auth.get_current_user)):
    return user


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
    patient = db.query(models.Patient).get(patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    if user.role == R.doctor and patient.assigned_doctor_id != user.id:
        raise HTTPException(403, "Patient not in your assigned scope")
    return _patient_to_out(patient)


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
    patient = db.query(models.Patient).get(patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    if user.role == R.doctor and patient.assigned_doctor_id != user.id:
        raise HTTPException(403, "Patient not in your assigned scope")

    patient_dict = {c.name: getattr(patient, c.name) for c in patient.__table__.columns}
    patient_dict["medications"] = patient.medications_json or {}
    result = ml_service.predict_risk(patient_dict)

    log = models.PredictionLog(patient_id=patient.id, **result)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@app.get("/patients/{patient_id}/predictions", response_model=List[schemas.PredictionOut])
def prediction_history(
    patient_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles([R.doctor, R.hospital_admin, R.system_admin])),
):
    return db.query(models.PredictionLog).filter(models.PredictionLog.patient_id == patient_id).all()


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


@app.get("/health")
def health():
    return {"status": "ok", "service": "HealthForecast AI backend"}
