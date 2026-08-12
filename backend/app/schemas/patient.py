from datetime import datetime
from pydantic import BaseModel
from .prediction import ClinicalFeatures


class PatientCreate(BaseModel):
    mrn: str
    full_name: str
    race: str | None = None
    gender: str | None = None
    age_bracket: str | None = None
    attending_doctor_id: str | None = None
    clinical_features: ClinicalFeatures


class PatientUpdate(BaseModel):
    full_name: str | None = None
    attending_doctor_id: str | None = None
    clinical_features: ClinicalFeatures | None = None


class RiskAssessmentOut(BaseModel):
    id: str
    readmission_probability: float
    risk_category: str
    recommendations: list[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PatientOut(BaseModel):
    id: str
    mrn: str
    full_name: str
    race: str | None
    gender: str | None
    age_bracket: str | None
    attending_doctor_id: str | None
    clinical_features: dict
    admitted_at: datetime
    created_at: datetime
    latest_risk: RiskAssessmentOut | None = None

    class Config:
        from_attributes = True
