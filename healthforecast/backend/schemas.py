from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr
from models import RoleEnum


# ---------- Auth ----------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: RoleEnum


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: RoleEnum
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: RoleEnum
    full_name: str


# ---------- Patient ----------
class PatientCreate(BaseModel):
    mrn: str
    full_name: str
    age_bracket: str  # e.g. "[60-70)"
    gender: str
    race: str = "Missing"
    admission_type_id: int = 1
    discharge_disposition_id: int = 1
    admission_source_id: int = 1
    time_in_hospital: int = 1
    payer_code: str = "Missing"
    medical_specialty: str = "Missing"
    num_lab_procedures: int = 0
    num_procedures: int = 0
    num_medications: int = 0
    number_outpatient: int = 0
    number_emergency: int = 0
    number_inpatient: int = 0
    number_diagnoses: int = 1
    diag_1: str = "Missing"
    diag_2: str = "Missing"
    diag_3: str = "Missing"
    max_glu_serum: str = "None"
    A1Cresult: str = "None"
    change: str = "No"
    diabetesMed: str = "No"
    medications: Dict[str, str] = {}
    assigned_doctor_id: Optional[int] = None


class PatientOut(PatientCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionOut(BaseModel):
    patient_id: int
    risk_score: float
    risk_category: str
    top_factors: List[Dict[str, Any]]
    care_recommendations: List[str]
    created_at: datetime

    class Config:
        from_attributes = True
