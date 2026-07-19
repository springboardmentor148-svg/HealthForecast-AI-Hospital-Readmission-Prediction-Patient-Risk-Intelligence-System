# ==========================================================
# Prognexa AI
# Request Schemas
# ==========================================================

from pydantic import BaseModel, Field
from typing import Literal, Optional, List
from datetime import datetime


# ==========================================================
# PATIENT DATA (50 features for prediction)
# ==========================================================

class PatientData(BaseModel):
    # Demographics
    race: Literal["Caucasian", "AfricanAmerican", "Asian", "Hispanic", "Other"]
    gender: Literal["Male", "Female", "Unknown/Invalid"]
    age: Literal["[0-10)", "[10-20)", "[20-30)", "[30-40)", "[40-50)", "[50-60)", "[60-70)", "[70-80)", "[80-90)", "[90-100)"]
    weight: str
    payer_code: str
    medical_specialty: str

    # Admission
    admission_type_id: int
    discharge_disposition_id: int
    admission_source_id: int
    time_in_hospital: int = Field(..., ge=1)

    # Lab & procedures
    num_lab_procedures: int = Field(..., ge=0)
    num_procedures: int = Field(..., ge=0)
    num_medications: int = Field(..., ge=0)

    # Visit history
    number_outpatient: int = Field(..., ge=0)
    number_emergency: int = Field(..., ge=0)
    number_inpatient: int = Field(..., ge=0)
    number_diagnoses: int = Field(..., ge=1)

    # Diagnosis codes
    diag_1: str
    diag_2: str
    diag_3: str

    # Lab results
    max_glu_serum: str
    A1Cresult: str

    # Medications (23)
    metformin: str
    repaglinide: str
    nateglinide: str
    chlorpropamide: str
    glimepiride: str
    acetohexamide: str
    glipizide: str
    glyburide: str
    tolbutamide: str
    pioglitazone: str
    rosiglitazone: str
    acarbose: str
    miglitol: str
    troglitazone: str
    tolazamide: str
    examide: str
    citoglipton: str
    insulin: str
    glyburide_metformin: str
    glipizide_metformin: str
    glimepiride_pioglitazone: str
    metformin_rosiglitazone: str
    metformin_pioglitazone: str

    # Behaviour
    change: str
    diabetesMed: str


# ==========================================================
# AUTH MODELS
# ==========================================================

class UserCreate(BaseModel):
    username: str
    password: str
    role: str  # doctor, admin, researcher, sysadmin
    full_name: Optional[str] = None
    department: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserInDB(BaseModel):
    username: str
    hashed_password: str
    role: str
    full_name: Optional[str] = None
    department: Optional[str] = None
    assigned_patients: List[str] = []  # For doctors
    disabled: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


# ==========================================================
# PATIENT RECORD (for storage)
# ==========================================================

class PatientRecord(BaseModel):
    patient_id: str  # Unique identifier
    name: str
    age_group: str
    gender: str
    assigned_doctor: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    clinical_data: PatientData
    prediction_result: Optional[dict] = None


# ==========================================================
# PREDICTION RESULT
# ==========================================================

class PredictionResult(BaseModel):
    patient_id: str
    prediction: str
    prediction_value: int
    probability: float
    risk_level: str
    recommendation: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    doctor_username: Optional[str] = None


# ==========================================================
# CHANGE PASSWORD
# ==========================================================

class ChangePassword(BaseModel):
    old_password: str
    new_password: str


# ==========================================================
# ASSIGN PATIENT
# ==========================================================

class AssignPatient(BaseModel):
    patient_id: str
    doctor_username: str