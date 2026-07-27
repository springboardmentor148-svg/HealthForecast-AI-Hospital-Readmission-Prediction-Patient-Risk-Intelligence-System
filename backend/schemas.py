# ==========================================
# schemas.py — request/response shapes for auth + history
# (the PatientEncounter / PredictionResponse schemas for
# /predict itself stay in main.py, unchanged)
# ==========================================

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    # NOTE: in a real deployment this token would be emailed to the user,
    # not returned in the API response. No email service is configured
    # for this project, so the token is returned directly for local
    # testing — see README for the honest tradeoff this represents.
    reset_token: str
    expires_in_minutes: int


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ContributingFactor(BaseModel):
    feature: str
    impact: float  # positive = pushes risk up, negative = pushes risk down


class PredictionHistoryItem(BaseModel):
    id: int
    probability: float
    risk_band: str
    threshold_used: float
    created_at: datetime
    input_payload: dict

    class Config:
        from_attributes = True


class AdminPredictionItem(PredictionHistoryItem):
    user_email: EmailStr
    user_full_name: Optional[str] = None
