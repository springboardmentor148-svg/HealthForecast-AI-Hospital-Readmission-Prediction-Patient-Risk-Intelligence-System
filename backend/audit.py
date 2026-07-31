from sqlalchemy.orm import Session
from models import AuditLog


def create_log(
    db: Session,
    user_id: int,
    action: str
):

    log = AuditLog(
        user_id=user_id,
        action=action
    )

    db.add(log)
    db.commit()