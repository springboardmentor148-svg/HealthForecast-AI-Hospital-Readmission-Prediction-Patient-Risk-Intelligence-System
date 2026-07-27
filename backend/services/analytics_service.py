"""Business logic for deeper analytics: trends, distributions, and breakdowns."""
from collections import defaultdict

from sqlalchemy.orm import Session

from repositories.patient_repository import PatientRepository
from repositories.prediction_repository import PredictionRepository
from schemas.dashboard import (
    AgeDistributionPoint,
    MonthlyAnalyticsPoint,
    TrendPoint,
)
from utils.helpers import bucket_age


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.patients = PatientRepository(db)
        self.predictions = PredictionRepository(db)

    def get_age_distribution(self) -> list[AgeDistributionPoint]:
        pairs = self.patients.age_distribution()
        buckets: dict[str, int] = defaultdict(int)
        for age, _ in pairs:
            buckets[bucket_age(age)] += 1
        return [
            AgeDistributionPoint(age_group=k, count=v)
            for k, v in sorted(buckets.items())
        ]

    def get_monthly_analytics(self) -> list[MonthlyAnalyticsPoint]:
        rows = self.predictions.monthly_counts()
        return [
            MonthlyAnalyticsPoint(
                month=row.month,
                total_predictions=row.total,
                high_risk_count=0,  # refined breakdown available via risk_distribution()
                average_probability=round(float(row.avg_probability or 0), 4),
            )
            for row in rows
        ]

    def get_readmission_distribution(self) -> list[TrendPoint]:
        rows = self.predictions.risk_distribution()
        return [TrendPoint(label=str(category), value=count) for category, count in rows]

    def get_patient_trends(self) -> list[TrendPoint]:
        """Simple trend: patient count contributes to overall volume trend."""
        total = self.patients.count_all()
        return [TrendPoint(label="total_patients", value=float(total))]
