from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime  # Add this import

class PatientCreate(BaseModel):
    patient_id: str
    name: str
    age: int
    gender: str
    race: Optional[str] = None
    contact: Dict[str, Any]
    medications: List[str] = []

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    race: Optional[str] = None
    contact: Optional[Dict[str, Any]] = None
    medications: Optional[List[str]] = None

class PatientResponse(BaseModel):
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
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True