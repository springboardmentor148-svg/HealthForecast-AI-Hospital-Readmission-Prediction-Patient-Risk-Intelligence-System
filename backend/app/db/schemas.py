from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

# User Schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Patient Schemas
class PatientCreate(BaseModel):
    patient_code: str
    full_name: str
    age: int
    gender: Optional[str] = "Unspecified"
    primary_diagnosis: Optional[str] = "Type 2 Diabetes"

class PatientResponse(PatientCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Prediction Input / Output
class PredictionInput(BaseModel):
    patient_code: str = "PAT-1001"
    full_name: str = "John Doe"
    age: int = 65
    gender: str = "Male"
    number_inpatient: int = 0
    discharge_disposition_id: int = 1
    number_emergency: int = 0
    number_diagnoses: int = 1
    diabetesMed: str = "Yes"
    number_outpatient: int = 0
    admission_source_id: int = 1
    age_group: str = "60-70"
    diag_1_Diabetes: str = "Yes"
    metformin: str = "No"
    admission_type_id: int = 1
    num_procedures: int = 0
    race_Asian: str = "No"

class RiskAssessmentResponse(BaseModel):
    id: int
    patient_id: int
    patient_code: str
    full_name: str
    risk_level: str
    probability: float
    created_at: datetime

    class Config:
        from_attributes = True