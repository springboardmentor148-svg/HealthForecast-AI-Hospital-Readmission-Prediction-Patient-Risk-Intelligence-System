from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..errors import APIError
from ..extensions import db
from ..models import User
from ..services.auth_service import (
    authenticate_user,
    build_login_response,
    register_user,
    serialize_user,
)

bp = Blueprint("auth", __name__)


def _json_response(payload: dict, status_code: int = 200):
    return jsonify(payload), status_code


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "module": "auth"})


@bp.post("/register")
def register():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)

    user = register_user(payload)
    return _json_response({"user": serialize_user(user)}, 201)


@bp.post("/login")
def login():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)

    user = authenticate_user(payload.get("email"), payload.get("password"))
    return _json_response(build_login_response(user))


@bp.get("/me")
@jwt_required()
def me():
    identity = get_jwt_identity()
    user = db_user_lookup(identity)
    if user is None:
        raise APIError("User not found", 404)
    return _json_response({"user": serialize_user(user)})


@bp.post("/logout")
@jwt_required()
def logout():
    return _json_response({"message": "Logged out successfully"})


def db_user_lookup(user_id: int | str | None) -> User | None:
    if user_id is None:
        return None
    try:
        numeric_user_id = int(user_id)
    except (TypeError, ValueError):
        return None
    return db.session.get(User, numeric_user_id)
