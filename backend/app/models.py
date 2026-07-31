from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(40), index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_nbr: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    race: Mapped[str | None] = mapped_column(String(60), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(30), nullable=True)
    age: Mapped[str | None] = mapped_column(String(30), nullable=True)
    encounters: Mapped[list["Encounter"]] = relationship(back_populates="patient")


class Encounter(Base):
    __tablename__ = "encounters"

    id: Mapped[int] = mapped_column(primary_key=True)
    encounter_id: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    readmitted: Mapped[str] = mapped_column(String(10), index=True)
    time_in_hospital: Mapped[int] = mapped_column(Integer, default=0)
    age: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)
    race: Mapped[str | None] = mapped_column(String(60), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(30), nullable=True)
    admission_type_id: Mapped[str | None] = mapped_column(String(20), nullable=True)
    medical_specialty: Mapped[str | None] = mapped_column(String(120), nullable=True)
    a1c_result: Mapped[str | None] = mapped_column(String(30), nullable=True)
    medication_change: Mapped[str | None] = mapped_column(String(10), nullable=True)
    diabetes_med: Mapped[str | None] = mapped_column(String(10), nullable=True)
    insulin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    number_inpatient: Mapped[int] = mapped_column(Integer, default=0)
    number_emergency: Mapped[int] = mapped_column(Integer, default=0)
    num_medications: Mapped[int] = mapped_column(Integer, default=0)
    payload: Mapped[dict] = mapped_column(JSON)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)
    risk_category: Mapped[str | None] = mapped_column(String(20), nullable=True)
    patient: Mapped[Patient] = relationship(back_populates="encounters")


class DoctorPatientAssignment(Base):
    __tablename__ = "doctor_patient_assignments"
    __table_args__ = (UniqueConstraint("doctor_id", "patient_id", name="uq_doctor_patient"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)


class CarePlan(Base):
    __tablename__ = "care_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    recommendation: Mapped[str] = mapped_column(Text)
    follow_up_status: Mapped[str] = mapped_column(String(40), default="Planned")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    metrics: Mapped[dict] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
