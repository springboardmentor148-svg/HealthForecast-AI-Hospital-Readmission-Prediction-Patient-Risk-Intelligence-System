from pydantic import BaseModel
from typing import Optional


# Schema for creating a new admission record
class AdmissionCreate(BaseModel):
    patient_id: str
    admission_date: str
    discharge_date: str
    admission_reason: str
    ward: str
    attending_doctor: str
    discharge_summary: str


# Schema for updating an existing admission record
class AdmissionUpdate(BaseModel):
    admission_date: Optional[str] = None
    discharge_date: Optional[str] = None
    admission_reason: Optional[str] = None
    ward: Optional[str] = None
    attending_doctor: Optional[str] = None
    discharge_summary: Optional[str] = None