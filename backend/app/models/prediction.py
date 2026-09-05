from beanie import Document
from typing import Optional, Dict, Any
from datetime import datetime

class Prediction(Document):
    patient_id: str
    risk_score: float
    readmission_probability: float
    risk_category: str
    predicted_readmission: bool
    model_version: str = "1.0.0"
    feature_values: Dict[str, Any]
    created_at: datetime = datetime.utcnow()
    doctor_id: Optional[str] = None
    
    class Settings:
        name = "predictions"