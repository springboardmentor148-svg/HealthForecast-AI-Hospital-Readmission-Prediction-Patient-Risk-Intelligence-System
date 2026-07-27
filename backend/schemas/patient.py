"""Patient request/response schemas."""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PatientBase(BaseModel):
    patient_name: str
    gender: str
    age: int = Field(ge=0, le=130)
    race: Optional[str] = None

    admission_type: Optional[str] = None
    discharge_disposition: Optional[str] = None
    admission_source: Optional[str] = None

    time_in_hospital: int = Field(default=0, ge=0)
    num_lab_procedures: int = Field(default=0, ge=0)
    num_procedures: int = Field(default=0, ge=0)
    num_medications: int = Field(default=0, ge=0)
    number_outpatient: int = Field(default=0, ge=0)
    number_emergency: int = Field(default=0, ge=0)
    number_inpatient: int = Field(default=0, ge=0)

    diagnosis_1: Optional[str] = None
    diagnosis_2: Optional[str] = None
    diagnosis_3: Optional[str] = None

    diabetes_med: Optional[str] = None
    insulin: Optional[str] = None
    a1c_result: Optional[str] = None
    glucose_result: Optional[str] = None

    attending_doctor: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    """All fields optional — partial update."""
    patient_name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = Field(default=None, ge=0, le=130)
    race: Optional[str] = None
    admission_type: Optional[str] = None
    discharge_disposition: Optional[str] = None
    admission_source: Optional[str] = None
    time_in_hospital: Optional[int] = None
    num_lab_procedures: Optional[int] = None
    num_procedures: Optional[int] = None
    num_medications: Optional[int] = None
    number_outpatient: Optional[int] = None
    number_emergency: Optional[int] = None
    number_inpatient: Optional[int] = None
    diagnosis_1: Optional[str] = None
    diagnosis_2: Optional[str] = None
    diagnosis_3: Optional[str] = None
    diabetes_med: Optional[str] = None
    insulin: Optional[str] = None
    a1c_result: Optional[str] = None
    glucose_result: Optional[str] = None
    attending_doctor: Optional[str] = None


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime


class PatientListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[PatientResponse]


class PatientFilterParams(BaseModel):
    search: Optional[str] = None
    gender: Optional[str] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    admission_type: Optional[str] = None
    attending_doctor: Optional[str] = None
    sort_by: str = "created_at"
    sort_order: str = "desc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=200)
