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
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None


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


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age_bracket: Optional[str] = None
    gender: Optional[str] = None
    race: Optional[str] = None
    time_in_hospital: Optional[int] = None
    num_lab_procedures: Optional[int] = None
    num_procedures: Optional[int] = None
    num_medications: Optional[int] = None
    number_outpatient: Optional[int] = None
    number_emergency: Optional[int] = None
    number_inpatient: Optional[int] = None
    number_diagnoses: Optional[int] = None
    diag_1: Optional[str] = None
    diag_2: Optional[str] = None
    diag_3: Optional[str] = None
    max_glu_serum: Optional[str] = None
    A1Cresult: Optional[str] = None
    change: Optional[str] = None
    diabetesMed: Optional[str] = None
    medications: Optional[Dict[str, str]] = None
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


# ---------- Treatment Effectiveness ----------
class TreatmentCreate(BaseModel):
    treatment_name: str
    medication: str = ""
    outcome: str = "Ongoing"
    recovery_score: float = 0.0
    notes: str = ""


class TreatmentOut(TreatmentCreate):
    id: int
    patient_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Clinical Decision Support ----------
class CarePlanCreate(BaseModel):
    follow_up_date: Optional[datetime] = None
    discharge_instructions: str = ""
    risk_mitigation_steps: List[str] = []
    status: str = "Active"


class CarePlanOut(CarePlanCreate):
    id: int
    patient_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Audit ----------
class AuditLogOut(BaseModel):
    id: int
    actor_name: str
    actor_role: str
    action: str
    target: str
    detail: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Notifications ----------
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    severity: str
    is_read: bool
    patient_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Model Management ----------
class ModelRunOut(BaseModel):
    id: int
    status: str
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True
