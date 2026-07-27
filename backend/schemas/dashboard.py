"""Dashboard & analytics response schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_patients: int
    total_predictions: int
    high_risk_patients: int
    average_risk_score: float
    readmission_rate: float
    recovery_rate: float


class RecentPrediction(BaseModel):
    patient_id: str
    patient_name: str
    risk_category: str
    probability: float
    created_at: datetime


class ReadmissionStats(BaseModel):
    total: int
    readmitted: int
    not_readmitted: int
    readmission_rate: float


class MonthlyAnalyticsPoint(BaseModel):
    month: str
    total_predictions: int
    high_risk_count: int
    average_probability: float


class DepartmentAnalyticsPoint(BaseModel):
    department: Optional[str]
    total_patients: int
    high_risk_count: int


class HospitalOverview(BaseModel):
    hospital_name: Optional[str]
    total_patients: int
    total_doctors: int
    high_risk_patients: int


class AgeDistributionPoint(BaseModel):
    age_group: str
    count: int


class TrendPoint(BaseModel):
    label: str
    value: float


class MedicationAnalysisPoint(BaseModel):
    medication: str
    count: int
    average_risk: float
