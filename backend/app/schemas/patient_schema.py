from pydantic import BaseModel
from typing import Optional


# Patient Create Schema
class PatientCreate(BaseModel):
    patient_name: str
    age: int
    gender: str
    diagnosis: str
    glucose_level: float
    blood_pressure: str
    bmi: float
    insulin: float
    diabetes_med: str


# Patient Update Schema
class PatientUpdate(BaseModel):
    patient_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    diagnosis: Optional[str] = None
    glucose_level: Optional[float] = None
    blood_pressure: Optional[str] = None
    bmi: Optional[float] = None
    insulin: Optional[float] = None
    diabetes_med: Optional[str] = None


# Patient Response Schema
class PatientResponse(BaseModel):
    patient_name: str
    age: int
    gender: str
    diagnosis: str
    glucose_level: float
    blood_pressure: str
    bmi: float
    insulin: float
    diabetes_med: str