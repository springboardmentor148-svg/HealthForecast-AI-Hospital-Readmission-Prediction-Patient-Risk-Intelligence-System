from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.treatment import Treatment
from app.schemas.treatment import (
    TreatmentCreate,
    TreatmentResponse,
)


router = APIRouter(
    prefix="/treatments",
    tags=["Treatments"],
)


# ============================================================
# CREATE TREATMENT
# ============================================================

@router.post(
    "/",
    response_model=TreatmentResponse,
)
def create_treatment(
    treatment_data: TreatmentCreate,
    db: Session = Depends(get_db),
):

    # Check whether patient exists
    from app.models.patient import Patient

    patient = (
        db.query(Patient)
        .filter(
            Patient.id ==
            treatment_data.patient_id
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    # Create treatment
    treatment = Treatment(
        patient_id=
            treatment_data.patient_id,

        doctor_id=
            treatment_data.doctor_id,

        treatment_name=
            treatment_data.treatment_name,

        description=
            treatment_data.description,

        status=
            treatment_data.status,

        start_date=
            treatment_data.start_date,

        end_date=
            treatment_data.end_date,
    )

    db.add(treatment)

    db.commit()

    db.refresh(treatment)

    return treatment


# ============================================================
# GET ALL TREATMENTS
# ============================================================

@router.get(
    "/",
    response_model=List[TreatmentResponse],
)
def get_treatments(
    db: Session = Depends(get_db),
):

    treatments = (
        db.query(Treatment)
        .order_by(
            Treatment.created_at.desc()
        )
        .all()
    )

    return treatments


# ============================================================
# GET TREATMENTS BY PATIENT
# ============================================================

@router.get(
    "/patient/{patient_id}",
    response_model=List[TreatmentResponse],
)
def get_patient_treatments(
    patient_id: int,
    db: Session = Depends(get_db),
):

    treatments = (
        db.query(Treatment)
        .filter(
            Treatment.patient_id ==
            patient_id
        )
        .order_by(
            Treatment.created_at.desc()
        )
        .all()
    )

    return treatments


# ============================================================
# GET SINGLE TREATMENT
# ============================================================

@router.get(
    "/{treatment_id}",
    response_model=TreatmentResponse,
)
def get_treatment(
    treatment_id: int,
    db: Session = Depends(get_db),
):

    treatment = (
        db.query(Treatment)
        .filter(
            Treatment.id ==
            treatment_id
        )
        .first()
    )

    if not treatment:
        raise HTTPException(
            status_code=404,
            detail="Treatment not found",
        )

    return treatment