
from pydantic import BaseModel, Field
from typing import Optional


# ============================================================
# PREDICTION REQUEST
# ============================================================

class PredictionRequest(BaseModel):

    patient_id: int

    age: int = Field(
        ...,
        ge=1,
        le=120
    )

    gender: str

    race: str

    medical_history: str = ""

    admission_history: str = ""


# ============================================================
# PREDICTION RESPONSE
# ============================================================

class PredictionResponse(BaseModel):

    success: bool

    patient_id: int

    prediction: int

    risk_level: str

    probability: Optional[float] = None

    message: str

