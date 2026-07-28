from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..core.database import get_db
from ..core.deps import get_current_user, require_roles
from ..models.db_models import User, Patient, RiskAssessment
from ..schemas.patient import PatientCreate, PatientUpdate, PatientOut

router = APIRouter(prefix="/patients", tags=["Patient Data Management"])


def _latest_risk(db: Session, patient_id: str) -> RiskAssessment | None:
    return (
        db.query(RiskAssessment)
        .filter(RiskAssessment.patient_id == patient_id)
        .order_by(desc(RiskAssessment.created_at))
        .first()
    )


def _serialize(db: Session, patient: Patient, anonymize: bool = False) -> dict:
    latest = _latest_risk(db, patient.id)
    data = {
        "id": patient.id,
        "mrn": "ANON-" + patient.id[:8] if anonymize else patient.mrn,
        "full_name": "Anonymized Patient" if anonymize else patient.full_name,
        "race": patient.race,
        "gender": patient.gender,
        "age_bracket": patient.age_bracket,
        "attending_doctor_id": None if anonymize else patient.attending_doctor_id,
        "clinical_features": patient.clinical_features,
        "admitted_at": patient.admitted_at,
        "created_at": patient.created_at,
        "latest_risk": latest,
    }
    return data


@router.get("", response_model=list[PatientOut])
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Patient)

    if current_user.role == "doctor":
        query = query.filter(Patient.attending_doctor_id == current_user.id)
        anonymize = False
    elif current_user.role == "hospital_administrator":
        anonymize = False
    elif current_user.role == "healthcare_researcher":
        anonymize = True
    elif current_user.role == "system_admin":
        anonymize = False
    else:
        raise HTTPException(status_code=403, detail="Role not permitted")

    patients = query.order_by(desc(Patient.created_at)).all()
    return [_serialize(db, p, anonymize) for p in patients]


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    anonymize = current_user.role == "healthcare_researcher"
    if current_user.role == "doctor" and patient.attending_doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Patient outside assigned scope")

    return _serialize(db, patient, anonymize)


@router.post("", response_model=PatientOut, status_code=201)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("doctor", "system_admin")),
):
    if db.query(Patient).filter(Patient.mrn == payload.mrn).first():
        raise HTTPException(status_code=400, detail="MRN already exists")

    attending_id = payload.attending_doctor_id
    if current_user.role == "doctor":
        attending_id = current_user.id  # doctors can only create patients under themselves

    patient = Patient(
        mrn=payload.mrn,
        full_name=payload.full_name,
        race=payload.race,
        gender=payload.gender,
        age_bracket=payload.age_bracket,
        attending_doctor_id=attending_id,
        clinical_features=payload.clinical_features.model_dump(by_alias=True),
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return _serialize(db, patient)


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("doctor", "system_admin")),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.role == "doctor" and patient.attending_doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Patient outside assigned scope")

    if payload.full_name is not None:
        patient.full_name = payload.full_name
    if payload.attending_doctor_id is not None and current_user.role == "system_admin":
        patient.attending_doctor_id = payload.attending_doctor_id
    if payload.clinical_features is not None:
        patient.clinical_features = payload.clinical_features.model_dump(by_alias=True)

    db.commit()
    db.refresh(patient)
    return _serialize(db, patient)


@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles("system_admin")),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return None
