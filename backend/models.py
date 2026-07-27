# ==========================================
# models.py — database tables
# ==========================================

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="clinician")  # clinician | admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    predictions = relationship("PredictionRecord", back_populates="user")


class PredictionRecord(Base):
    """One row per risk score generated — this is what powers the
    real (non-mock) high-risk queue on the dashboard."""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    input_payload = Column(JSON, nullable=False)   # the raw encounter fields submitted
    probability = Column(Float, nullable=False)
    risk_band = Column(String, nullable=False)
    threshold_used = Column(Float, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="predictions")
