"""Data-access layer for the Prediction entity."""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.patient import Patient
from models.prediction import Prediction
from utils.constants import RiskCategory


class PredictionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, prediction: Prediction) -> Prediction:
        self.db.add(prediction)
        self.db.commit()
        self.db.refresh(prediction)
        return prediction

    def get_by_id(self, prediction_id: uuid.UUID) -> Optional[Prediction]:
        return self.db.get(Prediction, prediction_id)

    def list_for_patient(self, patient_id: uuid.UUID, page: int, page_size: int):
        query = self.db.query(Prediction).filter(Prediction.patient_id == patient_id)
        total = query.count()
        items = (
            query.order_by(Prediction.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def list_recent(self, limit: int = 10):
        return (
            self.db.query(Prediction, Patient)
            .join(Patient, Prediction.patient_id == Patient.id)
            .order_by(Prediction.created_at.desc())
            .limit(limit)
            .all()
        )

    def count_all(self) -> int:
        return self.db.query(Prediction).count()

    def count_high_risk(self) -> int:
        return (
            self.db.query(Prediction)
            .filter(Prediction.risk_category.in_([RiskCategory.HIGH, RiskCategory.CRITICAL]))
            .count()
        )

    def average_probability(self) -> float:
        avg = self.db.query(func.avg(Prediction.probability)).scalar()
        return float(avg) if avg is not None else 0.0

    def monthly_counts(self, months_back: int = 6):
        """Group predictions by year-month for the last N months.

        Uses strftime() for SQLite (local dev) and to_char() for PostgreSQL
        (Docker/production) — auto-detected from the engine URL.
        """
        from core.database import engine

        if engine.dialect.name == "sqlite":
            month_expr = func.strftime("%Y-%m", Prediction.created_at).label("month")
        else:
            month_expr = func.to_char(Prediction.created_at, "YYYY-MM").label("month")

        return (
            self.db.query(
                month_expr,
                func.count(Prediction.id).label("total"),
                func.avg(Prediction.probability).label("avg_probability"),
            )
            .group_by("month")
            .order_by("month")
            .all()
        )

    def risk_distribution(self):
        return (
            self.db.query(Prediction.risk_category, func.count(Prediction.id))
            .group_by(Prediction.risk_category)
            .all()
        )
