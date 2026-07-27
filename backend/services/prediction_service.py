"""
Business logic for AI readmission-risk predictions: preprocesses input,
invokes the loaded XGBoost model, persists the result, and returns a
clinically-worded response.
"""
import uuid

from sqlalchemy.orm import Session

from core.config import settings
from core.exceptions import NotFoundException, PredictionServiceException
from core.logging import prediction_logger
from ml.model_loader import ModelNotLoadedError, get_model
from ml.preprocessing import (
    build_feature_frame,
    recommendation_from_risk,
    risk_category_from_probability,
)
from models.audit import AuditLog
from models.patient import Patient
from models.prediction import Prediction
from repositories.audit_repository import AuditRepository
from repositories.patient_repository import PatientRepository
from repositories.prediction_repository import PredictionRepository
from schemas.prediction import PredictionRequest
from utils.constants import AuditAction


class PredictionService:
    def __init__(self, db: Session):
        self.db = db
        self.patients = PatientRepository(db)
        self.predictions = PredictionRepository(db)
        self.audits = AuditRepository(db)

    def predict(self, payload: PredictionRequest, current_user, ip: str, endpoint: str) -> Prediction:
        # Resolve clinical data: prefer a stored patient record if given,
        # falling back to inline fields for a one-off/what-if prediction.
        patient: Patient | None = None
        if payload.patient_id:
            patient = self.patients.get_by_id(payload.patient_id)
            if not patient:
                raise NotFoundException("Patient not found")
            clinical_data = {
                "age": patient.age,
                "gender": patient.gender,
                "race": patient.race,
                "admission_type": patient.admission_type,
                "discharge_disposition": patient.discharge_disposition,
                "admission_source": patient.admission_source,
                "time_in_hospital": patient.time_in_hospital,
                "num_lab_procedures": patient.num_lab_procedures,
                "num_procedures": patient.num_procedures,
                "num_medications": patient.num_medications,
                "number_outpatient": patient.number_outpatient,
                "number_emergency": patient.number_emergency,
                "number_inpatient": patient.number_inpatient,
                "diabetes_med": patient.diabetes_med,
                "insulin": patient.insulin,
                "a1c_result": patient.a1c_result,
                "glucose_result": patient.glucose_result,
            }
        else:
            clinical_data = payload.model_dump(exclude={"patient_id"})
            if clinical_data.get("age") is None:
                raise PredictionServiceException(
                    "Either patient_id or inline clinical fields (at least 'age') must be provided"
                )

        try:
            model = get_model()
            features = build_feature_frame(clinical_data)
            proba = model.predict_proba(features)[0]
            # Assume binary classifier: index 1 = probability of readmission
            probability = float(proba[1]) if len(proba) > 1 else float(proba[0])
            confidence = float(max(proba))
        except ModelNotLoadedError as exc:
            prediction_logger.error("Model not available: %s", exc)
            raise PredictionServiceException(str(exc))
        except Exception as exc:
            prediction_logger.error("Prediction failed: %s", exc, exc_info=True)
            raise PredictionServiceException("Failed to generate a prediction")

        risk_category = risk_category_from_probability(probability)
        recommendation = recommendation_from_risk(risk_category)

        # If no stored patient was referenced, create a lightweight record
        # so the prediction has something to attach to and appears in history.
        if patient is None:
            patient = Patient(
                id=uuid.uuid4(),
                patient_name=clinical_data.get("patient_name") or "Unnamed (ad-hoc prediction)",
                gender=clinical_data.get("gender") or "unknown",
                age=clinical_data.get("age"),
                **{k: v for k, v in clinical_data.items() if k not in {"gender", "age", "patient_name"}},
            )
            patient = self.patients.create(patient)

        prediction = Prediction(
            id=uuid.uuid4(),
            patient_id=patient.id,
            predicted_by=current_user.id,
            probability=probability,
            risk_category=risk_category,
            confidence=confidence,
            recommendation=recommendation,
            model_version=settings.MODEL_VERSION,
        )
        prediction = self.predictions.create(prediction)

        prediction_logger.info(
            "Prediction generated for patient=%s risk=%s probability=%.4f by user=%s",
            patient.id, risk_category, probability, current_user.email,
        )
        self.audits.create(
            AuditLog(
                user_id=current_user.id,
                action=AuditAction.PREDICTION,
                endpoint=endpoint,
                ip_address=ip,
                status="success",
                details=f"patient={patient.id} risk={risk_category}",
            )
        )
        return prediction

    def get_prediction(self, prediction_id: uuid.UUID) -> Prediction:
        prediction = self.predictions.get_by_id(prediction_id)
        if not prediction:
            raise NotFoundException("Prediction not found")
        return prediction

    def list_for_patient(self, patient_id: uuid.UUID, page: int, page_size: int):
        if not self.patients.get_by_id(patient_id):
            raise NotFoundException("Patient not found")
        return self.predictions.list_for_patient(patient_id, page, page_size)
