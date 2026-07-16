from pydantic import BaseModel
from typing import Optional

# Medical History Schema
class MedicalHistoryCreate(BaseModel):
    patient_id: str
    disease: str
    treatment: str
    medication: str
    admission_date: str
    discharge_date: str
    notes: str
    
    

# Medical History Update Schema
class MedicalHistoryUpdate(BaseModel):
    disease: Optional[str] = None
    treatment: Optional[str] = None
    medication: Optional[str] = None
    admission_date: Optional[str] = None
    discharge_date: Optional[str] = None
    notes: Optional[str] = None    