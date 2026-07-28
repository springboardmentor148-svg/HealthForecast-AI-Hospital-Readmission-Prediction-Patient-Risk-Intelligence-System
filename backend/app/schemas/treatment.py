from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TreatmentCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    treatment_name: str
    description: Optional[str] = None
    status: Optional[str] = "planned"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class TreatmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: Optional[int] = None
    treatment_name: str
    description: Optional[str] = None
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True