from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..errors import APIError
from ..extensions import db
from ..models import UserRole
from ..services.auth_service import serialize_user
from ..services.user_service import create_user, get_user, list_users, serialize_user_detail, update_profile, update_user
from ..utils.access_control import require_roles

bp = Blueprint("users", __name__)


def _json_response(payload: dict, status_code: int = 200):
    return jsonify(payload), status_code


def _resolve_user(user_id: str):
    try:
        numeric_id = int(user_id)
    except (TypeError, ValueError) as exc:
        raise APIError("User not found", 404) from exc

    user = get_user(numeric_id)
    if user is None:
        raise APIError("User not found", 404)
    return user


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "module": "users"})


@bp.get("")
@jwt_required()
@require_roles(UserRole.system_administrator)
def users_index():
    return _json_response({"users": list_users()})


@bp.post("")
@jwt_required()
@require_roles(UserRole.system_administrator)
def users_create():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)
    user = create_user(payload)
    return _json_response({"user": serialize_user_detail(user)}, 201)


@bp.get("/me")
@jwt_required()
def me():
    identity = get_jwt_identity()
    user = _resolve_user(identity)
    return _json_response({"user": serialize_user_detail(user)})


@bp.route("/me", methods=["PATCH", "PUT"])
@jwt_required()
def update_me():
    identity = get_jwt_identity()
    user = _resolve_user(identity)
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)
    update_profile(user, payload)
    return _json_response({"user": serialize_user_detail(user)})


@bp.route("/<user_id>", methods=["GET", "PATCH", "PUT"])
@jwt_required()
@require_roles(UserRole.system_administrator)
def user_detail(user_id: str):
    user = _resolve_user(user_id)
    if request.method == "GET":
        return _json_response({"user": serialize_user_detail(user)})

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)
    update_user(user, payload)
    return _json_response({"user": serialize_user_detail(user)})
