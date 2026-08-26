from __future__ import annotations

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from ..models import UserRole
from ..services.insights_service import build_model_summary
from ..services.prediction_service import get_unique_model_versions
from ..utils.access_control import require_roles

bp = Blueprint("models", __name__)


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "module": "models"})


@bp.get("/summary")
def summary():
    return jsonify(build_model_summary())


@bp.get("/versions")
@jwt_required()
@require_roles(
    UserRole.doctor,
    UserRole.hospital_administrator,
    UserRole.healthcare_researcher,
    UserRole.system_administrator,
)
def get_versions():
    return jsonify({"versions": get_unique_model_versions()})

