from __future__ import annotations

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required


from ..extensions import db
from ..models import User, UserRole
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
    identity = get_jwt_identity()
    current_user = db.session.get(User, int(identity)) if identity else None
    return jsonify(build_analytics_overview(current_user))

