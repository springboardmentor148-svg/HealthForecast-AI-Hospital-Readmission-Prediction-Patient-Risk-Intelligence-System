import datetime

from sqlalchemy import Date, Float, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    medical_record_number: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    age: Mapped[str] = mapped_column(Text, nullable=False)
    gender: Mapped[str] = mapped_column(Text, nullable=False)
    race: Mapped[str] = mapped_column(Text, nullable=False)
    admission_type: Mapped[str] = mapped_column(Text, nullable=False)
    discharge_disposition: Mapped[str] = mapped_column(Text, nullable=False)
    admission_source: Mapped[str] = mapped_column(Text, nullable=False)
    time_in_hospital: Mapped[int] = mapped_column(Integer, nullable=False)
    num_lab_procedures: Mapped[int] = mapped_column(Integer, nullable=False)
    num_procedures: Mapped[int] = mapped_column(Integer, nullable=False)
    num_medications: Mapped[int] = mapped_column(Integer, nullable=False)
    num_outpatient_visits: Mapped[int] = mapped_column(Integer, nullable=False)
    num_inpatient_visits: Mapped[int] = mapped_column(Integer, nullable=False)
    num_emergency_visits: Mapped[int] = mapped_column(Integer, nullable=False)
    primary_diagnosis: Mapped[str] = mapped_column(Text, nullable=False)
    secondary_diagnosis1: Mapped[str | None] = mapped_column(Text, nullable=True)
    secondary_diagnosis2: Mapped[str | None] = mapped_column(Text, nullable=True)
    glucose_test: Mapped[str] = mapped_column(Text, nullable=False)
    a1c_result: Mapped[str] = mapped_column(Text, nullable=False)
    medications: Mapped[dict] = mapped_column(JSONB, nullable=False)
    department: Mapped[str] = mapped_column(Text, nullable=False)
    assigned_doctor: Mapped[str] = mapped_column(Text, nullable=False)
    assigned_doctor_id: Mapped[str] = mapped_column(Text, nullable=False)
    admission_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    discharge_date: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_tier: Mapped[str] = mapped_column(Text, nullable=False)
    readmission_likelihood: Mapped[str] = mapped_column(Text, nullable=False)
    readmission_probability: Mapped[float] = mapped_column(Float, nullable=False)
    risk_factors: Mapped[list] = mapped_column(JSONB, nullable=False)
    care_recommendations: Mapped[list] = mapped_column(JSONB, nullable=False)
    discharge_readiness_score: Mapped[float] = mapped_column(Float, nullable=False)
    last_assessment_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    timestamp: Mapped[str] = mapped_column(Text, nullable=False)
    user_email: Mapped[str] = mapped_column(Text, nullable=False)
    user_name: Mapped[str] = mapped_column(Text, nullable=False)
    user_role: Mapped[str] = mapped_column(Text, nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    target_patient_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    details: Mapped[str] = mapped_column(Text, nullable=False)
