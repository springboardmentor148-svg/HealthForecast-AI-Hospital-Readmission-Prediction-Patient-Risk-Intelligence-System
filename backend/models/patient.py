"""Patient ORM model — clinical fields used as XGBoost model input."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    patient_name: Mapped[str] = mapped_column(String(150), nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    race: Mapped[str] = mapped_column(String(50), nullable=True)

    admission_type: Mapped[str] = mapped_column(String(100), nullable=True)
    discharge_disposition: Mapped[str] = mapped_column(String(150), nullable=True)
    admission_source: Mapped[str] = mapped_column(String(150), nullable=True)

    time_in_hospital: Mapped[int] = mapped_column(Integer, default=0)
    num_lab_procedures: Mapped[int] = mapped_column(Integer, default=0)
    num_procedures: Mapped[int] = mapped_column(Integer, default=0)
    num_medications: Mapped[int] = mapped_column(Integer, default=0)
    number_outpatient: Mapped[int] = mapped_column(Integer, default=0)
    number_emergency: Mapped[int] = mapped_column(Integer, default=0)
    number_inpatient: Mapped[int] = mapped_column(Integer, default=0)

    diagnosis_1: Mapped[str] = mapped_column(String(50), nullable=True)
    diagnosis_2: Mapped[str] = mapped_column(String(50), nullable=True)
    diagnosis_3: Mapped[str] = mapped_column(String(50), nullable=True)

    diabetes_med: Mapped[str] = mapped_column(String(10), nullable=True)
    insulin: Mapped[str] = mapped_column(String(20), nullable=True)
    a1c_result: Mapped[str] = mapped_column(String(20), nullable=True)
    glucose_result: Mapped[str] = mapped_column(String(20), nullable=True)

    attending_doctor: Mapped[str] = mapped_column(String(150), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    predictions = relationship(
        "Prediction", back_populates="patient", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Patient {self.patient_name} ({self.age}y)>"
