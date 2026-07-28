from beanie import Document
from pydantic import EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    DOCTOR = "doctor"
    ADMIN = "hospital_admin"
    RESEARCHER = "researcher"
    SYSTEM_ADMIN = "system_admin"

class User(Document):
    username: str
    email: EmailStr
    hashed_password: str
    full_name: str
    role: UserRole
    hospital_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = datetime.utcnow()
    last_login: Optional[datetime] = None
    
    class Settings:
        name = "users"