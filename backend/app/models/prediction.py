from __future__ import annotations

from ..extensions import db
from .enums import PredictionType, RiskBand
from .mixins import TimestampMixin, utcnow


class Prediction(TimestampMixin, db.Model):
    __tablename__ = "predictions"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    prediction_type = db.Column(
        db.Enum(
            PredictionType,
            name="prediction_type",
            native_enum=False,
            validate_strings=True,
        ),
        nullable=False,
        default=PredictionType.binary,
    )
    model_name = db.Column(db.String(150), nullable=False)
    model_version = db.Column(db.String(50), nullable=True)
    predicted_risk_band = db.Column(
        db.Enum(RiskBand, name="predicted_risk_band", native_enum=False, validate_strings=True),
        nullable=False,
        default=RiskBand.low,
    )
    predicted_readmission_probability = db.Column(
        db.Numeric(5, 2),
        nullable=False,
        default=0,
    )
    predicted_label = db.Column(db.String(64), nullable=True)
    threshold = db.Column(db.Numeric(4, 2), nullable=True)
    features_snapshot = db.Column(db.JSON, nullable=False, default=dict)
    explanation = db.Column(db.Text, nullable=True)
    actual_readmitted = db.Column(db.Boolean, nullable=True)
    predicted_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        index=True,
        default=utcnow,
    )

    patient = db.relationship(
        "Patient",
        back_populates="predictions",
        lazy="joined",
    )
    history_records = db.relationship(
        "PredictionHistory",
        back_populates="prediction",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    created_by = db.relationship(
        "User",
        back_populates="created_predictions",
        foreign_keys=[created_by_id],
        lazy="joined",
    )

    __table_args__ = (
        db.CheckConstraint(
            "predicted_readmission_probability >= 0 AND predicted_readmission_probability <= 100",
            name="ck_predictions_probability_range",
        ),
        db.CheckConstraint(
            "threshold IS NULL OR (threshold >= 0 AND threshold <= 1)",
            name="ck_predictions_threshold_range",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"Prediction(id={self.id!r}, patient_id={self.patient_id!r}, "
            f"predicted_readmission_probability={self.predicted_readmission_probability!r})"
        )
