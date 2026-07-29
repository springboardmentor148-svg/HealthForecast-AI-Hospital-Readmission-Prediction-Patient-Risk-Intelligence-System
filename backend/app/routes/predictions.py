from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..errors import APIError
from ..models import UserRole
from ..services.prediction_service import (
    fetch_prediction,
    list_prediction_history,
    run_prediction,
    serialize_prediction_detail,
)
from ..utils.access_control import require_roles

bp = Blueprint("predictions", __name__)


def _json_response(payload: dict, status_code: int = 200):
    return jsonify(payload), status_code


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "module": "predictions"})


@bp.get("")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def get_predictions():
    return _json_response(list_prediction_history(request.args))


@bp.get("/<prediction_id>")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def get_prediction(prediction_id: str):
    prediction = _resolve_prediction(prediction_id)
    return _json_response({"prediction": serialize_prediction_detail(prediction)})


@bp.post("/run")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def create_prediction():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)

    identity = get_jwt_identity()
    created_by_id = None
    try:
        created_by_id = int(identity) if identity is not None else None
    except (TypeError, ValueError):
        created_by_id = None

    result = run_prediction(payload, created_by_id=created_by_id)
    return _json_response(result, 201)


def _resolve_prediction(prediction_id: str):
    try:
        numeric_id = int(prediction_id)
    except (TypeError, ValueError) as exc:
        raise APIError("Prediction not found", 404) from exc

    prediction = fetch_prediction(numeric_id)
    if prediction is None:
        raise APIError("Prediction not found", 404)
    return prediction
