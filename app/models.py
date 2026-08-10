from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # "doctor", "hospital_admin", "researcher", "system_admin"


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    message = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class PatientAdmission(Base):
    __tablename__ = "patient_admissions"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String)
    admitted_by = Column(String)
    race = Column(String)
    gender = Column(String)
    age = Column(String)
    time_in_hospital = Column(Integer)
    num_medications = Column(Integer)
    insulin = Column(String)
    change = Column(Integer)
    readmission_probability = Column(String)
    risk_category = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
