from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.database.postgres import get_db

from app.models.patient import Patient

from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse
)

from app.security.jwt import get_current_user


# ============================================================
# ROUTER
# ============================================================

router = APIRouter()


# ============================================================
# CREATE PATIENT
# ============================================================

@router.post(
    "/",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED
)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # --------------------------------------------------------
    # Check duplicate patient code
    # --------------------------------------------------------

    existing_patient = (
        db.query(Patient)
        .filter(
            Patient.patient_code
            == patient_data.patient_code
        )
        .first()
    )

    if existing_patient:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient code already exists"
        )

    # --------------------------------------------------------
    # Create patient object
    # --------------------------------------------------------

    new_patient = Patient(
        patient_code=patient_data.patient_code,
        full_name=patient_data.full_name,
        age=patient_data.age,
        gender=patient_data.gender,
        race=patient_data.race,
        medical_history=patient_data.medical_history,
        admission_history=patient_data.admission_history
    )

    # --------------------------------------------------------
    # Save to PostgreSQL
    # --------------------------------------------------------

    db.add(new_patient)

    db.commit()

    db.refresh(new_patient)

    return new_patient


# ============================================================
# GET ALL PATIENTS
# ============================================================

@router.get(
    "/",
    response_model=List[PatientResponse]
)
def get_all_patients(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    patients = (
        db.query(Patient)
        .order_by(
            Patient.id.desc()
        )
        .all()
    )

    return patients


# ============================================================
# GET SINGLE PATIENT
# ============================================================

@router.get(
    "/{patient_id}",
    response_model=PatientResponse
)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id
        )
        .first()
    )

    if not patient:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    return patient


# ============================================================
# UPDATE PATIENT
# ============================================================

@router.put(
    "/{patient_id}",
    response_model=PatientResponse
)
def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # --------------------------------------------------------
    # Find patient
    # --------------------------------------------------------

    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id
        )
        .first()
    )

    if not patient:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # --------------------------------------------------------
    # Get only fields provided by user
    # --------------------------------------------------------

    update_data = patient_data.model_dump(
        exclude_unset=True
    )

    # --------------------------------------------------------
    # Check duplicate patient code
    # --------------------------------------------------------

    if "patient_code" in update_data:

        existing_patient = (
            db.query(Patient)
            .filter(
                Patient.patient_code
                == update_data["patient_code"],
                Patient.id != patient_id
            )
            .first()
        )

        if existing_patient:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient code already exists"
            )

    # --------------------------------------------------------
    # Update fields
    # --------------------------------------------------------

    for field, value in update_data.items():

        setattr(
            patient,
            field,
            value
        )

    # --------------------------------------------------------
    # Save changes
    # --------------------------------------------------------

    db.commit()

    db.refresh(patient)

    return patient


# ============================================================
# DELETE PATIENT
# ============================================================

@router.delete(
    "/{patient_id}"
)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # --------------------------------------------------------
    # Find patient
    # --------------------------------------------------------

    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id
        )
        .first()
    )

    if not patient:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # --------------------------------------------------------
    # Delete patient
    # --------------------------------------------------------

    db.delete(patient)

    db.commit()

    return {
        "message": "Patient deleted successfully",
        "patient_id": patient_id
    }