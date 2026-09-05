from beanie import Document
from datetime import datetime
from typing import Optional

class AuditLog(Document):
    user_id: str
    action: str
    resource: str
    details: dict
    ip_address: Optional[str] = None
    timestamp: datetime = datetime.utcnow()
    
    class Settings:
        name = "audit_logs"