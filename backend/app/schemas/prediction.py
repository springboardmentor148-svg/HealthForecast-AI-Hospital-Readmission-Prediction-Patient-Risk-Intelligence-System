from pydantic import BaseModel
from typing import Optional

class PredictionRequest(BaseModel):
    patient_id: int

class PredictionResponse(BaseModel):
    patient_id: int
    risk_score: float
    risk_category: str
    readmission_probability: float
    prediction: bool
    
class ReadmissionForecast(PredictionResponse):
    follow_up_days: int
    recommendations: list[str]