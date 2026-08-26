from __future__ import annotations

from ..extensions import db
from .mixins import TimestampMixin


class ClinicalSupportPlan(TimestampMixin, db.Model):
    __tablename__ = "clinical_support_plans"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    approved_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    approved_at = db.Column(db.DateTime(timezone=True), nullable=True)
    is_approved = db.Column(db.Boolean, nullable=False, default=False)
    draft_notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="draft")
    treatment_name = db.Column(db.String(150), nullable=True)
    updated_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    patient = db.relationship(
        "Patient",
        backref=db.backref("clinical_support_plan", uselist=False, cascade="all, delete-orphan"),
        lazy="joined",
    )
    approver = db.relationship(
        "User",
        foreign_keys=[approved_by],
        lazy="joined",
    )
    updater = db.relationship(
        "User",
        foreign_keys=[updated_by],
        lazy="joined",
    )

    def __repr__(self) -> str:
        return (
            f"ClinicalSupportPlan(id={self.id!r}, patient_id={self.patient_id!r}, "
            f"is_approved={self.is_approved!r})"
        )
