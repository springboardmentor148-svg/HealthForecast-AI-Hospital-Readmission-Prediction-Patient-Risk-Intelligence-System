from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey
from sqlalchemy import Text
from sqlalchemy import DECIMAL
from sqlalchemy import TIMESTAMP
from sqlalchemy import Enum
from sqlalchemy.sql import func

from database import Base

from sqlalchemy.orm import relationship

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(String(100), unique=True, nullable=False)

    password_hash = Column(String(255), nullable=False)

    role = Column(
        Enum(
            "Doctor",
            "Hospital Administrator",
            "Healthcare Researcher",
            "System Administrator",
            name="user_roles",
        ),
        nullable=False,
    )

    created_at = Column(
        TIMESTAMP,
        server_default=func.now(),
    )


class Patient(Base):

    __tablename__ = "patients"

    patient_id = Column(Integer, primary_key=True)

    patient_name = Column(String(100))

    age = Column(Integer)

    gender = Column(String(20))

    race = Column(String(50))

    admission_type = Column(Integer)

    discharge_disposition = Column(Integer)

    admission_source = Column(Integer)

    created_by = Column(Integer, ForeignKey("users.id"))

    created_at = Column(
        TIMESTAMP,
        server_default=func.now(),
    )


class Prediction(Base):

    __tablename__ = "predictions"

    prediction_id = Column(Integer, primary_key=True)

    patient_id = Column(
        Integer,
        ForeignKey("patients.patient_id"),
    )

    predicted_class = Column(Integer)

    risk_level = Column(String(30))

    probability = Column(DECIMAL(5,2))

    confidence = Column(String(30))

    recommendation = Column(Text)

    predicted_by = Column(
        Integer,
        ForeignKey("users.id"),
    )

    prediction_time = Column(
        TIMESTAMP,
        server_default=func.now(),
    )

    user = relationship("User")


class Report(Base):

    __tablename__ = "reports"

    report_id = Column(Integer, primary_key=True)

    patient_id = Column(
        Integer,
        ForeignKey("patients.patient_id"),
    )

    report_name = Column(String(100))

    report_type = Column(String(50))

    created_at = Column(
        TIMESTAMP,
        server_default=func.now(),
    )


class AuditLog(Base):

    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
    )

    action = Column(String(255))

    action_time = Column(
        TIMESTAMP,
        server_default=func.now(),
    )