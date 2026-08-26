from __future__ import annotations

from ..extensions import db
from .enums import TreatmentEffectivenessLevel
from .mixins import TimestampMixin


class TreatmentEffectiveness(TimestampMixin, db.Model):
    __tablename__ = "treatment_effectiveness"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("patients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    treatment_name = db.Column(db.String(150), nullable=False)
    treatment_type = db.Column(db.String(100), nullable=True, index=True)
    start_date = db.Column(db.Date, nullable=False, index=True)
    end_date = db.Column(db.Date, nullable=True, index=True)
    outcome_score = db.Column(db.Numeric(5, 2), nullable=True)
    effectiveness_level = db.Column(
        db.Enum(
            TreatmentEffectivenessLevel,
            name="treatment_effectiveness_level",
            native_enum=False,
            validate_strings=True,
        ),
        nullable=True,
    )
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="active")
    approved_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    source = db.Column(db.String(50), nullable=True)

    # AI Forecast columns
    predicted_treatment_effectiveness = db.Column(db.Numeric(5, 2), nullable=True)
    predicted_recovery_days = db.Column(db.Numeric(5, 2), nullable=True)
    expected_response_category = db.Column(
        db.Enum(
            TreatmentEffectivenessLevel,
            name="expected_response_category_enum",
            native_enum=False,
            validate_strings=True,
        ),
        nullable=True,
    )
    treatment_confidence = db.Column(db.Numeric(5, 2), nullable=True)
    forecast_generated_at = db.Column(db.DateTime(timezone=True), nullable=True)

    patient = db.relationship(
        "Patient",
        back_populates="treatment_effectiveness",
        lazy="joined",
    )
    approver = db.relationship(
        "User",
        foreign_keys=[approved_by],
        lazy="joined",
    )

    __table_args__ = (
        db.CheckConstraint(
            "outcome_score >= 0 AND outcome_score <= 100",
            name="ck_treatment_effectiveness_outcome_score_range",
        ),
        db.CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="ck_treatment_effectiveness_date_order",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"TreatmentEffectiveness(id={self.id!r}, patient_id={self.patient_id!r}, "
            f"treatment_name={self.treatment_name!r}, outcome_score={self.outcome_score!r})"
        )
