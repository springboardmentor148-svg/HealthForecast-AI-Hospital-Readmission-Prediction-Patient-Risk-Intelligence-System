from __future__ import annotations

from sqlalchemy import event

from ..extensions import db
from .mixins import utcnow


class ActivityLog(db.Model):
    __tablename__ = "activity_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action = db.Column(db.String(100), nullable=False, index=True)
    target_type = db.Column(db.String(100), nullable=False, index=True)
    target_id = db.Column(db.String(64), nullable=False, index=True)
    metadata_json = db.Column("metadata", db.JSON, nullable=False, default=dict)
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, index=True)

    user = db.relationship(
        "User",
        back_populates="activity_logs",
        lazy="joined",
    )

    __table_args__ = (
        db.Index("ix_activity_logs_target_lookup", "target_type", "target_id"),
    )

    def __repr__(self) -> str:
        return (
            f"ActivityLog(id={self.id!r}, user_id={self.user_id!r}, action={self.action!r}, "
            f"target_type={self.target_type!r}, target_id={self.target_id!r})"
        )


@event.listens_for(ActivityLog, "before_update", propagate=True)
def _prevent_activity_log_update(mapper, connection, target):
    raise ValueError("ActivityLog records are immutable and cannot be updated.")


@event.listens_for(ActivityLog, "before_delete", propagate=True)
def _prevent_activity_log_delete(mapper, connection, target):
    raise ValueError("ActivityLog records are immutable and cannot be deleted.")
