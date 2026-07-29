from __future__ import annotations

import sys
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy import text
from werkzeug.security import generate_password_hash

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.models import (  # noqa: E402
    ActivityLog,
    AdmissionType,
    Gender,
    Patient,
    Prediction,
    PredictionHistory,
    RiskBand,
    TreatmentEffectiveness,
    User,
    UserRole,
)
from app.models.enums import PredictionType, TreatmentEffectivenessLevel  # noqa: E402


BASE_DATE = date(2026, 7, 24)
BASE_NOW = datetime(2026, 7, 24, 12, 0, tzinfo=UTC)
PASSWORD = "password123"

ROLE_MAP = {
    "doctor": UserRole.doctor,
    "hospital_admin": UserRole.hospital_administrator,
    "researcher": UserRole.healthcare_researcher,
    "system_admin": UserRole.system_administrator,
}


def dt(days_ago: int = 0, hours: int = 0, minutes: int = 0) -> datetime:
    return BASE_NOW - timedelta(days=days_ago, hours=hours, minutes=minutes)


def d(days_ago: int = 0) -> date:
    return BASE_DATE - timedelta(days=days_ago)


def has_column(model: Any, column_name: str) -> bool:
    return column_name in model.__table__.columns.keys()


def assign_if_present(obj: Any, column_name: str, value: Any) -> None:
    if has_column(type(obj), column_name):
        setattr(obj, column_name, value)


def upsert_user(record: dict[str, Any]) -> User:
    user = User.query.filter_by(email=record["email"]).one_or_none()
    if user is None:
        user = User(email=record["email"])
        db.session.add(user)

    user.username = record["username"]
    user.full_name = record["full_name"]
    user.password_hash = record["password_hash"]
    user.role = ROLE_MAP[record["role"]]
    user.department = record["department"]
    user.phone = record.get("phone")
    user.is_active = True
    user.last_login_at = None

    assign_if_present(user, "created_at", record["created_at"])
    assign_if_present(user, "updated_at", record["updated_at"])
    return user


def upsert_patient(record: dict[str, Any], doctor: User) -> Patient:
    patient = Patient.query.filter_by(patient_identifier=record["patient_identifier"]).one_or_none()
    if patient is None:
        patient = Patient(patient_identifier=record["patient_identifier"])
        db.session.add(patient)

    patient.first_name = record["first_name"]
    patient.last_name = record["last_name"]
    patient.date_of_birth = record["date_of_birth"]
    patient.age_at_admission = record["age_at_admission"]
    patient.gender = record["gender"]
    patient.admission_type = record["admission_type"]
    patient.primary_diagnosis = record["primary_diagnosis"]
    patient.secondary_diagnosis = record.get("secondary_diagnosis")
    patient.admission_date = record["admission_date"]
    patient.discharge_date = record["discharge_date"]
    patient.time_in_hospital = record["time_in_hospital"]
    patient.prior_diagnoses_count = record["prior_diagnoses_count"]
    patient.lab_procedures_count = record["lab_procedures_count"]
    patient.medications = record["medications"]
    patient.follow_up_schedule = record["follow_up_schedule"]
    patient.discharge_plan = record["discharge_plan"]
    patient.risk_band = record["risk_band"]
    patient.readmission_probability = record["readmission_probability"]
    patient.last_prediction_at = record["last_prediction_at"]
    patient.assigned_doctor = doctor
    patient.is_active = True

    assign_if_present(patient, "created_at", record["created_at"])
    assign_if_present(patient, "updated_at", record["updated_at"])
    return patient


def upsert_prediction(record: dict[str, Any], patient: Patient, creator: User) -> Prediction:
    prediction = Prediction.query.filter_by(patient_id=patient.id).order_by(Prediction.id.asc()).first()
    if prediction is None:
        prediction = Prediction(patient=patient)
        db.session.add(prediction)

    prediction.patient = patient
    prediction.created_by = creator
    prediction.prediction_type = record["prediction_type"]
    prediction.model_name = record["model_name"]
    prediction.model_version = record["model_version"]
    prediction.predicted_risk_band = record["predicted_risk_band"]
    prediction.predicted_readmission_probability = record["predicted_readmission_probability"]
    prediction.predicted_label = record["predicted_label"]
    prediction.threshold = record["threshold"]
    prediction.features_snapshot = record["features_snapshot"]
    prediction.explanation = record["explanation"]
    prediction.actual_readmitted = record["actual_readmitted"]
    prediction.predicted_at = record["predicted_at"]

    assign_if_present(prediction, "created_at", record["created_at"])
    assign_if_present(prediction, "updated_at", record["updated_at"])
    return prediction


def upsert_prediction_history(record: dict[str, Any], patient: Patient, prediction: Prediction) -> PredictionHistory:
    history = PredictionHistory.query.filter_by(prediction_id=prediction.id).one_or_none()
    if history is None:
        history = PredictionHistory(prediction=prediction, patient=patient)
        db.session.add(history)

    history.patient = patient
    history.prediction = prediction
    history.risk_score = record["risk_score"]
    history.risk_class = record["risk_class"]
    history.confidence = record["confidence"]
    history.threshold_used = record["threshold_used"]
    history.model_version = record["model_version"]
    history.prediction_type = record["prediction_type"]
    assign_if_present(history, "created_at", record["created_at"])
    return history


def upsert_treatment_effectiveness(record: dict[str, Any], patient: Patient) -> TreatmentEffectiveness:
    treatment = (
        TreatmentEffectiveness.query.filter_by(
            patient_id=patient.id,
            treatment_name=record["treatment_name"],
            start_date=record["start_date"],
        ).one_or_none()
    )
    if treatment is None:
        treatment = TreatmentEffectiveness(patient=patient)
        db.session.add(treatment)

    treatment.patient = patient
    treatment.treatment_name = record["treatment_name"]
    treatment.treatment_type = record["treatment_type"]
    treatment.start_date = record["start_date"]
    treatment.end_date = record["end_date"]
    treatment.outcome_score = record["outcome_score"]
    treatment.effectiveness_level = record["effectiveness_level"]
    treatment.notes = record["notes"]
    assign_if_present(treatment, "created_at", record["created_at"])
    assign_if_present(treatment, "updated_at", record["updated_at"])
    return treatment


def upsert_activity_log(record: dict[str, Any], user: User | None) -> ActivityLog:
    log = ActivityLog.query.filter_by(
        action=record["action"],
        target_type=record["target_type"],
        target_id=record["target_id"],
        created_at=record["created_at"],
    ).one_or_none()
    if log is None:
        log = ActivityLog()
        db.session.add(log)

    log.user = user
    log.action = record["action"]
    log.target_type = record["target_type"]
    log.target_id = record["target_id"]
    log.metadata_json = record["metadata_json"]
    log.ip_address = record.get("ip_address")
    log.created_at = record["created_at"]
    return log


def effective_treatment_level(score: Decimal) -> TreatmentEffectivenessLevel:
    if score < Decimal("0.45"):
        return TreatmentEffectivenessLevel.poor
    if score < Decimal("0.65"):
        return TreatmentEffectivenessLevel.fair
    if score < Decimal("0.80"):
        return TreatmentEffectivenessLevel.good
    return TreatmentEffectivenessLevel.excellent


def seed_users() -> dict[str, User]:
    password_hash = generate_password_hash(PASSWORD)
    raw_users = [
        {
            "username": "sarah.reed",
            "full_name": "Sarah Reed",
            "email": "sarah.reed@healthforecast.ai",
            "role": "doctor",
            "department": "Endocrinology",
            "phone": "555-0101",
            "created_at": dt(35, hours=2),
            "updated_at": dt(2, hours=1),
            "password_hash": password_hash,
        },
        {
            "username": "marcus.sterling",
            "full_name": "Marcus Sterling",
            "email": "marcus.sterling@healthforecast.ai",
            "role": "hospital_admin",
            "department": "Hospital Administration",
            "phone": "555-0102",
            "created_at": dt(34, hours=2),
            "updated_at": dt(4, hours=2),
            "password_hash": password_hash,
        },
        {
            "username": "elena.rostova",
            "full_name": "Elena Rostova",
            "email": "elena.rostova@healthforecast.ai",
            "role": "researcher",
            "department": "Clinical Research",
            "phone": "555-0103",
            "created_at": dt(33, hours=3),
            "updated_at": dt(3, hours=3),
            "password_hash": password_hash,
        },
        {
            "username": "thomas.vance",
            "full_name": "Thomas Vance",
            "email": "thomas.vance@healthforecast.ai",
            "role": "system_admin",
            "department": "Platform Operations",
            "phone": "555-0104",
            "created_at": dt(32, hours=3),
            "updated_at": dt(1, hours=4),
            "password_hash": password_hash,
        },
    ]

    users: dict[str, User] = {}
    for record in raw_users:
        user = upsert_user(record)
        users[record["email"]] = user
    db.session.flush()
    return users


def seed_patients(sarah: User) -> dict[str, Patient]:
    raw_patients = [
        {
            "patient_identifier": "82014",
            "first_name": "Clara",
            "last_name": "Oswald",
            "date_of_birth": date(1980, 4, 12),
            "age_at_admission": 46,
            "gender": Gender.female,
            "admission_type": AdmissionType.emergency,
            "primary_diagnosis": "Type 2 Diabetes Mellitus",
            "secondary_diagnosis": "Hypertension",
            "admission_date": d(22),
            "discharge_date": d(16),
            "time_in_hospital": 6,
            "prior_diagnoses_count": 8,
            "lab_procedures_count": 54,
            "medications": ["Metformin", "Insulin Glargine", "Lisinopril"],
            "follow_up_schedule": "Endocrinology follow-up within 7 days.",
            "discharge_plan": "Continue basal insulin and reinforce glucose logging.",
            "risk_band": RiskBand.high,
            "readmission_probability": Decimal("84.12"),
            "last_prediction_at": dt(20),
            "created_at": dt(22, hours=5),
            "updated_at": dt(16, hours=3),
        },
        {
            "patient_identifier": "29481",
            "first_name": "Franklin",
            "last_name": "Myers",
            "date_of_birth": date(1964, 9, 8),
            "age_at_admission": 62,
            "gender": Gender.male,
            "admission_type": AdmissionType.urgent,
            "primary_diagnosis": "Diabetes with Kidney Manifestations",
            "secondary_diagnosis": "Chronic Kidney Disease",
            "admission_date": d(21),
            "discharge_date": d(14),
            "time_in_hospital": 7,
            "prior_diagnoses_count": 9,
            "lab_procedures_count": 62,
            "medications": ["Insulin Lispro", "Losartan", "Furosemide", "Atorvastatin"],
            "follow_up_schedule": "Nephrology and primary care follow-up within 7 days.",
            "discharge_plan": "Blood pressure control, fluid balance monitoring, diet review.",
            "risk_band": RiskBand.high,
            "readmission_probability": Decimal("72.84"),
            "last_prediction_at": dt(19),
            "created_at": dt(21, hours=6),
            "updated_at": dt(14, hours=4),
        },
        {
            "patient_identifier": "48291",
            "first_name": "Arthur",
            "last_name": "Pendelton",
            "date_of_birth": date(1958, 2, 27),
            "age_at_admission": 68,
            "gender": Gender.male,
            "admission_type": AdmissionType.emergency,
            "primary_diagnosis": "Ketoacidosis with Complications",
            "secondary_diagnosis": "Acute Dehydration",
            "admission_date": d(20),
            "discharge_date": d(15),
            "time_in_hospital": 5,
            "prior_diagnoses_count": 6,
            "lab_procedures_count": 47,
            "medications": ["Insulin Glargine", "Metoprolol", "Aspirin"],
            "follow_up_schedule": "Endocrine outpatient consult within 7 days.",
            "discharge_plan": "Daily glucose checks and hydration guidance.",
            "risk_band": RiskBand.high,
            "readmission_probability": Decimal("68.34"),
            "last_prediction_at": dt(18),
            "created_at": dt(20, hours=4),
            "updated_at": dt(15, hours=2),
        },
        {
            "patient_identifier": "88291",
            "first_name": "Katherine",
            "last_name": "Goble",
            "date_of_birth": date(1948, 11, 3),
            "age_at_admission": 78,
            "gender": Gender.female,
            "admission_type": AdmissionType.elective,
            "primary_diagnosis": "Diabetes with Ophthalmic Manifestations",
            "secondary_diagnosis": "Cataract Follow-up",
            "admission_date": d(19),
            "discharge_date": d(16),
            "time_in_hospital": 3,
            "prior_diagnoses_count": 5,
            "lab_procedures_count": 38,
            "medications": ["Metformin", "Glipizide", "Lisinopril", "Eye Drops (Latanoprost)"],
            "follow_up_schedule": "Ophthalmology in 14 days; PCP in 7 days.",
            "discharge_plan": "Glycemic stabilization and vision monitoring.",
            "risk_band": RiskBand.moderate,
            "readmission_probability": Decimal("59.90"),
            "last_prediction_at": dt(17),
            "created_at": dt(19, hours=3),
            "updated_at": dt(16, hours=1),
        },
        {
            "patient_identifier": "71920",
            "first_name": "John",
            "last_name": "Watson",
            "date_of_birth": date(1962, 7, 29),
            "age_at_admission": 64,
            "gender": Gender.male,
            "admission_type": AdmissionType.urgent,
            "primary_diagnosis": "Hypoglycemia without Complications",
            "secondary_diagnosis": "Medication Adjustment",
            "admission_date": d(18),
            "discharge_date": d(14),
            "time_in_hospital": 4,
            "prior_diagnoses_count": 7,
            "lab_procedures_count": 42,
            "medications": ["Metformin", "Carvedilol", "Amlodipine"],
            "follow_up_schedule": "PCP follow-up within 10 days for medication review.",
            "discharge_plan": "Educate patient on hypoglycemia warning signs.",
            "risk_band": RiskBand.moderate,
            "readmission_probability": Decimal("51.40"),
            "last_prediction_at": dt(16),
            "created_at": dt(18, hours=4),
            "updated_at": dt(14, hours=3),
        },
        {
            "patient_identifier": "10293",
            "first_name": "Sarah",
            "last_name": "Jenkins",
            "date_of_birth": date(1997, 10, 4),
            "age_at_admission": 29,
            "gender": Gender.female,
            "admission_type": AdmissionType.emergency,
            "primary_diagnosis": "Type 1 Diabetes Mellitus",
            "secondary_diagnosis": "Insulin Pump Education",
            "admission_date": d(17),
            "discharge_date": d(14),
            "time_in_hospital": 3,
            "prior_diagnoses_count": 2,
            "lab_procedures_count": 31,
            "medications": ["Insulin Aspart", "Insulin Detemir"],
            "follow_up_schedule": "Endocrine check in 14 days.",
            "discharge_plan": "Continuous glucose monitor training and pump settings review.",
            "risk_band": RiskBand.low,
            "readmission_probability": Decimal("12.50"),
            "last_prediction_at": dt(15),
            "created_at": dt(17, hours=5),
            "updated_at": dt(14, hours=5),
        },
        {
            "patient_identifier": "48201",
            "first_name": "Peter",
            "last_name": "Reynolds",
            "date_of_birth": date(2004, 6, 11),
            "age_at_admission": 22,
            "gender": Gender.male,
            "admission_type": AdmissionType.urgent,
            "primary_diagnosis": "Hyperglycemia & Dehydration",
            "secondary_diagnosis": "Mild Electrolyte Imbalance",
            "admission_date": d(16),
            "discharge_date": d(14),
            "time_in_hospital": 2,
            "prior_diagnoses_count": 3,
            "lab_procedures_count": 29,
            "medications": ["Metformin", "IV Fluids (Saline)"],
            "follow_up_schedule": "PCP clinic visit within 7 days.",
            "discharge_plan": "Hydration maintenance and daily fasting glucose checks.",
            "risk_band": RiskBand.moderate,
            "readmission_probability": Decimal("38.45"),
            "last_prediction_at": dt(14),
            "created_at": dt(16, hours=3),
            "updated_at": dt(14, hours=2),
        },
        {
            "patient_identifier": "59382",
            "first_name": "Bruce",
            "last_name": "Miller",
            "date_of_birth": date(1985, 8, 17),
            "age_at_admission": 41,
            "gender": Gender.male,
            "admission_type": AdmissionType.elective,
            "primary_diagnosis": "Type 2 Diabetes Mellitus",
            "secondary_diagnosis": "Lifestyle Management Review",
            "admission_date": d(15),
            "discharge_date": d(13),
            "time_in_hospital": 2,
            "prior_diagnoses_count": 4,
            "lab_procedures_count": 33,
            "medications": ["Metformin", "Sitagliptin"],
            "follow_up_schedule": "Routine PCP follow-up in 30 days.",
            "discharge_plan": "Nutrition counseling and exercise plan optimization.",
            "risk_band": RiskBand.low,
            "readmission_probability": Decimal("24.18"),
            "last_prediction_at": dt(13),
            "created_at": dt(15, hours=4),
            "updated_at": dt(13, hours=3),
        },
        {
            "patient_identifier": "38291",
            "first_name": "Diana",
            "last_name": "Carter",
            "date_of_birth": date(1991, 12, 14),
            "age_at_admission": 35,
            "gender": Gender.female,
            "admission_type": AdmissionType.elective,
            "primary_diagnosis": "Ketoacidosis (Resolved)",
            "secondary_diagnosis": "Acute Metabolic Stress",
            "admission_date": d(14),
            "discharge_date": d(11),
            "time_in_hospital": 3,
            "prior_diagnoses_count": 2,
            "lab_procedures_count": 45,
            "medications": ["Insulin Glargine", "Electrolyte Replacements"],
            "follow_up_schedule": "Endocrine consultation in 14 days.",
            "discharge_plan": "Resume basal-bolus insulin and maintain fluid intake.",
            "risk_band": RiskBand.low,
            "readmission_probability": Decimal("15.60"),
            "last_prediction_at": dt(12),
            "created_at": dt(14, hours=2),
            "updated_at": dt(11, hours=4),
        },
        {
            "patient_identifier": "28392",
            "first_name": "Clark",
            "last_name": "Davis",
            "date_of_birth": date(1993, 5, 9),
            "age_at_admission": 33,
            "gender": Gender.male,
            "admission_type": AdmissionType.emergency,
            "primary_diagnosis": "Type 1 Diabetes Mellitus",
            "secondary_diagnosis": "Insulin Dose Instability",
            "admission_date": d(13),
            "discharge_date": d(7),
            "time_in_hospital": 6,
            "prior_diagnoses_count": 6,
            "lab_procedures_count": 68,
            "medications": ["Insulin Lispro", "Insulin Glargine"],
            "follow_up_schedule": "Urgent endocrine follow-up in 3 days.",
            "discharge_plan": "Pump conversion and glucose log review.",
            "risk_band": RiskBand.high,
            "readmission_probability": Decimal("91.20"),
            "last_prediction_at": dt(11),
            "created_at": dt(13, hours=4),
            "updated_at": dt(7, hours=2),
        },
    ]

    patients: dict[str, Patient] = {}
    for record in raw_patients:
        patient = upsert_patient(record, sarah)
        patients[record["patient_identifier"]] = patient
    db.session.flush()
    return patients


def seed_predictions(users: dict[str, User], patients: dict[str, Patient]) -> dict[str, Prediction]:
    sarah = users["sarah.reed@healthforecast.ai"]
    now = dt(0)
    raw_predictions = {
        "82014": {
            "prediction_type": PredictionType.binary,
            "model_name": "Weighted Stacking Ensemble",
            "model_version": "v1.0.0",
            "predicted_risk_band": RiskBand.high,
            "predicted_readmission_probability": Decimal("84.12"),
            "predicted_label": "readmission_high",
            "threshold": Decimal("0.25"),
            "features_snapshot": {
                "age": 46,
                "prior_diagnoses": 8,
                "stay_days": 6,
                "medications": 3,
            },
            "explanation": "Polypharmacy and long inpatient stay increase readmission risk.",
            "actual_readmitted": False,
            "predicted_at": dt(22),
            "created_at": dt(22, hours=1),
            "updated_at": dt(22, hours=1),
        },
        "29481": {
            "prediction_type": PredictionType.binary,
            "model_name": "Weighted Stacking Ensemble",
            "model_version": "v1.0.0",
            "predicted_risk_band": RiskBand.high,
            "predicted_readmission_probability": Decimal("72.84"),
            "predicted_label": "readmission_high",
            "threshold": Decimal("0.25"),
            "features_snapshot": {
                "age": 62,
                "prior_diagnoses": 9,
                "stay_days": 7,
                "kidney_complications": True,
            },
            "explanation": "Kidney involvement and elevated prior utilization require close follow-up.",
            "actual_readmitted": False,
            "predicted_at": dt(21),
            "created_at": dt(21, hours=1),
            "updated_at": dt(21, hours=1),
        },
        "48291": {
            "prediction_type": PredictionType.binary,
            "model_name": "Weighted Stacking Ensemble",
            "model_version": "v1.0.0",
            "predicted_risk_band": RiskBand.high,
            "predicted_readmission_probability": Decimal("68.34"),
            "predicted_label": "readmission_high",
            "threshold": Decimal("0.25"),
            "features_snapshot": {
                "age": 68,
                "prior_diagnoses": 6,
                "stay_days": 5,
                "ketoacidosis": True,
            },
            "explanation": "Recent ketoacidosis and short-interval readmission history elevate risk.",
            "actual_readmitted": False,
            "predicted_at": dt(20),
            "created_at": dt(20, hours=1),
            "updated_at": dt(20, hours=1),
        },
        "88291": {
            "prediction_type": PredictionType.binary,
            "model_name": "Weighted Stacking Ensemble",
            "model_version": "v1.0.0",
            "predicted_risk_band": RiskBand.moderate,
            "predicted_readmission_probability": Decimal("59.90"),
            "predicted_label": "readmission_moderate",
            "threshold": Decimal("0.50"),
            "features_snapshot": {
                "age": 78,
                "prior_diagnoses": 5,
                "stay_days": 3,
                "ophthalmic_followup": True,
            },
            "explanation": "Age and chronic disease burden justify proactive outpatient monitoring.",
            "actual_readmitted": False,
            "predicted_at": dt(19),
            "created_at": dt(19, hours=1),
            "updated_at": dt(19, hours=1),
        },
        "71920": {
            "prediction_type": PredictionType.binary,
            "model_name": "Weighted Stacking Ensemble",
            "model_version": "v1.0.0",
            "predicted_risk_band": RiskBand.moderate,
            "predicted_readmission_probability": Decimal("51.40"),
            "predicted_label": "readmission_moderate",
            "threshold": Decimal("0.50"),
            "features_snapshot": {
                "age": 64,
                "prior_diagnoses": 7,
                "stay_days": 4,
                "hypoglycemia": True,
            },
            "explanation": "Medication adjustment and glycemic variability place the patient in a mid-risk band.",
            "actual_readmitted": False,
            "predicted_at": dt(18),
            "created_at": dt(18, hours=1),
            "updated_at": dt(18, hours=1),
        },
        "10293": {
            "prediction_type": PredictionType.binary,
            "model_name": "Weighted Stacking Ensemble",
            "model_version": "v1.0.0",
            "predicted_risk_band": RiskBand.low,
            "predicted_readmission_probability": Decimal("12.50"),
            "predicted_label": "readmission_low",
            "threshold": Decimal("0.50"),
            "features_snapshot": {
                "age": 29,
                "prior_diagnoses": 2,
                "stay_days": 3,
                "pump_training": True,
            },
            "explanation": "Strong self-management indicators lower the near-term readmission risk.",
            "actual_readmitted": False,
            "predicted_at": dt(17),
            "created_at": dt(17, hours=1),
            "updated_at": dt(17, hours=1),
        },
        "48201": {
            "prediction_type": PredictionType.binary,
            "model_name": "Weighted Stacking Ensemble",
            "model_version": "v1.0.0",
            "predicted_risk_band": RiskBand.moderate,
            "predicted_readmission_probability": Decimal("38.45"),
            "predicted_label": "readmission_moderate",
            "threshold": Decimal("0.50"),
            "features_snapshot": {
                "age": 22,
                "prior_diagnoses": 3,
                "stay_days": 2,
                "dehydration": True,
            },
            "explanation": "Young age offsets acute dehydration risk, keeping the score moderate.",
            "actual_readmitted": False,
            "predicted_at": dt(16),
            "created_at": dt(16, hours=1),
            "updated_at": dt(16, hours=1),
        },
        "59382": {
            "prediction_type": PredictionType.binary,
            "model_name": "Weighted Stacking Ensemble",
            "model_version": "v1.0.0",
            "predicted_risk_band": RiskBand.low,
            "predicted_readmission_probability": Decimal("24.18"),
            "predicted_label": "readmission_low",
            "threshold": Decimal("0.50"),
            "features_snapshot": {
                "age": 41,
                "prior_diagnoses": 4,
                "stay_days": 2,
                "lifestyle_management": True,
            },
            "explanation": "Stable elective admission and routine discharge plan support a lower score.",
            "actual_readmitted": False,
            "predicted_at": dt(15),
            "created_at": dt(15, hours=1),
            "updated_at": dt(15, hours=1),
        },
        "38291": {
            "prediction_type": PredictionType.binary,
            "model_name": "Weighted Stacking Ensemble",
            "model_version": "v1.0.0",
            "predicted_risk_band": RiskBand.low,
            "predicted_readmission_probability": Decimal("15.60"),
            "predicted_label": "readmission_low",
            "threshold": Decimal("0.50"),
            "features_snapshot": {
                "age": 35,
                "prior_diagnoses": 2,
                "stay_days": 3,
                "resolved_ketoacidosis": True,
            },
            "explanation": "Resolved metabolic event and strong discharge adherence suggest low risk.",
            "actual_readmitted": False,
            "predicted_at": dt(14),
            "created_at": dt(14, hours=1),
            "updated_at": dt(14, hours=1),
        },
        "28392": {
            "prediction_type": PredictionType.binary,
            "model_name": "Weighted Stacking Ensemble",
            "model_version": "v1.0.0",
            "predicted_risk_band": RiskBand.high,
            "predicted_readmission_probability": Decimal("91.20"),
            "predicted_label": "readmission_high",
            "threshold": Decimal("0.25"),
            "features_snapshot": {
                "age": 33,
                "prior_diagnoses": 6,
                "stay_days": 6,
                "insulin_instability": True,
            },
            "explanation": "Severe glycemic instability and high acuity make this patient a priority follow-up case.",
            "actual_readmitted": False,
            "predicted_at": dt(13),
            "created_at": dt(13, hours=1),
            "updated_at": dt(13, hours=1),
        },
    }

    predictions: dict[str, Prediction] = {}
    for patient_identifier, record in raw_predictions.items():
        patient = patients[patient_identifier]
        prediction = upsert_prediction(record, patient, sarah)
        predictions[patient_identifier] = prediction
    db.session.flush()
    return predictions


def seed_prediction_history(
    users: dict[str, User],
    patients: dict[str, Patient],
    predictions: dict[str, Prediction],
) -> None:
    # Seed append-only snapshots with stable timestamps so reruns remain idempotent.
    history_specs = [
        ("82014", Decimal("88.00"), RiskBand.high, Decimal("78.00"), Decimal("0.25"), dt(23)),
        ("82014", Decimal("84.12"), RiskBand.high, Decimal("84.00"), Decimal("0.25"), dt(21)),
        ("82014", Decimal("71.40"), RiskBand.moderate, Decimal("91.00"), Decimal("0.50"), dt(19)),
        ("29481", Decimal("86.00"), RiskBand.high, Decimal("74.00"), Decimal("0.25"), dt(22)),
        ("29481", Decimal("72.84"), RiskBand.high, Decimal("81.00"), Decimal("0.25"), dt(20)),
        ("48291", Decimal("84.00"), RiskBand.high, Decimal("70.00"), Decimal("0.25"), dt(21)),
        ("48291", Decimal("68.34"), RiskBand.high, Decimal("83.00"), Decimal("0.25"), dt(19)),
        ("88291", Decimal("79.00"), RiskBand.moderate, Decimal("77.00"), Decimal("0.50"), dt(18)),
        ("88291", Decimal("59.90"), RiskBand.moderate, Decimal("88.00"), Decimal("0.50"), dt(16)),
        ("71920", Decimal("74.00"), RiskBand.moderate, Decimal("72.00"), Decimal("0.50"), dt(17)),
        ("10293", Decimal("97.00"), RiskBand.low, Decimal("95.00"), Decimal("0.50"), dt(16)),
        ("10293", Decimal("12.50"), RiskBand.low, Decimal("99.00"), Decimal("0.50"), dt(14)),
        ("48201", Decimal("72.00"), RiskBand.moderate, Decimal("76.00"), Decimal("0.50"), dt(15)),
        ("59382", Decimal("81.00"), RiskBand.low, Decimal("80.00"), Decimal("0.50"), dt(14)),
        ("28392", Decimal("69.00"), RiskBand.high, Decimal("68.00"), Decimal("0.25"), dt(12)),
        ("28392", Decimal("91.20"), RiskBand.high, Decimal("86.00"), Decimal("0.25"), dt(10)),
    ]

    for patient_identifier, risk_score, risk_class, confidence, threshold_used, created_at in history_specs:
        prediction = predictions[patient_identifier]
        patient = patients[patient_identifier]
        history = PredictionHistory.query.filter_by(
            patient_id=patient.id,
            prediction_id=prediction.id,
            created_at=created_at,
        ).one_or_none()
        if history is not None:
            continue

        history = PredictionHistory(prediction=prediction, patient=patient)
        db.session.add(history)
        history.risk_score = risk_score
        history.risk_class = risk_class
        history.confidence = confidence
        history.threshold_used = threshold_used
        history.model_version = "v1.0.0"
        history.prediction_type = PredictionType.binary
        history.created_at = created_at


def seed_treatment_effectiveness(patients: dict[str, Patient]) -> None:
    treatment_specs = [
        ("82014", "Insulin Therapy", "Medication", d(21), d(13), Decimal("0.82"), "excellent", "Tolerated basal-bolus regimen with improved fasting glucose."),
        ("29481", "Metformin", "Medication", d(20), d(12), Decimal("0.71"), "good", "Renal-safe dose review completed with nephrology input."),
        ("48291", "Insulin Therapy", "Medication", d(19), d(14), Decimal("0.76"), "good", "Ketoacidosis resolved and ketone trend normalized."),
        ("88291", "Dietary Counseling", "Lifestyle", d(18), d(10), Decimal("0.63"), "fair", "Dietary adherence improved though vision care follow-up remains important."),
        ("71920", "Lifestyle Intervention", "Lifestyle", d(17), d(11), Decimal("0.68"), "good", "Hypoglycemia education reduced repeat low-glucose events."),
        ("10293", "Insulin Therapy", "Medication", d(16), d(9), Decimal("0.88"), "excellent", "Pump training and CGM use were successful."),
        ("48201", "Hydration Protocol", "Supportive Care", d(15), d(12), Decimal("0.66"), "good", "Hydration goals were met and fasting glucose stabilized."),
        ("59382", "Metformin", "Medication", d(14), d(8), Decimal("0.59"), "fair", "Routine diabetes management was stable but requires follow-up."),
        ("38291", "Dietary Counseling", "Lifestyle", d(13), d(7), Decimal("0.91"), "excellent", "Lifestyle adherence and basal insulin routine were consistent."),
        ("28392", "Insulin Therapy", "Medication", d(12), d(6), Decimal("0.44"), "fair", "High acuity remains but the discharge plan was accepted."),
    ]

    for patient_identifier, treatment_name, treatment_type, start_date, end_date, outcome_score, level_name, notes in treatment_specs:
        patient = patients[patient_identifier]
        treatment = (
            TreatmentEffectiveness.query.filter_by(
                patient_id=patient.id,
                treatment_name=treatment_name,
                start_date=start_date,
            ).one_or_none()
        )
        if treatment is None:
            treatment = TreatmentEffectiveness(patient=patient)
            db.session.add(treatment)

        treatment.patient = patient
        treatment.treatment_name = treatment_name
        treatment.treatment_type = treatment_type
        treatment.start_date = start_date
        treatment.end_date = end_date
        treatment.outcome_score = outcome_score
        treatment.effectiveness_level = TreatmentEffectivenessLevel[level_name]
        treatment.notes = notes
        if not has_column(TreatmentEffectiveness, "created_at"):
            continue
        if treatment.created_at is None:
            treatment.created_at = dt((BASE_DATE - start_date).days, hours=3)
        treatment.updated_at = dt((BASE_DATE - end_date).days, hours=2)


def seed_activity_logs(users: dict[str, User], patients: dict[str, Patient], predictions: dict[str, Prediction]) -> None:
    sarah = users["sarah.reed@healthforecast.ai"]
    marcus = users["marcus.sterling@healthforecast.ai"]
    elena = users["elena.rostova@healthforecast.ai"]
    thomas = users["thomas.vance@healthforecast.ai"]

    logs = [
        (sarah, "User login", "User", str(sarah.id), {"source": "portal", "status": "success"}, dt(21, hours=8)),
        (marcus, "Role updated", "User", str(sarah.id), {"from": "researcher", "to": "doctor", "scope": "admin"}, dt(20, hours=9)),
        (sarah, "Patient assigned", "Patient", patients["82014"].patient_identifier, {"assigned_to": "Sarah Reed"}, dt(20, hours=11)),
        (sarah, "Prediction generated", "Prediction", str(predictions["82014"].id), {"patient": "Clara Oswald", "model": "v1.0.0"}, dt(19, hours=10)),
        (sarah, "Patient discharged", "Patient", patients["82014"].patient_identifier, {"discharge_plan": "Insulin adjustment"}, dt(19, hours=12)),
        (sarah, "Treatment updated", "TreatmentEffectiveness", str(patients["82014"].id), {"treatment": "Insulin Therapy"}, dt(18, hours=9)),
        (elena, "User created", "User", str(elena.id), {"role": "researcher", "department": "Clinical Research"}, dt(18, hours=15)),
        (sarah, "Prediction generated", "Prediction", str(predictions["29481"].id), {"patient": "Franklin Myers", "model": "v1.0.0"}, dt(17, hours=10)),
        (thomas, "System generated prediction", "Prediction", str(predictions["48291"].id), {"system": True, "priority": "high"}, dt(16, hours=7)),
        (sarah, "Patient assigned", "Patient", patients["48291"].patient_identifier, {"assigned_to": "Sarah Reed"}, dt(16, hours=11)),
        (sarah, "Profile updated", "User", str(sarah.id), {"field": "phone"}, dt(15, hours=14)),
        (sarah, "Prediction generated", "Prediction", str(predictions["88291"].id), {"patient": "Katherine Goble", "model": "v1.0.0"}, dt(14, hours=10)),
        (sarah, "Treatment updated", "TreatmentEffectiveness", str(patients["88291"].id), {"treatment": "Dietary Counseling"}, dt(13, hours=8)),
        (sarah, "Patient discharged", "Patient", patients["71920"].patient_identifier, {"discharge_plan": "Hypoglycemia education"}, dt(12, hours=13)),
        (sarah, "Prediction generated", "Prediction", str(predictions["10293"].id), {"patient": "Sarah Jenkins", "model": "v1.0.0"}, dt(11, hours=9)),
        (sarah, "Treatment updated", "TreatmentEffectiveness", str(patients["10293"].id), {"treatment": "Insulin Therapy"}, dt(10, hours=9)),
        (marcus, "Role updated", "User", str(thomas.id), {"from": "admin", "to": "system_admin"}, dt(9, hours=8)),
        (sarah, "Prediction generated", "Prediction", str(predictions["28392"].id), {"patient": "Clark Davis", "model": "v1.0.0"}, dt(8, hours=10)),
        (None, "System generated prediction", "Prediction", str(predictions["59382"].id), {"system": True, "priority": "moderate"}, dt(7, hours=7)),
        (thomas, "System maintenance", "System", "scheduler", {"task": "nightly sync", "status": "completed"}, dt(6, hours=2)),
    ]

    for user, action, target_type, target_id, metadata_json, created_at in logs:
        log = ActivityLog.query.filter_by(
            action=action,
            target_type=target_type,
            target_id=target_id,
            created_at=created_at,
        ).one_or_none()
        if log is not None:
            continue

        log = ActivityLog()
        db.session.add(log)
        log.user = user
        log.action = action
        log.target_type = target_type
        log.target_id = target_id
        log.metadata_json = metadata_json
        log.ip_address = "127.0.0.1" if user is not None else None
        log.created_at = created_at


def seed_all() -> None:
    users = seed_users()
    sarah = users["sarah.reed@healthforecast.ai"]
    patients = seed_patients(sarah)
    predictions = seed_predictions(users, patients)
    seed_prediction_history(users, patients, predictions)
    seed_treatment_effectiveness(patients)
    seed_activity_logs(users, patients, predictions)
    db.session.commit()

    print("Seed Complete")
    print(f"Users: {User.query.count()}")
    print(f"Patients: {Patient.query.count()}")
    print(f"Predictions: {Prediction.query.count()}")
    print(f"Prediction History: {PredictionHistory.query.count()}")
    print(f"Treatment Records: {TreatmentEffectiveness.query.count()}")
    print(f"Activity Logs: {ActivityLog.query.count()}")


def main() -> None:
    app = create_app()
    with app.app_context():
        try:
            db.session.execute(text("SELECT 1"))
        except Exception as exc:  # pragma: no cover - environment guard
            raise SystemExit(f"Unable to connect to the configured database: {exc}") from exc

        try:
            seed_all()
        except Exception:
            db.session.rollback()
            raise


if __name__ == "__main__":
    main()
