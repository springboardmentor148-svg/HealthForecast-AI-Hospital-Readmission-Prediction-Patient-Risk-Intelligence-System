from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    mobile_number = Column(String, nullable=False)

    hospital_name = Column(String, nullable=False)
    hospital_type = Column(String, nullable=False)
    ownership_type = Column(String, nullable=False)
    hospital_contact = Column(String, nullable=False)
    hospital_address = Column(String, nullable=False)

    department = Column(String, nullable=True)
    user_role = Column(String, nullable=False)

    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    patient_name = Column(String, nullable=True)
    prediction = Column(Integer, nullable=False)       # 0 ya 1
    result = Column(String, nullable=False)             # "No Readmission" / "Readmission"
    confidence = Column(String, nullable=False)          # e.g. "53.47%"
    risk_level = Column(String, nullable=False)          # "Low" / "High"
    message = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    condition = Column(String, nullable=False)

    admission_date = Column(String, nullable=True)
    discharge_date = Column(String, nullable=True)
    last_visit = Column(String, nullable=True)

    risk_level = Column(String, nullable=False)
    readmission_probability = Column(String, nullable=True)
    confidence = Column(String, nullable=True)

    medical_history = Column(Text, nullable=True)

    # Naye fields — personal aur clinical details
    contact_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_number = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    admitting_department = Column(String, nullable=True)
    allergies = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Treatment(Base):
    __tablename__ = "treatments"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    treatment_plan = Column(String, nullable=False)      # e.g. "Metformin + Insulin Therapy"
    start_date = Column(String, nullable=True)             # e.g. "10 Jun 2026"
    effectiveness = Column(String, nullable=False)         # "Good" / "Moderate" / "Poor"
    recovery_trend = Column(String, nullable=False)        # "Improving" / "Stable" / "Declining"
    adherence = Column(String, nullable=True)               # e.g. "92%"

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CareRecommendation(Base):
    __tablename__ = "care_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, unique=True)

    recommendation = Column(Text, nullable=True)
    follow_up = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Not Generated")  # Not Generated / Pending / Reviewed

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    hospital_name = Column(String, nullable=False)
    name = Column(String, nullable=False)
    head_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    records = Column(Integer, nullable=False, default=0)
    size_bytes = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="Processing")  # Active / Processing / Archived
    notes = Column(String, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String, nullable=False)
    trained_on = Column(String, nullable=True)
    accuracy = Column(Float, nullable=False, default=0.0)
    precision = Column(Float, nullable=False, default=0.0)
    recall = Column(Float, nullable=False, default=0.0)
    roc_auc = Column(Float, nullable=False, default=0.0)
    status = Column(String, nullable=False, default="Archived")  # Deployed / Archived
    trained_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)  # JSON-encoded string

    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key = Column(String, nullable=False)
    value = Column(Text, nullable=False)  # JSON-encoded string

    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False)
    permission = Column(String, nullable=False)
    allowed = Column(Boolean, nullable=False, default=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    actor_name = Column(String, nullable=False)   # jisne action kiya uska naam (snapshot)
    action = Column(String, nullable=False)        # e.g. "USER_ACTIVATED", "ROLE_CHANGED"
    category = Column(String, nullable=False)      # e.g. "User Management", "Dataset", "Model"
    target = Column(String, nullable=True)          # jis cheez/user pe action hua uska naam
    details = Column(String, nullable=True)          # extra context (optional)
    timestamp = Column(DateTime, default=datetime.utcnow)


class ExportLog(Base):
    __tablename__ = "export_logs"

    id = Column(Integer, primary_key=True, index=True)
    researcher_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    dataset_key = Column(String, nullable=False)    # e.g. "population-demographics"
    dataset_name = Column(String, nullable=False)   # display name
    format = Column(String, nullable=False)          # "csv"
    record_count = Column(Integer, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    hospital_name = Column(String, nullable=False, index=True)

    title = Column(String, nullable=False)
    type = Column(String, nullable=False)          # "Performance" / "Readmission" / "Outcomes" / "Operations" / "Risk"
    period = Column(String, nullable=False)
    generated_by = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Ready")  # "Ready" / "Generating"
    content = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())