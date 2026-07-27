"""
Data-access layer for the AuditLog entity.

Not part of the originally listed repositories but required to persist
audit trail entries (login attempts, CRUD actions, predictions, etc.)
without putting raw SQL in the service layer.
"""
from sqlalchemy.orm import Session

from models.audit import AuditLog


class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, audit_log: AuditLog) -> AuditLog:
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)
        return audit_log

    def list_logs(self, page: int, page_size: int):
        query = self.db.query(AuditLog).order_by(AuditLog.timestamp.desc())
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return items, total
