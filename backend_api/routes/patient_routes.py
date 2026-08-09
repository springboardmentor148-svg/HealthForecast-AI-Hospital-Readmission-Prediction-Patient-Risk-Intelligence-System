import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Patient, User
from schemas import PatientCreate, PatientResponse
from auth_utils import get_current_user

router = APIRouter(prefix="/patients", tags=["Patients"])


def _to_patient_response(p: Patient) -> PatientResponse:
    history = json.loads(p.medical_history) if p.medical_history else []
    return PatientResponse(
        id=p.id,
        patientId=f"PT-{1000 + p.id}",
        name=p.name,
        age=p.age,
        gender=p.gender,
        condition=p.condition,
        admissionDate=p.admission_date,
        dischargeDate=p.discharge_date,
        lastVisit=p.last_visit,
        riskLevel=p.risk_level,
        readmissionProbability=p.readmission_probability,
        confidence=p.confidence,
        medicalHistory=history,
        contactNumber=p.contact_number,
        address=p.address,
        emergencyContactName=p.emergency_contact_name,
        emergencyContactNumber=p.emergency_contact_number,
        bloodGroup=p.blood_group,
        admittingDepartment=p.admitting_department,
        allergies=p.allergies,
        currentMedications=p.current_medications,
    )


@router.post("", response_model=PatientResponse)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_patient = Patient(
        doctor_id=current_user.id,
        name=payload.name,
        age=payload.age,
        gender=payload.gender,
        condition=payload.condition,
        admission_date=payload.admissionDate,
        discharge_date=payload.dischargeDate,
        last_visit=payload.lastVisit,
        risk_level=payload.riskLevel,
        readmission_probability=payload.readmissionProbability,
        confidence=payload.confidence,
        medical_history=json.dumps(payload.medicalHistory) if payload.medicalHistory else None,
        contact_number=payload.contactNumber,
        address=payload.address,
        emergency_contact_name=payload.emergencyContactName,
        emergency_contact_number=payload.emergencyContactNumber,
        blood_group=payload.bloodGroup,
        admitting_department=payload.admittingDepartment,
        allergies=payload.allergies,
        current_medications=payload.currentMedications,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return _to_patient_response(new_patient)


@router.get("", response_model=List[PatientResponse])
def get_my_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patients = (
        db.query(Patient)
        .filter(Patient.doctor_id == current_user.id)
        .order_by(Patient.created_at.desc())
        .all()
    )

    return [_to_patient_response(p) for p in patients]


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient_by_id(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    raw_id = patient_id.upper().replace("PT-", "") if patient_id.upper().startswith("PT-") else patient_id

    try:
        numeric_id = int(raw_id)
        if patient_id.upper().startswith("PT-"):
            numeric_id -= 1000
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid patient ID format")

    patient = (
        db.query(Patient)
        .filter(Patient.id == numeric_id, Patient.doctor_id == current_user.id)
        .first()
    )

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return _to_patient_response(patient)