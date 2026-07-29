from __future__ import annotations

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from ..errors import APIError
from ..extensions import db
from ..models import Patient, UserRole
from ..services.insights_service import build_clinical_support
from ..utils.access_control import require_roles

bp = Blueprint("clinical_support", __name__)


def _resolve_patient(patient_id: str) -> Patient:
    try:
        numeric_id = int(patient_id)
    except (TypeError, ValueError) as exc:
        raise APIError("Patient not found", 404) from exc
    patient = db.session.get(Patient, numeric_id)
    if patient is None:
        raise APIError("Patient not found", 404)
    return patient


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "module": "clinical_support"})


@bp.get("/<patient_id>")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def support_for_patient(patient_id: str):
    patient = _resolve_patient(patient_id)
    return jsonify(build_clinical_support(patient))
