from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    name: str
    role: str
    is_active: bool


class PatientOut(BaseModel):
    id: int
    patient_nbr: str | None = None
    race: str | None
    gender: str | None
    age: str | None
    encounter_count: int = 0
    latest_risk_score: float | None = None
    latest_risk_category: str | None = None


class EncounterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    encounter_id: str
    readmitted: str
    time_in_hospital: int
    age: str | None
    admission_type_id: str | None
    medical_specialty: str | None
    a1c_result: str | None
    medication_change: str | None
    diabetes_med: str | None
    insulin: str | None
    number_inpatient: int
    number_emergency: int
    num_medications: int
    risk_score: float | None
    risk_category: str | None


class PatientDetail(PatientOut):
    encounters: list[EncounterOut]


class CarePlanCreate(BaseModel):
    recommendation: str = Field(min_length=3, max_length=2000)
    follow_up_status: str = Field(default="Planned", max_length=40)
    notes: str | None = Field(default=None, max_length=2000)


class CarePlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    patient_id: int
    created_by: int
    recommendation: str
    follow_up_status: str
    notes: str | None
    created_at: datetime


class PredictionOut(BaseModel):
    encounter_id: str
    probability: float
    risk_category: str
    risk_signals: list[str]
    model: str


class UserCreate(BaseModel):
    email: str
    name: str = Field(min_length=2, max_length=120)
    role: str
    password: str = Field(min_length=8, max_length=100)


class AssignmentCreate(BaseModel):
    doctor_id: int
    patient_id: int
