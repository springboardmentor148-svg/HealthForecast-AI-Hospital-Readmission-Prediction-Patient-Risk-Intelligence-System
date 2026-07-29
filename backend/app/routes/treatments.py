from __future__ import annotations

from datetime import date, datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import IntegrityError

from ..errors import APIError
from ..extensions import db
from ..models import Patient, TreatmentEffectiveness, TreatmentEffectivenessLevel, UserRole
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
    if not isinstance(value, str):
        raise APIError("effectiveness_level is required", 400)
    try:
        return TreatmentEffectivenessLevel(value.strip().lower())
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
        "outcome_score": float(record.outcome_score),
        "effectiveness_level": record.effectiveness_level.value if record.effectiveness_level else None,
        "notes": record.notes,
    }


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "module": "treatments"})


@bp.get("")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.healthcare_researcher, UserRole.system_administrator)
def list_treatments():
    return jsonify(build_treatment_overview())


@bp.post("")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def create_treatment():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)

    patient = _resolve_patient(payload.get("patient_id"))
    treatment_type = payload.get("treatment_type")
    record = TreatmentEffectiveness(
        patient_id=patient.id,
        treatment_name=str(payload.get("treatment_name", "")).strip() or "Unknown Treatment",
        treatment_type=str(treatment_type).strip() or None if treatment_type is not None else None,
        start_date=_parse_date(payload.get("start_date"), "start_date"),
        end_date=_parse_date(payload.get("end_date"), "end_date") if payload.get("end_date") else None,
        outcome_score=float(payload.get("outcome_score", 0)),
        effectiveness_level=_parse_level(payload.get("effectiveness_level")),
        notes=payload.get("notes"),
    )
    db.session.add(record)
    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIError("Unable to save treatment effectiveness record", 409) from exc
    return _json_response({"treatment": _serialize(record)}, 201)


@bp.route("/<treatment_id>", methods=["PATCH", "PUT"])
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def update_treatment(treatment_id: str):
    record = _resolve_record(treatment_id)
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)

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
        record.outcome_score = float(payload.get("outcome_score"))
    if "effectiveness_level" in payload:
        record.effectiveness_level = _parse_level(payload.get("effectiveness_level"))
    if "notes" in payload:
        record.notes = payload.get("notes")

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIError("Unable to update treatment effectiveness record", 409) from exc
    return _json_response({"treatment": _serialize(record)})
