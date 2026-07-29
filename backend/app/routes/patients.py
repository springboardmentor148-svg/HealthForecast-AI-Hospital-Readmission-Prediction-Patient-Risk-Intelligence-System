from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..errors import APIError
from ..services.patient_service import (
    create_patient,
    delete_patient,
    get_patient,
    list_patients,
    serialize_patient,
    update_patient,
)
from ..models import UserRole
from ..utils.access_control import require_roles
from ..services.prediction_service import list_predictions_for_patient

bp = Blueprint("patients", __name__)


def _json_response(payload: dict, status_code: int = 200):
    return jsonify(payload), status_code


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "module": "patients"})


@bp.get("")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.healthcare_researcher, UserRole.system_administrator)
def get_patients():
    return _json_response(list_patients(request.args))


@bp.get("/<patient_id>")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.healthcare_researcher, UserRole.system_administrator)
def get_patient_by_id(patient_id: str):
    patient = _resolve_patient(patient_id)
    return _json_response({"patient": serialize_patient(patient)})


@bp.get("/<patient_id>/predictions")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.healthcare_researcher, UserRole.system_administrator)
def get_patient_predictions(patient_id: str):
    _resolve_patient(patient_id)
    return _json_response(list_predictions_for_patient(int(patient_id), request.args))


@bp.post("")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def create_patient_route():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)

    patient = create_patient(payload)
    return _json_response({"patient": serialize_patient(patient)}, 201)


@bp.route("/<patient_id>", methods=["PUT", "PATCH"])
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def update_patient_route(patient_id: str):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)

    patient = _resolve_patient(patient_id)
    updated = update_patient(patient, payload)
    return _json_response({"patient": serialize_patient(updated)})


@bp.delete("/<patient_id>")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def delete_patient_route(patient_id: str):
    patient = _resolve_patient(patient_id)
    delete_patient(patient)
    return "", 204


@bp.post("/import/validate")
@jwt_required()
@require_roles(UserRole.system_administrator)
def validate_import_route():
    from ..services.patient_importer import PatientCSVImporter

    if "file" not in request.files:
        raise APIError("No file part in the request", 400)
    file = request.files["file"]
    if file.filename == "":
        raise APIError("No file selected for validation", 400)
    if not file.filename.lower().endswith(".csv"):
        raise APIError("Only CSV files are allowed", 400)

    importer = PatientCSVImporter()
    res = importer.validate_csv(file.stream)
    return jsonify(res)


@bp.post("/import")
@jwt_required()
@require_roles(UserRole.system_administrator)
def import_patients_route():
    from ..services.patient_importer import PatientCSVImporter

    if "file" not in request.files:
        raise APIError("No file part in the request", 400)
    file = request.files["file"]
    if file.filename == "":
        raise APIError("No file selected for importing", 400)
    if not file.filename.lower().endswith(".csv"):
        raise APIError("Only CSV files are allowed", 400)

    importer = PatientCSVImporter()
    res = importer.import_csv(file.stream)
    return jsonify(res)


def _resolve_patient(patient_id: str):
    try:
        numeric_id = int(patient_id)
    except (TypeError, ValueError) as exc:
        raise APIError("Patient not found", 404) from exc

    patient = get_patient(numeric_id)
    if patient is None:
        raise APIError("Patient not found", 404)
    return patient
