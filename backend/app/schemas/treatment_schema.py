from pydantic import BaseModel
from typing import Optional


# Treatment Create Schema
class TreatmentCreate(BaseModel):
    patient_id: str
    treatment_name: str
    medication: str
    dosage: str
    start_date: str
    end_date: str
    status: str
    doctor_notes: str


# Treatment Update Schema
class TreatmentUpdate(BaseModel):
    treatment_name: Optional[str] = None
    medication: Optional[str] = None
    dosage: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    doctor_notes: Optional[str] = None