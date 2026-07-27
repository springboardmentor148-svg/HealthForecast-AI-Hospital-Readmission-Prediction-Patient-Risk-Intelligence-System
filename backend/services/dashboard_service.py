"""Business logic for dashboard summary/overview endpoints."""
from sqlalchemy.orm import Session

from repositories.patient_repository import PatientRepository
from repositories.prediction_repository import PredictionRepository
from repositories.user_repository import UserRepository
from schemas.dashboard import (
    DashboardSummary,
    HospitalOverview,
    ReadmissionStats,
    RecentPrediction,
)
from utils.constants import RiskCategory


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.patients = PatientRepository(db)
        self.predictions = PredictionRepository(db)
        self.users = UserRepository(db)

    def get_summary(self) -> DashboardSummary:
        total_patients = self.patients.count_all()
        total_predictions = self.predictions.count_all()
        high_risk = self.predictions.count_high_risk()
        avg_probability = self.predictions.average_probability()

        readmission_rate = (high_risk / total_predictions * 100) if total_predictions else 0.0
        recovery_rate = 100 - readmission_rate if total_predictions else 0.0

        return DashboardSummary(
            total_patients=total_patients,
            total_predictions=total_predictions,
            high_risk_patients=high_risk,
            average_risk_score=round(avg_probability, 4),
            readmission_rate=round(readmission_rate, 2),
            recovery_rate=round(recovery_rate, 2),
        )

    def get_recent_predictions(self, limit: int = 10) -> list[RecentPrediction]:
        rows = self.predictions.list_recent(limit)
        return [
            RecentPrediction(
                patient_id=str(patient.id),
                patient_name=patient.patient_name,
                risk_category=prediction.risk_category,
                probability=prediction.probability,
                created_at=prediction.created_at,
            )
            for prediction, patient in rows
        ]

    def get_readmission_stats(self) -> ReadmissionStats:
        total = self.predictions.count_all()
        readmitted = self.predictions.count_high_risk()
        not_readmitted = total - readmitted
        rate = (readmitted / total * 100) if total else 0.0
        return ReadmissionStats(
            total=total, readmitted=readmitted, not_readmitted=not_readmitted,
            readmission_rate=round(rate, 2),
        )

    def get_hospital_overview(self, hospital_name: str | None) -> HospitalOverview:
        total_patients = self.patients.count_all()
        total_doctors = self.users.count_by_role("doctor")
        high_risk = self.predictions.count_high_risk()
        return HospitalOverview(
            hospital_name=hospital_name,
            total_patients=total_patients,
            total_doctors=total_doctors,
            high_risk_patients=high_risk,
        )
