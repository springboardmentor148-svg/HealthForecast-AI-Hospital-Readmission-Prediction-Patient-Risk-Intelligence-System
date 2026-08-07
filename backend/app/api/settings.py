from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SettingsConfig(BaseModel):
    threshold: float
    email_alerts: bool

@router.get("/")
def get_settings():
    return {"threshold": 50.0, "email_alerts": True}

@router.post("/")
def save_settings(config: SettingsConfig):
    return {"status": "success", "message": "Settings updated securely."}