import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Enum
)
from sqlalchemy.orm import relationship

from ..core.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class Role(str, enum.Enum):
    doctor = "doctor"
    hospital_administrator = "hospital_administrator"
    healthcare_researcher = "healthcare_researcher"
    system_admin = "system_admin"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default=Role.doctor.value)
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patients = relationship("Patient", back_populates="attending_doctor")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=gen_uuid)
    mrn = Column(String, unique=True, index=True, nullable=False)  # medical record number
    full_name = Column(String, nullable=False)
    race = Column(String)
    gender = Column(String)
    age_bracket = Column(String)

    attending_doctor_id = Column(String, ForeignKey("users.id"), nullable=True)
    attending_doctor = relationship("User", back_populates="patients")

    # Raw clinical/encounter features consumed by the ML model, stored as JSON
    # so the schema stays flexible as the model evolves.
    clinical_features = Column(JSON, nullable=False, default=dict)

    admitted_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    risk_assessments = relationship(
        "RiskAssessment", back_populates="patient", cascade="all, delete-orphan"
    )


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String, primary_key=True, default=gen_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    patient = relationship("Patient", back_populates="risk_assessments")

    readmission_probability = Column(Float, nullable=False)
    risk_category = Column(String, nullable=False)  # Low / Medium / High / Critical
    model_version = Column(String, default="catboost-v1")
    input_snapshot = Column(JSON, nullable=False, default=dict)
    recommendations = Column(JSON, nullable=False, default=list)

    created_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    username = Column(String, nullable=True)
    action = Column(String, nullable=False)
    detail = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
