from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# ============================================================
# CREATE PATIENT
# ============================================================

class PatientCreate(BaseModel):

    patient_code: str = Field(
        ...,
        min_length=1,
        max_length=50
    )

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=255
    )

    age: int = Field(
        ...,
        ge=0,
        le=120
    )

    gender: str = Field(
        ...,
        min_length=1,
        max_length=50
    )

    race: Optional[str] = Field(
        default=None,
        max_length=100
    )

    medical_history: Optional[str] = None

    admission_history: Optional[str] = None


# ============================================================
# UPDATE PATIENT
# ============================================================

class PatientUpdate(BaseModel):

    patient_code: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=50
    )

    full_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=255
    )

    age: Optional[int] = Field(
        default=None,
        ge=0,
        le=120
    )

    gender: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=50
    )

    race: Optional[str] = Field(
        default=None,
        max_length=100
    )

    medical_history: Optional[str] = None

    admission_history: Optional[str] = None


# ============================================================
# PATIENT RESPONSE
# ============================================================

class PatientResponse(BaseModel):

    id: int

    patient_code: str

    full_name: str

    age: int

    gender: str

    race: Optional[str] = None

    medical_history: Optional[str] = None

    admission_history: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True
    )