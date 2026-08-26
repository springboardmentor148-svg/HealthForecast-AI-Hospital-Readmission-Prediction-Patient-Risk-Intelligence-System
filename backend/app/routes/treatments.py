from __future__ import annotations

from datetime import date, datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError

from ..errors import APIError
from ..extensions import db
from ..models import Patient, TreatmentEffectiveness, TreatmentEffectivenessLevel, User, UserRole
from ..services.insights_service import build_treatment_overview
from ..utils.access_control import require_roles

bp = Blueprint("treatments", __name__)


def _json_response(payload: dict, status_code: int = 200):
    return jsonify(payload), status_code


def _resolve_patient(patient_id: str) -> Patient:
    try:
        numeric_id = int(patient_id)
    except (TypeError, ValueError) as exc:
        raise APIError("patient_id is required", 400) from exc
    patient = db.session.get(Patient, numeric_id)
    if patient is None:
        raise APIError("Patient not found", 404)
    return patient


def _resolve_record(treatment_id: str) -> TreatmentEffectiveness:
    try:
        numeric_id = int(treatment_id)
    except (TypeError, ValueError) as exc:
        raise APIError("Treatment record not found", 404) from exc
    record = db.session.get(TreatmentEffectiveness, numeric_id)
    if record is None:
        raise APIError("Treatment record not found", 404)
    return record


def _parse_level(value: str | None) -> TreatmentEffectivenessLevel:
    if not value:
        raise APIError("effectiveness_level is required", 400)
    cleaned = value.strip().lower()
    try:
        return TreatmentEffectivenessLevel(cleaned)
    except ValueError as exc:
        raise APIError("Invalid effectiveness_level", 400) from exc


def _parse_date(value: str | None, field_name: str) -> date:
    if not isinstance(value, str) or not value.strip():
        raise APIError(f"{field_name} is required", 400)
    try:
        return datetime.fromisoformat(value).date()
    except ValueError as exc:
        raise APIError(f"{field_name} must be an ISO date", 400) from exc


def _serialize(record: TreatmentEffectiveness) -> dict:
    return {
        "id": record.id,
        "patient_id": record.patient_id,
        "patient_name": f"{record.patient.first_name} {record.patient.last_name}".strip() if record.patient else None,
        "patient_identifier": record.patient.patient_identifier if record.patient else None,
        "treatment_name": record.treatment_name,
        "treatment_type": record.treatment_type,
        "start_date": record.start_date.isoformat(),
        "end_date": record.end_date.isoformat() if record.end_date else None,
        "outcome_score": float(record.outcome_score) if record.outcome_score is not None else None,
        "effectiveness_level": record.effectiveness_level.value if record.effectiveness_level else None,
        "notes": record.notes,
        "status": record.status,
        "source": record.source,
        "approved_by": record.approver.full_name if record.approver else None,
        "predicted_treatment_effectiveness": float(record.predicted_treatment_effectiveness) if record.predicted_treatment_effectiveness is not None else None,
        "predicted_recovery_days": float(record.predicted_recovery_days) if record.predicted_recovery_days is not None else None,
        "expected_response_category": record.expected_response_category.value if record.expected_response_category else None,
        "treatment_confidence": float(record.treatment_confidence) if record.treatment_confidence is not None else None,
        "forecast_generated_at": record.forecast_generated_at.isoformat() if record.forecast_generated_at else None,
    }


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "module": "treatments"})


@bp.get("")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.healthcare_researcher, UserRole.system_administrator)
def list_treatments():
    user_id = int(get_jwt_identity())
    current_user = db.session.get(User, user_id)
    if not current_user:
        raise APIError("User not found", 404)
    return jsonify(build_treatment_overview(current_user))


@bp.post("")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def create_treatment():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)

    patient = _resolve_patient(payload.get("patient_id"))
    
    user_id = int(get_jwt_identity())
    current_user = db.session.get(User, user_id)
    if not current_user:
        raise APIError("User not found", 404)

    if current_user.role == UserRole.doctor and patient.assigned_doctor_id != current_user.id:
        raise APIError("You are not authorized to create treatments for this patient.", 403)

    treatment_type = payload.get("treatment_type")
    
    status_val = str(payload.get("status", "active")).strip().lower()
    if status_val not in ("active", "completed"):
        raise APIError("status must be 'active' or 'completed'", 400)

    from ..services.forecast_service import generate_treatment_forecast
    forecast = generate_treatment_forecast(patient.id)

    record = TreatmentEffectiveness(
        patient_id=patient.id,
        treatment_name=str(payload.get("treatment_name", "")).strip() or "Unknown Treatment",
        treatment_type=str(treatment_type).strip() or None if treatment_type is not None else None,
        start_date=_parse_date(payload.get("start_date"), "start_date"),
        end_date=_parse_date(payload.get("end_date"), "end_date") if payload.get("end_date") else None,
        outcome_score=float(payload.get("outcome_score")) if payload.get("outcome_score") is not None and payload.get("outcome_score") != "" else None,
        effectiveness_level=_parse_level(payload.get("effectiveness_level")) if payload.get("effectiveness_level") is not None and payload.get("effectiveness_level") != "" else None,
        notes=payload.get("notes") or payload.get("treatment_notes"),
        status=status_val,
        source=str(payload.get("source", "manual")).strip(),
        predicted_treatment_effectiveness=forecast.get("predicted_treatment_effectiveness"),
        predicted_recovery_days=forecast.get("predicted_recovery_days"),
        expected_response_category=forecast.get("expected_response_category"),
        treatment_confidence=forecast.get("treatment_confidence"),
        forecast_generated_at=forecast.get("forecast_generated_at"),
    )

    if record.status == "completed":
        if record.end_date is None:
            raise APIError("end_date is required to complete treatment", 400)
        if record.outcome_score is None:
            raise APIError("outcome_score is required to complete treatment", 400)
        if record.effectiveness_level is None:
            raise APIError("effectiveness_level is required to complete treatment", 400)
        if record.end_date < record.start_date:
            raise APIError("end_date must be greater than or equal to start_date", 400)

    db.session.add(record)
    db.session.flush()
    from ..services.notification_service import broadcast_notification
    if record.status == "completed":
        broadcast_notification(
            title="✅ Treatment Completed",
            message=f"Treatment '{record.treatment_name}' completed for patient {patient.first_name} {patient.last_name}.",
            notification_type="TREATMENT_COMPLETED",
            related_entity="TreatmentEffectiveness",
            related_entity_id=record.id
        )
    else:
        broadcast_notification(
            title="🩺 Treatment Initiated",
            message=f"Treatment '{record.treatment_name}' initiated for patient {patient.first_name} {patient.last_name}.",
            notification_type="TREATMENT_INITIATED",
            related_entity="TreatmentEffectiveness",
            related_entity_id=record.id
        )
    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIError("Unable to save treatment effectiveness record", 409) from exc

    from ..services.user_service import log_user_activity
    log_user_activity(
        action="create_treatment",
        target_type="TreatmentEffectiveness",
        target_id=record.id,
        metadata={
            "patient_id": record.patient_id,
            "patient_name": f"{patient.first_name} {patient.last_name}".strip(),
            "treatment_name": record.treatment_name,
        },
    )

    return _json_response({"treatment": _serialize(record)}, 201)


@bp.route("/<treatment_id>", methods=["PATCH", "PUT"])
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def update_treatment(treatment_id: str):
    record = _resolve_record(treatment_id)
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)

    user_id = int(get_jwt_identity())
    current_user = db.session.get(User, user_id)
    if not current_user:
        raise APIError("User not found", 404)

    if current_user.role == UserRole.doctor and record.patient.assigned_doctor_id != current_user.id:
        raise APIError("You are not authorized to update this patient's treatment record.", 403)

    current_status = record.status
    target_status = payload.get("status", current_status)
    if current_status == "completed" and target_status == "active":
        raise APIError("Completed treatments cannot return to Active status", 400)

    if "status" in payload:
        status_val = str(payload.get("status")).strip().lower()
        if status_val not in ("active", "completed"):
            raise APIError("status must be 'active' or 'completed'", 400)
        record.status = status_val

    if "patient_id" in payload:
        patient = _resolve_patient(payload.get("patient_id"))
        record.patient_id = patient.id
    if "treatment_name" in payload:
        record.treatment_name = str(payload.get("treatment_name", "")).strip() or record.treatment_name
    if "treatment_type" in payload:
        treatment_type = payload.get("treatment_type")
        record.treatment_type = str(treatment_type).strip() or None if treatment_type is not None else None
    if "start_date" in payload:
        record.start_date = _parse_date(payload.get("start_date"), "start_date")
    if "end_date" in payload:
        record.end_date = _parse_date(payload.get("end_date"), "end_date") if payload.get("end_date") else None
    if "outcome_score" in payload:
        val = payload.get("outcome_score")
        if val is not None and val != "":
            try:
                record.outcome_score = float(val)
            except ValueError as exc:
                raise APIError("outcome_score must be a number", 400) from exc
        else:
            record.outcome_score = None
    if "effectiveness_level" in payload:
        val = payload.get("effectiveness_level")
        if val is not None and val != "":
            record.effectiveness_level = _parse_level(val)
        else:
            record.effectiveness_level = None
    if "notes" in payload:
        record.notes = payload.get("notes")
    if "treatment_notes" in payload:
        record.notes = payload.get("treatment_notes")

    if record.status == "completed":
        if record.end_date is None:
            raise APIError("end_date is required to complete treatment", 400)
        if record.outcome_score is None:
            raise APIError("outcome_score is required to complete treatment", 400)
        if record.effectiveness_level is None:
            raise APIError("effectiveness_level is required to complete treatment", 400)
        if record.end_date < record.start_date:
            raise APIError("end_date must be greater than or equal to start_date", 400)

    if current_status != "completed" and record.status == "completed":
        from ..services.notification_service import broadcast_notification
        broadcast_notification(
            title="✅ Treatment Completed",
            message=f"Treatment '{record.treatment_name}' completed for patient {record.patient.first_name} {record.patient.last_name}.",
            notification_type="TREATMENT_COMPLETED",
            related_entity="TreatmentEffectiveness",
            related_entity_id=record.id
        )

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIError("Unable to update treatment effectiveness record", 409) from exc

    from ..services.user_service import log_user_activity
    log_user_activity(
        action="update_treatment",
        target_type="TreatmentEffectiveness",
        target_id=record.id,
        metadata={
            "patient_id": record.patient_id,
            "patient_name": f"{record.patient.first_name} {record.patient.last_name}".strip(),
            "treatment_name": record.treatment_name,
            "status": record.status,
        },
    )

    return _json_response({"treatment": _serialize(record)})
