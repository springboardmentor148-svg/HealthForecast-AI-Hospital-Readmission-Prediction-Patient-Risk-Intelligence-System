from pydantic import BaseModel, EmailStr


class PatientData(BaseModel):

    # Numeric
    age: int
    admission_type_id: int
    discharge_disposition_id: int
    admission_source_id: int
    time_in_hospital: int
    num_lab_procedures: int
    num_procedures: int
    num_medications: int
    number_outpatient: int
    number_emergency: int
    number_inpatient: int
    number_diagnoses: int

    # Encoded numeric
    max_glu_serum: int
    A1Cresult: int
    change: int
    diabetesMed: int

    # Categories
    gender: str
    race: str
    medical_specialty: str

    diag_1_cat: str
    diag_2_cat: str
    diag_3_cat: str

    # Medications
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
    insulin: str
    glyburide_metformin: str
    glipizide_metformin: str
    glimepiride_pioglitazone: str
    metformin_rosiglitazone: str
    metformin_pioglitazone: str

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str

from datetime import datetime
from typing import List


class PredictionResponse(BaseModel):
    prediction_id: int
    patient_id: int
    predicted_class: int
    risk_level: str
    probability: float
    confidence: str
    recommendation: list[str]
    predicted_by: str
    prediction_time: datetime

    class Config:
        from_attributes = True


class PredictionList(BaseModel):
    predictions: List[PredictionResponse]