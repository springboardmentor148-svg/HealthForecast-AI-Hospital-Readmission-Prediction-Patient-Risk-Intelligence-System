from beanie import Document
from typing import Optional
from datetime import datetime

class Notification(Document):
    user_id: str
    title: str
    message: str
    type: str  # "alert", "info", "warning"
    read: bool = False
    created_at: datetime = datetime.utcnow()
    
    class Settings:
        name = "notifications"