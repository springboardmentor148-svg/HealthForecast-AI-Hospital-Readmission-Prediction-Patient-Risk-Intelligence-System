from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Treatment, Patient, User
from schemas import TreatmentCreate, TreatmentResponse
from auth_utils import get_current_user

router = APIRouter(prefix="/treatments", tags=["Treatment Effectiveness"])


def _resolve_patient_db_id(patient_id: str) -> int:
    raw_id = patient_id.upper().replace("PT-", "") if patient_id.upper().startswith("PT-") else patient_id
    try:
        numeric_id = int(raw_id)
        if patient_id.upper().startswith("PT-"):
            numeric_id -= 1000
        return numeric_id
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid patient ID format")


@router.post("", response_model=TreatmentResponse)
def create_treatment(
    payload: TreatmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_patient_id = _resolve_patient_db_id(payload.patientId)
    patient = db.query(Patient).filter(
        Patient.id == db_patient_id, Patient.doctor_id == current_user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    new_treatment = Treatment(
        doctor_id=current_user.id,
        patient_id=patient.id,
        treatment_plan=payload.treatmentPlan,
        start_date=payload.startDate,
        effectiveness=payload.effectiveness,
        recovery_trend=payload.recoveryTrend,
        adherence=payload.adherence,
    )
    db.add(new_treatment)
    db.commit()
    db.refresh(new_treatment)

    return TreatmentResponse(
        id=new_treatment.id,
        patientId=f"PT-{1000 + patient.id}",
        name=patient.name,
        treatment=new_treatment.treatment_plan,
        startDate=new_treatment.start_date,
        effectiveness=new_treatment.effectiveness,
        recoveryTrend=new_treatment.recovery_trend,
        adherence=new_treatment.adherence,
    )


@router.get("", response_model=List[TreatmentResponse])
def get_my_treatments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(Treatment, Patient)
        .join(Patient, Treatment.patient_id == Patient.id)
        .filter(Treatment.doctor_id == current_user.id)
        .order_by(Treatment.created_at.desc())
        .all()
    )

    return [
        TreatmentResponse(
            id=t.id,
            patientId=f"PT-{1000 + p.id}",
            name=p.name,
            treatment=t.treatment_plan,
            startDate=t.start_date,
            effectiveness=t.effectiveness,
            recoveryTrend=t.recovery_trend,
            adherence=t.adherence,
        )
        for t, p in records
    ]


@router.get("/summary")
def get_effectiveness_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = db.query(Treatment).filter(Treatment.doctor_id == current_user.id).all()
    total = len(records)
    good = sum(1 for r in records if r.effectiveness == "Good")
    needs_review = sum(1 for r in records if r.effectiveness in ("Moderate", "Poor"))

    return {"totalEvaluated": total, "goodResponse": good, "needsReview": needs_review}