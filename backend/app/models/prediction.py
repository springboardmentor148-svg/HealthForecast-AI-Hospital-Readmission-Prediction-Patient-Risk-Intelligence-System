from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
)

from sqlalchemy.sql import func

from app.database.postgres import Base


class Prediction(Base):

    __tablename__ = "predictions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False,
    )

    prediction = Column(
        Integer,
        nullable=False,
    )

    risk_level = Column(
        String(50),
        nullable=False,
    )

    probability = Column(
        Float,
        nullable=False,
    )

    model_name = Column(
        String(100),
        default="CatBoost",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )