from models import AuditLog
from sqlalchemy.orm import Session

def log_action(db: Session, actor, action: str, category: str, target: str = None, details: str = None):
    entry = AuditLog(
        actor_id=actor.id,
        actor_name=actor.full_name,
        action=action,
        category=category,
        target=target,
        details=details
    )
    db.add(entry)
    db.commit()