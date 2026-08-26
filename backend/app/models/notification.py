from __future__ import annotations

from ..extensions import db
from .mixins import utcnow


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, index=True)
    read_status = db.Column(db.Boolean, default=False, nullable=False)
    related_entity = db.Column(db.String(100), nullable=True)
    related_entity_id = db.Column(db.String(64), nullable=True)
    recipient_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    recipient = db.relationship(
        "User",
        backref=db.backref("notifications", cascade="all, delete-orphan"),
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"Notification(id={self.id!r}, title={self.title!r}, type={self.notification_type!r}, read={self.read_status!r})"
