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
    treatments = relationship("TreatmentRecord", back_populates="patient")
    care_plans = relationship("CarePlan", back_populates="patient")


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


# --------------------------------------------------------------------------
# Treatment Effectiveness Module
# --------------------------------------------------------------------------
class TreatmentRecord(Base):
    __tablename__ = "treatment_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    treatment_name = Column(String, nullable=False)
    medication = Column(String, default="")
    outcome = Column(String, default="Ongoing")   # Improved / No Change / Worsened / Ongoing
    recovery_score = Column(Float, default=0.0)   # 0-100 clinician-assessed recovery
    notes = Column(String, default="")
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="treatments")


# --------------------------------------------------------------------------
# Clinical Decision Support Module — saved care plans (follow-up / discharge)
# --------------------------------------------------------------------------
class CarePlan(Base):
    __tablename__ = "care_plans"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    follow_up_date = Column(DateTime, nullable=True)
    discharge_instructions = Column(String, default="")
    risk_mitigation_steps = Column(JSON, default=list)
    status = Column(String, default="Active")  # Active / Completed / Cancelled
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="care_plans")


# --------------------------------------------------------------------------
# Audit logging (System Administrator module)
# --------------------------------------------------------------------------
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String, default="")
    actor_role = Column(String, default="")
    action = Column(String, nullable=False)
    target = Column(String, default="")
    detail = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


# --------------------------------------------------------------------------
# Notifications / Alerts
# --------------------------------------------------------------------------
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # targeted user
    role = Column(String, nullable=True)                              # or broadcast to a role
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(String, default="")
    severity = Column(String, default="info")  # info / warning / critical
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# --------------------------------------------------------------------------
# AI Model Management — lightweight run log (real training happens via
# model/train_model.py; this records who requested it and its status)
# --------------------------------------------------------------------------
class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, index=True)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="queued")  # queued / running / completed / failed
    notes = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
