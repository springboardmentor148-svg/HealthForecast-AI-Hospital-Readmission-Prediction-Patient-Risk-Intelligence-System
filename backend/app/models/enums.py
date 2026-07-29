from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    doctor = "doctor"
    hospital_administrator = "hospital_administrator"
    healthcare_researcher = "healthcare_researcher"
    system_administrator = "system_administrator"


class Gender(str, enum.Enum):
    female = "female"
    male = "male"
    other = "other"
    unknown = "unknown"


class AdmissionType(str, enum.Enum):
    emergency = "emergency"
    urgent = "urgent"
    elective = "elective"
    newborn = "newborn"
    trauma = "trauma"
    other = "other"


class RiskBand(str, enum.Enum):
    low = "low"
    moderate = "moderate"
    high = "high"
    critical = "critical"


class PredictionType(str, enum.Enum):
    binary = "binary"
    multiclass = "multiclass"


class TreatmentEffectivenessLevel(str, enum.Enum):
    poor = "poor"
    fair = "fair"
    good = "good"
    excellent = "excellent"
