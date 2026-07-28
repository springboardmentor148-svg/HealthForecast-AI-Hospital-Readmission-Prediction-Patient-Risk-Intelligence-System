from beanie import Document
from typing import Optional, List, Dict, Any
from datetime import datetime

class Patient(Document):
    patient_id: str
    name: str
    age: int
    gender: str
    race: Optional[str] = None
    contact: Dict[str, Any]
    medications: List[str] = []
    risk_score: Optional[float] = None
    risk_category: Optional[str] = None
    last_admission: Optional[datetime] = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
    
    class Settings:
        name = "patients"