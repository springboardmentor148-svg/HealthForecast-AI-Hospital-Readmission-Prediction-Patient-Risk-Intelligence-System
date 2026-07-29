from __future__ import annotations

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from ..models import UserRole
from ..services.insights_service import build_analytics_overview, build_dashboard_summary
from ..utils.access_control import require_roles

bp = Blueprint("analytics", __name__)


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "module": "analytics"})


@bp.get("/dashboard")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.healthcare_researcher, UserRole.system_administrator)
def dashboard():
    return jsonify(build_dashboard_summary())


@bp.get("/overview")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.healthcare_researcher, UserRole.system_administrator)
def overview():
    return jsonify(build_analytics_overview())
