import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from database import Base


class RoleEnum(str, enum.Enum):
    doctor = "doctor"
    hospital_admin = "hospital_admin"
    researcher = "researcher"
    system_admin = "system_admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patients = relationship("Patient", back_populates="assigned_doctor")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    mrn = Column(String, unique=True, index=True)  # medical record number
    full_name = Column(String, nullable=False)
    age_bracket = Column(String)
    gender = Column(String)
    race = Column(String)

    # Clinical / encounter fields mirroring the model's feature schema
    admission_type_id = Column(Integer, default=1)
    discharge_disposition_id = Column(Integer, default=1)
    admission_source_id = Column(Integer, default=1)
    time_in_hospital = Column(Integer, default=1)
    payer_code = Column(String, default="Missing")
    medical_specialty = Column(String, default="Missing")
    num_lab_procedures = Column(Integer, default=0)
    num_procedures = Column(Integer, default=0)
    num_medications = Column(Integer, default=0)
    number_outpatient = Column(Integer, default=0)
    number_emergency = Column(Integer, default=0)
    number_inpatient = Column(Integer, default=0)
    number_diagnoses = Column(Integer, default=1)
    diag_1 = Column(String, default="Missing")
    diag_2 = Column(String, default="Missing")
    diag_3 = Column(String, default="Missing")
    max_glu_serum = Column(String, default="None")
    A1Cresult = Column(String, default="None")
    change = Column(String, default="No")
    diabetesMed = Column(String, default="No")
    medications_json = Column(JSON, default=dict)  # {"metformin":"Steady", ...}

    assigned_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_doctor = relationship("User", back_populates="patients")

    created_at = Column(DateTime, default=datetime.utcnow)

    predictions = relationship("PredictionLog", back_populates="patient")


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    risk_score = Column(Float)          # probability 0-1
    risk_category = Column(String)      # Low / Medium / High
    top_factors = Column(JSON, default=list)
    care_recommendations = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="predictions")
