from __future__ import annotations

from sqlalchemy import event

from ..extensions import db
from .enums import PredictionType, RiskBand
from .mixins import utcnow


class PredictionHistory(db.Model):
    __tablename__ = "prediction_history"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("patients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    prediction_id = db.Column(
        db.Integer,
        db.ForeignKey("predictions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    risk_score = db.Column(db.Numeric(5, 2), nullable=False)
    risk_class = db.Column(
        db.Enum(RiskBand, name="prediction_history_risk_class", native_enum=False, validate_strings=True),
        nullable=False,
    )
    confidence = db.Column(db.Numeric(5, 2), nullable=False)
    threshold_used = db.Column(db.Numeric(4, 2), nullable=True)
    model_version = db.Column(db.String(50), nullable=False)
    prediction_type = db.Column(
        db.Enum(
            PredictionType,
            name="prediction_history_prediction_type",
            native_enum=False,
            validate_strings=True,
        ),
        nullable=False,
    )
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, index=True)

    patient = db.relationship(
        "Patient",
        back_populates="prediction_history",
        lazy="joined",
    )
    prediction = db.relationship(
        "Prediction",
        back_populates="history_records",
        lazy="joined",
    )

    __table_args__ = (
        db.CheckConstraint("risk_score >= 0 AND risk_score <= 100", name="ck_prediction_history_risk_score_range"),
        db.CheckConstraint("confidence >= 0 AND confidence <= 100", name="ck_prediction_history_confidence_range"),
        db.CheckConstraint(
            "threshold_used IS NULL OR (threshold_used >= 0 AND threshold_used <= 1)",
            name="ck_prediction_history_threshold_range",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"PredictionHistory(id={self.id!r}, patient_id={self.patient_id!r}, "
            f"prediction_id={self.prediction_id!r}, risk_score={self.risk_score!r})"
        )


@event.listens_for(PredictionHistory, "before_update", propagate=True)
def _prevent_prediction_history_update(mapper, connection, target):
    raise ValueError("PredictionHistory records are append-only and cannot be updated.")


@event.listens_for(PredictionHistory, "before_delete", propagate=True)
def _prevent_prediction_history_delete(mapper, connection, target):
    raise ValueError("PredictionHistory records are append-only and cannot be deleted.")
