from __future__ import annotations

import csv
import io
import threading
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from .config import settings
from .database import get_db
from .models import CarePlan, DoctorPatientAssignment, Encounter, ModelVersion, Patient, User
from .schemas import AssignmentCreate, CarePlanCreate, CarePlanOut, LoginRequest, PatientDetail, PatientOut, PredictionOut, TokenResponse, UserCreate, UserOut
from .security import create_access_token, get_current_user, hash_password, require_roles, verify_password

app = FastAPI(title="HealthForecast AI", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALL_CLINICAL_ROLES = ("Doctor", "Hospital Administrator", "System Administrator")
model_training = {"running": False, "message": "No local retraining job has been started."}
model_training_lock = threading.Lock()


def visible_patient_ids(db: Session, user: User):
    if user.role == "Doctor":
        return db.query(DoctorPatientAssignment.patient_id).filter(DoctorPatientAssignment.doctor_id == user.id)
    return db.query(Patient.id)


def get_visible_patient(db: Session, user: User, patient_id: int) -> Patient:
    query = db.query(Patient).filter(Patient.id == patient_id)
    if user.role == "Doctor":
        query = query.join(DoctorPatientAssignment).filter(DoctorPatientAssignment.doctor_id == user.id)
    patient = query.first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found in your permitted scope")
    return patient


def serialize_patient(patient: Patient, include_identifier: bool = True) -> PatientOut:
    encounters = patient.encounters or []
    latest = max(encounters, key=lambda encounter: encounter.id) if encounters else None
    return PatientOut(
        id=patient.id,
        patient_nbr=patient.patient_nbr if include_identifier else None,
        race=patient.race,
        gender=patient.gender,
        age=patient.age,
        encounter_count=len(encounters),
        latest_risk_score=latest.risk_score if latest else None,
        latest_risk_category=latest.risk_category if latest else None,
    )


def risk_category(probability: float) -> str:
    if probability >= 0.35:
        return "High"
    if probability >= 0.18:
        return "Medium"
    return "Low"


def high_risk_filter():
    return (Encounter.risk_score >= 0.35) | (Encounter.number_inpatient >= 2) | (Encounter.number_emergency >= 1) | (Encounter.num_medications >= 15) | (Encounter.a1c_result.in_([">7", ">8"]))


def grouped_outcomes(db: Session, column, label: str = "group"):
    rows = db.query(column, func.count(Encounter.id), func.sum(case((Encounter.readmitted == "<30", 1), else_=0))).group_by(column).order_by(column).all()
    return [{label: group or "Unknown", "encounters": count, "readmissions": int(readmits or 0), "rate": round((readmits or 0) / count * 100, 2)} for group, count, readmits in rows]


def risk_signals(encounter: Encounter) -> list[str]:
    signals: list[str] = []
    if encounter.number_inpatient >= 2:
        signals.append("Multiple prior inpatient visits")
    if encounter.number_emergency >= 1:
        signals.append("Prior emergency department visit")
    if encounter.num_medications >= 15:
        signals.append("High medication burden")
    if encounter.a1c_result in {">7", ">8"}:
        signals.append("Elevated HbA1c result")
    if encounter.time_in_hospital >= 7:
        signals.append("Long hospital stay")
    return signals or ["No elevated rule-based signals identified"]


@lru_cache(maxsize=1)
def load_model():
    path = Path(settings.model_path)
    return joblib.load(path) if path.exists() else None


def calculate_probability(encounter: Encounter) -> tuple[float, str]:
    artifact = load_model()
    if artifact:
        frame = pd.DataFrame([{column: encounter.payload.get(column) for column in artifact["feature_columns"]}])
        return float(artifact["pipeline"].predict_proba(frame)[0][1]), artifact["model_name"]
    score = 0.08 + 0.08 * min(encounter.number_inpatient, 3) + 0.06 * min(encounter.number_emergency, 2)
    score += 0.05 if encounter.a1c_result in {">7", ">8"} else 0
    score += 0.05 if encounter.num_medications >= 15 else 0
    return min(score, 0.95), "Rule-based demo baseline"


@app.get("/health")
def health():
    return {"status": "ok", "service": "HealthForecast AI"}


@app.post(f"{settings.api_prefix}/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash) or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    return TokenResponse(access_token=create_access_token(user), role=user.role, name=user.name)


@app.get(f"{settings.api_prefix}/auth/me", response_model=UserOut)
def current_user(user: User = Depends(get_current_user)):
    return user


@app.get(f"{settings.api_prefix}/users", response_model=list[UserOut])
def list_users(user: User = Depends(require_roles("System Administrator")), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.role, User.name).all()


@app.get(f"{settings.api_prefix}/assignments")
def list_assignments(user: User = Depends(require_roles("System Administrator")), db: Session = Depends(get_db)):
    rows = db.query(DoctorPatientAssignment, User, Patient).join(User, DoctorPatientAssignment.doctor_id == User.id).join(Patient, DoctorPatientAssignment.patient_id == Patient.id).order_by(User.name, Patient.id).all()
    return [{"id": assignment.id, "doctor_id": doctor.id, "doctor": doctor.name, "patient_id": patient.id, "patient_nbr": patient.patient_nbr, "age": patient.age} for assignment, doctor, patient in rows]


@app.post(f"{settings.api_prefix}/assignments", status_code=status.HTTP_201_CREATED)
def create_assignment(payload: AssignmentCreate, user: User = Depends(require_roles("System Administrator")), db: Session = Depends(get_db)):
    doctor = db.get(User, payload.doctor_id)
    patient = db.get(Patient, payload.patient_id)
    if not doctor or doctor.role != "Doctor" or not patient:
        raise HTTPException(status_code=422, detail="Select an existing doctor and patient")
    existing = db.query(DoctorPatientAssignment).filter_by(doctor_id=doctor.id, patient_id=patient.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Patient is already assigned to this doctor")
    assignment = DoctorPatientAssignment(doctor_id=doctor.id, patient_id=patient.id)
    db.add(assignment)
    db.commit()
    return {"id": assignment.id, "doctor_id": doctor.id, "patient_id": patient.id}


@app.post(f"{settings.api_prefix}/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, user: User = Depends(require_roles("System Administrator")), db: Session = Depends(get_db)):
    allowed_roles = {"Doctor", "Hospital Administrator", "Healthcare Researcher", "System Administrator"}
    if payload.role not in allowed_roles:
        raise HTTPException(status_code=422, detail="Unknown role")
    if db.query(User).filter(func.lower(User.email) == payload.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email already exists")
    new_user = User(email=payload.email.lower(), name=payload.name, role=payload.role, password_hash=hash_password(payload.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get(f"{settings.api_prefix}/dashboard")
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scoped = db.query(Encounter).filter(Encounter.patient_id.in_(visible_patient_ids(db, user))) if user.role == "Doctor" else db.query(Encounter)
    total = scoped.count()
    under_30 = scoped.filter(Encounter.readmitted == "<30").count()
    high_risk = scoped.filter(high_risk_filter()).with_entities(Encounter.patient_id).distinct().count()
    return {
        "role": user.role,
        "total_encounters": total,
        "unique_patients": scoped.with_entities(Encounter.patient_id).distinct().count(),
        "readmission_rate": round(under_30 / total * 100, 2) if total else 0,
        "high_risk_patients": high_risk,
        "model_status": "Trained" if load_model() else "Baseline - train model to activate ML",
    }


@app.get(f"{settings.api_prefix}/patients", response_model=list[PatientOut])
def list_patients(
    search: str = Query(default="", max_length=40),
    risk: str = Query(default="", max_length=20),
    limit: int = Query(default=30, ge=1, le=100),
    user: User = Depends(require_roles(*ALL_CLINICAL_ROLES)),
    db: Session = Depends(get_db),
):
    query = db.query(Patient).options(joinedload(Patient.encounters))
    if user.role == "Doctor":
        query = query.join(DoctorPatientAssignment).filter(DoctorPatientAssignment.doctor_id == user.id)
    if search:
        query = query.filter(Patient.patient_nbr.ilike(f"%{search}%"))
    if risk == "High":
        query = query.join(Encounter).filter(high_risk_filter()).distinct()
    return [serialize_patient(patient) for patient in query.order_by(Patient.id).limit(limit).all()]


@app.get(f"{settings.api_prefix}/patients/high-risk", response_model=list[PatientOut])
def high_risk_patients(limit: int = Query(default=50, ge=1, le=100), user: User = Depends(require_roles(*ALL_CLINICAL_ROLES)), db: Session = Depends(get_db)):
    query = db.query(Patient).options(joinedload(Patient.encounters)).join(Encounter).filter(high_risk_filter()).distinct()
    if user.role == "Doctor":
        query = query.join(DoctorPatientAssignment).filter(DoctorPatientAssignment.doctor_id == user.id)
    return [serialize_patient(patient) for patient in query.order_by(Patient.id).limit(limit).all()]


@app.get(f"{settings.api_prefix}/patients/{{patient_id}}", response_model=PatientDetail)
def patient_detail(patient_id: int, user: User = Depends(require_roles(*ALL_CLINICAL_ROLES)), db: Session = Depends(get_db)):
    patient = get_visible_patient(db, user, patient_id)
    encounters = db.query(Encounter).filter(Encounter.patient_id == patient.id).order_by(Encounter.id.desc()).all()
    summary = serialize_patient(patient)
    return PatientDetail(**summary.model_dump(), encounters=encounters)


@app.get(f"{settings.api_prefix}/patients/{{patient_id}}/care-plans", response_model=list[CarePlanOut])
def list_care_plans(patient_id: int, user: User = Depends(require_roles(*ALL_CLINICAL_ROLES)), db: Session = Depends(get_db)):
    get_visible_patient(db, user, patient_id)
    return db.query(CarePlan).filter(CarePlan.patient_id == patient_id).order_by(CarePlan.created_at.desc()).all()


@app.post(f"{settings.api_prefix}/patients/{{patient_id}}/care-plans", response_model=CarePlanOut)
def create_care_plan(patient_id: int, payload: CarePlanCreate, user: User = Depends(require_roles("Doctor", "System Administrator")), db: Session = Depends(get_db)):
    get_visible_patient(db, user, patient_id)
    plan = CarePlan(patient_id=patient_id, created_by=user.id, **payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@app.post(f"{settings.api_prefix}/predictions/{{encounter_id}}", response_model=PredictionOut)
def predict(encounter_id: str, user: User = Depends(require_roles(*ALL_CLINICAL_ROLES)), db: Session = Depends(get_db)):
    encounter = db.query(Encounter).filter(Encounter.encounter_id == encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    get_visible_patient(db, user, encounter.patient_id)
    probability, model_name = calculate_probability(encounter)
    category = risk_category(probability)
    encounter.risk_score, encounter.risk_category = probability, category
    db.commit()
    return PredictionOut(encounter_id=encounter_id, probability=round(probability, 4), risk_category=category, risk_signals=risk_signals(encounter), model=model_name)


@app.get(f"{settings.api_prefix}/analytics/readmission")
def readmission_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return grouped_outcomes(db, Encounter.age)


@app.get(f"{settings.api_prefix}/analytics/treatment")
def treatment_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return grouped_outcomes(db, Encounter.medication_change)


@app.get(f"{settings.api_prefix}/analytics/medications")
def medication_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"insulin": grouped_outcomes(db, Encounter.insulin), "diabetes_medication": grouped_outcomes(db, Encounter.diabetes_med), "a1c": grouped_outcomes(db, Encounter.a1c_result)}


@app.get(f"{settings.api_prefix}/analytics/performance")
def operational_analytics(user: User = Depends(require_roles("Hospital Administrator", "Healthcare Researcher", "System Administrator")), db: Session = Depends(get_db)):
    specialty = grouped_outcomes(db, Encounter.medical_specialty, "specialty")
    specialty.sort(key=lambda row: row["encounters"], reverse=True)
    utilization_rows = db.query(Encounter.number_inpatient, func.count(Encounter.id), func.sum(case((Encounter.readmitted == "<30", 1), else_=0))).group_by(Encounter.number_inpatient).order_by(Encounter.number_inpatient).limit(6).all()
    utilization = [{"prior_inpatient_visits": visits, "encounters": count, "readmissions": int(readmits or 0), "rate": round((readmits or 0) / count * 100, 2)} for visits, count, readmits in utilization_rows]
    return {"specialties": specialty[:12], "utilization": utilization, "note": "The source dataset has no hospital identifier; specialty is used as the available department proxy."}


@app.get(f"{settings.api_prefix}/analytics/outcomes")
def outcome_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Encounter.readmitted, func.count(Encounter.id)).group_by(Encounter.readmitted).all()
    return [{"outcome": outcome, "count": count} for outcome, count in rows]


@app.get(f"{settings.api_prefix}/reports/operations.csv")
def operations_report(user: User = Depends(require_roles("Hospital Administrator", "System Administrator")), db: Session = Depends(get_db)):
    rows = db.query(Encounter.medical_specialty, Encounter.age, Encounter.time_in_hospital, Encounter.number_inpatient, Encounter.number_emergency, Encounter.num_medications, Encounter.a1c_result, Encounter.medication_change, Encounter.readmitted).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["medical_specialty", "age", "time_in_hospital", "prior_inpatient_visits", "prior_emergency_visits", "num_medications", "a1c_result", "medication_change", "readmitted"])
    writer.writerows(rows)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=healthforecast_operations_report.csv"})


@app.get(f"{settings.api_prefix}/reports/research.csv")
def research_export(user: User = Depends(require_roles("Healthcare Researcher", "System Administrator")), db: Session = Depends(get_db)):
    rows = db.query(Encounter.age, Encounter.race, Encounter.gender, Encounter.time_in_hospital, Encounter.admission_type_id, Encounter.a1c_result, Encounter.insulin, Encounter.medication_change, Encounter.readmitted).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["age", "race", "gender", "time_in_hospital", "admission_type", "a1c_result", "insulin", "medication_change", "readmitted"])
    writer.writerows(rows)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=healthforecast_anonymized_research.csv"})


@app.get(f"{settings.api_prefix}/models")
def models(user: User = Depends(require_roles("System Administrator")), db: Session = Depends(get_db)):
    return [{"id": model.id, "name": model.name, "metrics": model.metrics, "is_active": model.is_active, "created_at": model.created_at} for model in db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).all()]


@app.post(f"{settings.api_prefix}/models/{{model_id}}/activate")
def activate_model(model_id: int, user: User = Depends(require_roles("System Administrator")), db: Session = Depends(get_db)):
    model = db.get(ModelVersion, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model version not found")
    for item in db.query(ModelVersion).all():
        item.is_active = item.id == model.id
    db.commit()
    return {"id": model.id, "name": model.name, "is_active": True}


def run_local_training():
    global model_training
    try:
        from .train_model import main as train_model

        train_model()
        load_model.cache_clear()
        with model_training_lock:
            model_training = {"running": False, "message": "Training completed. The selected model is active."}
    except Exception as error:
        with model_training_lock:
            model_training = {"running": False, "message": f"Training failed: {error}"}


@app.get(f"{settings.api_prefix}/models/training-status")
def training_status(user: User = Depends(require_roles("System Administrator"))):
    with model_training_lock:
        return model_training


@app.post(f"{settings.api_prefix}/models/retrain", status_code=status.HTTP_202_ACCEPTED)
def retrain_model(user: User = Depends(require_roles("System Administrator"))):
    global model_training
    with model_training_lock:
        if model_training["running"]:
            raise HTTPException(status_code=409, detail="A local model-training job is already running")
        model_training = {"running": True, "message": "Training candidate models from the supplied dataset."}
    threading.Thread(target=run_local_training, daemon=True).start()
    return model_training
