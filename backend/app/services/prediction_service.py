from __future__ import annotations

from math import ceil
from datetime import date, datetime, time, timezone
from decimal import Decimal
from typing import Any

from flask import current_app
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.exc import IntegrityError

from ..errors import APIError
from ..extensions import db
from ..models import Patient, Prediction, PredictionHistory, PredictionType, RiskBand, User
from .patient_service import get_patient, serialize_patient
from .ml_inference_service import PredictionOutput, get_ml_inference_service

MAX_HISTORY_PAGE_SIZE = 100
DEFAULT_HISTORY_PAGE_SIZE = 25
HISTORY_SORT_FIELDS = {
    "prediction_date": PredictionHistory.created_at,
    "created_at": PredictionHistory.created_at,
    "risk_score": PredictionHistory.risk_score,
    "confidence": PredictionHistory.confidence,
    "threshold_used": PredictionHistory.threshold_used,
    "model_version": PredictionHistory.model_version,
    "risk_class": PredictionHistory.risk_class,
    "patient_name": Patient.last_name,
    "patient_identifier": Patient.patient_identifier,
    "prediction_id": PredictionHistory.prediction_id,
}


def _to_int(value: Any, field_name: str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise APIError(f"{field_name} must be an integer", 400) from exc


def _optional_int(value: Any, field_name: str) -> int:
    if value in (None, ""):
        return 0
    return _to_int(value, field_name)


def _nullable_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    return _to_int(value, "value")


def _optional_text(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise APIError("Input values must be strings where applicable", 400)
    cleaned = value.strip()
    return cleaned or None


def _first_present(*values: Any) -> Any:
    for value in values:
        if value not in (None, ""):
            return value
    return None


def _parse_request_payload(payload: dict[str, Any]) -> tuple[Patient, dict[str, Any]]:
    patient_id = payload.get("patient_id")
    if patient_id in (None, ""):
        raise APIError("patient_id is required", 400)

    patient = get_patient(_to_int(patient_id, "patient_id"))
    if patient is None:
        raise APIError("Patient not found", 404)

    inputs = {
        "admission_source_id": _nullable_int(_first_present(payload.get("admission_source_id"), patient.admission_source_id)),
        "discharge_disposition_id": _nullable_int(_first_present(payload.get("discharge_disposition_id"), patient.discharge_disposition_id)),
        "number_inpatient": _nullable_int(_first_present(payload.get("number_inpatient"), payload.get("prior_inpatient"), patient.number_inpatient)),
        "number_emergency": _nullable_int(_first_present(payload.get("number_emergency"), payload.get("prior_emergency"), patient.number_emergency)),
        "number_outpatient": _nullable_int(_first_present(payload.get("number_outpatient"), patient.number_outpatient)),
        "num_procedures": _nullable_int(_first_present(payload.get("num_procedures"), patient.num_procedures)),
        "num_medications": _nullable_int(_first_present(payload.get("num_medications"), payload.get("medications_count"), patient.num_medications)),
        "medications_count": _nullable_int(_first_present(payload.get("medications_count"), payload.get("num_medications"), patient.num_medications)),
        "diag_1": _optional_text(_first_present(payload.get("diag_1"), patient.primary_diagnosis)),
        "diag_2": _optional_text(_first_present(payload.get("diag_2"), patient.secondary_diagnosis)),
        "diag_3": _optional_text(_first_present(payload.get("diag_3"), payload.get("additional_diagnosis"), payload.get("diagnosis_3"), patient.diag_3)),
        "a1c_result": _optional_text(_first_present(payload.get("a1c_result"), payload.get("A1Cresult"), patient.a1c_result)),
        "max_glu_serum": _optional_text(_first_present(payload.get("max_glu_serum"), patient.max_glu_serum)),
        "insulin_usage": _optional_text(_first_present(payload.get("insulin_usage"), payload.get("insulin"), patient.insulin_usage)),
        "time_in_hospital": _nullable_int(_first_present(payload.get("time_in_hospital"), patient.time_in_hospital)),
        "diagnoses_count": _nullable_int(_first_present(payload.get("diagnoses_count"), patient.prior_diagnoses_count)),
    }

    return patient, inputs


def _calculate_prediction(payload: dict[str, Any], patient: Patient) -> PredictionOutput:
    service = get_ml_inference_service(current_app.config["MODEL_ARTIFACTS_DIR"])
    return service.predict(payload, patient)


def _serialize_history(history: PredictionHistory) -> dict[str, Any]:
    return {
        "id": history.id,
        "patient_id": history.patient_id,
        "patient_identifier": history.patient.patient_identifier if history.patient else None,
        "patient_name": f"{history.patient.first_name} {history.patient.last_name}".strip() if history.patient else None,
        "prediction_id": history.prediction_id,
        "prediction_date": history.created_at.isoformat() if history.created_at else None,
        "risk_score": float(history.risk_score),
        "risk_class": history.risk_class.value if history.risk_class else None,
        "confidence": float(history.confidence),
        "threshold_used": float(history.threshold_used) if history.threshold_used is not None else None,
        "model_name": history.prediction.model_name if history.prediction else None,
        "model_version": history.model_version,
        "prediction_type": history.prediction_type.value if history.prediction_type else None,
        "predicted_label": history.prediction.predicted_label if history.prediction else None,
        "threshold": float(history.prediction.threshold) if history.prediction and history.prediction.threshold is not None else None,
        "risk_band": history.prediction.predicted_risk_band.value if history.prediction and history.prediction.predicted_risk_band else None,
        "primary_diagnosis": history.patient.primary_diagnosis if history.patient else None,
    }


def _serialize_prediction(prediction: Prediction) -> dict[str, Any]:
    latest_history = prediction.history_records[0] if prediction.history_records else None
    return {
        "id": prediction.id,
        "patient_id": prediction.patient_id,
        "patient_name": f"{prediction.patient.first_name} {prediction.patient.last_name}".strip() if prediction.patient else None,
        "patient_identifier": prediction.patient.patient_identifier if prediction.patient else None,
        "predicted_at": prediction.predicted_at.isoformat() if prediction.predicted_at else None,
        "prediction_type": prediction.prediction_type.value if prediction.prediction_type else None,
        "model_name": prediction.model_name,
        "model_version": prediction.model_version,
        "risk_band": prediction.predicted_risk_band.value if prediction.predicted_risk_band else None,
        "readmission_probability": float(prediction.predicted_readmission_probability),
        "predicted_label": prediction.predicted_label,
        "threshold": float(prediction.threshold) if prediction.threshold is not None else None,
        "features_snapshot": prediction.features_snapshot or {},
        "explanation": prediction.explanation,
        "actual_readmitted": prediction.actual_readmitted,
        "latest_history": _serialize_history(latest_history) if latest_history else None,
    }


def _normalize_history_sort(field_name: Any, sort_order: Any) -> tuple[Any, bool]:
    sort_by = str(field_name or "prediction_date").strip().lower()
    sort_is_desc = str(sort_order or "desc").strip().lower() != "asc"
    sort_field = HISTORY_SORT_FIELDS.get(sort_by)
    if sort_field is None:
        raise APIError("Invalid sort_by value", 400)
    return sort_field, sort_is_desc


def _parse_history_bound(value: Any, field_name: str, *, end_of_day: bool = False) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise APIError(f"{field_name} must be an ISO date", 400)
    try:
        parsed_date = date.fromisoformat(value.strip())
    except ValueError as exc:
        raise APIError(f"{field_name} must be an ISO date", 400) from exc
    dt = datetime.combine(parsed_date, time.max if end_of_day else time.min)
    return dt.replace(tzinfo=timezone.utc)


def _build_history_query(args: Any):
    query = PredictionHistory.query.join(PredictionHistory.patient).join(PredictionHistory.prediction)

    search = args.get("search") or args.get("q")
    if isinstance(search, str) and search.strip():
        pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Patient.patient_identifier).like(pattern),
                func.lower(Patient.first_name).like(pattern),
                func.lower(Patient.last_name).like(pattern),
                func.lower(Prediction.predicted_label).like(pattern),
                func.lower(Prediction.model_name).like(pattern),
                func.lower(Prediction.model_version).like(pattern),
                func.lower(PredictionHistory.model_version).like(pattern),
            )
        )

    if args.get("patient_id") not in (None, ""):
        query = query.filter(PredictionHistory.patient_id == _to_int(args.get("patient_id"), "patient_id"))

    if args.get("risk_band") not in (None, ""):
        try:
            query = query.filter(PredictionHistory.risk_class == RiskBand(str(args.get("risk_band")).strip().lower()))
        except ValueError as exc:
            raise APIError("Invalid risk_band", 400) from exc

    if args.get("prediction_type") not in (None, ""):
        try:
            query = query.filter(PredictionHistory.prediction_type == PredictionType(str(args.get("prediction_type")).strip().lower()))
        except ValueError as exc:
            raise APIError("Invalid prediction_type", 400) from exc

    if args.get("model_version") not in (None, ""):
        model_version = str(args.get("model_version")).strip().lower()
        query = query.filter(func.lower(PredictionHistory.model_version) == model_version)

    if args.get("date_from") not in (None, ""):
        query = query.filter(PredictionHistory.created_at >= _parse_history_bound(args.get("date_from"), "date_from"))
    if args.get("date_to") not in (None, ""):
        query = query.filter(PredictionHistory.created_at <= _parse_history_bound(args.get("date_to"), "date_to", end_of_day=True))

    sort_field, sort_is_desc = _normalize_history_sort(args.get("sort_by"), args.get("sort_order"))
    if sort_by := str(args.get("sort_by") or "").strip().lower():
        if sort_by == "patient_name":
            order_columns = [desc(Patient.last_name), desc(Patient.first_name), desc(PredictionHistory.id)] if sort_is_desc else [asc(Patient.last_name), asc(Patient.first_name), asc(PredictionHistory.id)]
        else:
            order_columns = [desc(sort_field), desc(PredictionHistory.id)] if sort_is_desc else [asc(sort_field), asc(PredictionHistory.id)]
    else:
        order_columns = [desc(PredictionHistory.created_at), desc(PredictionHistory.id)]
    query = query.order_by(*order_columns)
    return query


def _paginate_history(query, args: Any):
    page_value = args.get("page")
    per_page_value = args.get("per_page")
    if page_value in (None, "") and per_page_value in (None, ""):
        records = query.all()
        return records, {
            "page": 1,
            "per_page": len(records),
            "total": len(records),
            "pages": 1,
            "has_next": False,
            "has_prev": False,
        }

    page = _to_int(page_value if page_value not in (None, "") else 1, "page")
    per_page = _to_int(per_page_value if per_page_value not in (None, "") else DEFAULT_HISTORY_PAGE_SIZE, "per_page")
    if page < 1:
        raise APIError("page must be greater than or equal to 1", 400)
    if per_page < 1 or per_page > MAX_HISTORY_PAGE_SIZE:
        raise APIError(f"per_page must be between 1 and {MAX_HISTORY_PAGE_SIZE}", 400)

    total = query.count()
    pages = max(1, ceil(total / per_page))
    records = query.offset((page - 1) * per_page).limit(per_page).all()
    return records, {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": pages,
        "has_next": page < pages,
        "has_prev": page > 1,
    }


def list_prediction_history(args: Any | None = None) -> dict[str, Any]:
    query_args = args or {}
    query = _build_history_query(query_args)
    records, pagination = _paginate_history(query, query_args)
    return {
        "predictions": [_serialize_history(record) for record in records],
        "pagination": pagination,
    }


def run_prediction(payload: dict[str, Any], created_by_id: int | None = None) -> dict[str, Any]:
    patient, inputs = _parse_request_payload(payload)
    prediction_output = _calculate_prediction(inputs, patient)
    patient_name = f"{patient.first_name} {patient.last_name}".strip()

    prediction = Prediction(
        patient_id=patient.id,
        created_by_id=created_by_id,
        prediction_type=PredictionType.binary,
        model_name=prediction_output.model_name,
        model_version=prediction_output.model_version,
        predicted_risk_band=prediction_output.risk_band,
        predicted_readmission_probability=Decimal(str(prediction_output.probability)),
        predicted_label=prediction_output.predicted_label,
        threshold=prediction_output.threshold,
        features_snapshot={
            "inputs": inputs,
            "patient_id": patient.id,
            "patient_identifier": patient.patient_identifier,
            "patient_name": patient_name,
            "ml_snapshot": prediction_output.features_snapshot,
        },
        explanation=prediction_output.explanation,
        actual_readmitted=None,
        predicted_at=datetime.now(timezone.utc),
    )

    db.session.add(prediction)
    db.session.flush()

    history = PredictionHistory(
        patient_id=patient.id,
        prediction_id=prediction.id,
        risk_score=Decimal(str(prediction_output.probability)),
        risk_class=prediction_output.risk_band,
        confidence=prediction_output.confidence,
        threshold_used=prediction_output.threshold,
        model_version=prediction_output.model_version,
        prediction_type=PredictionType.binary,
    )
    db.session.add(history)
    db.session.flush()

    from .forecast_service import generate_treatment_forecast
    from ..models import TreatmentEffectiveness
    forecast = generate_treatment_forecast(patient.id)
    active_treatment = TreatmentEffectiveness.query.filter_by(patient_id=patient.id, status="active").first()
    if active_treatment:
        active_treatment.predicted_treatment_effectiveness = forecast.get("predicted_treatment_effectiveness")
        active_treatment.predicted_recovery_days = forecast.get("predicted_recovery_days")
        active_treatment.expected_response_category = forecast.get("expected_response_category")
        active_treatment.treatment_confidence = forecast.get("treatment_confidence")
        active_treatment.forecast_generated_at = forecast.get("forecast_generated_at")

    patient.risk_band = prediction_output.risk_band
    patient.readmission_probability = Decimal(str(prediction_output.probability))
    patient.last_prediction_at = datetime.now(timezone.utc)

    from .notification_service import broadcast_notification
    is_high_risk = prediction.predicted_risk_band in (RiskBand.high, RiskBand.critical)
    prob_pct = float(prediction.predicted_readmission_probability) * 100
    
    if is_high_risk:
        broadcast_notification(
            title="🚨 High-Risk Readmission Alert",
            message=f"{patient_name} flagged at {prob_pct:.2f}% readmission risk ({prediction.predicted_risk_band.value} band).",
            notification_type="HIGH_RISK_PREDICTION",
            related_entity="Prediction",
            related_entity_id=prediction.id
        )
    else:
        broadcast_notification(
            title="🔮 Risk Prediction Generated",
            message=f"Readmission prediction run completed for {patient_name} ({prob_pct:.2f}% probability, {prediction.predicted_risk_band.value}).",
            notification_type="PREDICTION_GENERATED",
            related_entity="Prediction",
            related_entity_id=prediction.id
        )

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIError("Unable to save prediction", 409) from exc

    db.session.refresh(prediction)
    db.session.refresh(history)
    db.session.refresh(patient)

    from .user_service import log_user_activity
    log_user_activity(
        user_id=created_by_id,
        action="run_prediction",
        target_type="Prediction",
        target_id=prediction.id,
        metadata={
            "patient_id": patient.id,
            "patient_name": patient_name,
            "readmission_probability": float(prediction.predicted_readmission_probability),
        },
    )


    return {
        "prediction": _serialize_prediction(prediction),
        "history": _serialize_history(history),
        "patient": serialize_patient(patient),
        "analysis": prediction_output.analysis,
        "treatment_forecast": {
            "predicted_treatment_effectiveness": float(forecast.get("predicted_treatment_effectiveness")) if forecast.get("predicted_treatment_effectiveness") is not None else None,
            "predicted_recovery_days": float(forecast.get("predicted_recovery_days")) if forecast.get("predicted_recovery_days") is not None else None,
            "expected_response_category": forecast.get("expected_response_category").value if forecast.get("expected_response_category") else None,
            "treatment_confidence": float(forecast.get("treatment_confidence")) if forecast.get("treatment_confidence") is not None else None,
            "forecast_generated_at": forecast.get("forecast_generated_at").isoformat() if forecast.get("forecast_generated_at") else None,
        }
    }


def list_predictions_for_patient(patient_id: int, args: Any | None = None) -> dict[str, Any]:
    patient = get_patient(patient_id)
    if patient is None:
        raise APIError("Patient not found", 404)
    query_args = {"patient_id": patient_id, **(args or {})}
    query = _build_history_query(query_args)
    records, pagination = _paginate_history(query, query_args)
    return {
        "predictions": [_serialize_history(record) for record in records],
        "pagination": pagination,
    }


def fetch_prediction(prediction_id: int) -> Prediction | None:
    return db.session.get(Prediction, prediction_id)


def serialize_prediction_detail(prediction: Prediction) -> dict[str, Any]:
    return _serialize_prediction(prediction)


def get_unique_model_versions() -> list[str]:
    """
    Retrieves a list of unique model versions from prediction_history,
    sorted alphabetically, excluding null values.
    """
    results = (
        db.session.query(PredictionHistory.model_version)
        .filter(PredictionHistory.model_version.isnot(None))
        .distinct()
        .order_by(PredictionHistory.model_version.asc())
        .all()
    )
    return [r[0] for r in results]
