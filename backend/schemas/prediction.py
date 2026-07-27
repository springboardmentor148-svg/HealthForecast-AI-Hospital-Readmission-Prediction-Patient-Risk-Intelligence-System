"""Prediction request/response schemas."""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PredictionRequest(BaseModel):
    """
    Clinical input for the readmission-risk model. If `patient_id` is
    provided, the patient's stored record is used/updated; otherwise the
    inline clinical fields below are used directly for a one-off prediction.
    """
    patient_id: Optional[uuid.UUID] = None

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


class PredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    probability: float
    risk_category: str
    confidence: float
    recommendation: str
    model_version: str
    created_at: datetime


class PredictionListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[PredictionResponse]
