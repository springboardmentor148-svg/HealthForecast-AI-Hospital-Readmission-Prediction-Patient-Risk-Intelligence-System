from __future__ import annotations

from typing import Any

from sqlalchemy.exc import IntegrityError

from ..errors import APIError
from ..extensions import db
from ..models import User, UserRole
from .auth_service import normalize_optional_text


def _display_role(role: UserRole | None) -> str | None:
    return role.value if role else None


def _status_for_user(user: User) -> str:
    if not user.is_active:
        return "inactive"
    if user.last_login_at is None:
        return "pending"
    return "active"


def serialize_user_detail(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "username": user.username,
        "role": _display_role(user.role),
        "department": user.department,
        "phone": user.phone,
        "status": _status_for_user(user),
        "is_active": user.is_active,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "initials": "".join(part[:1].upper() for part in user.full_name.split()[:2]) or "U",
    }


def list_users() -> list[dict[str, Any]]:
    users = User.query.order_by(User.id.asc()).all()
    return [serialize_user_detail(user) for user in users]


def get_user(user_id: int) -> User | None:
    return db.session.get(User, user_id)


def update_user(user: User, payload: dict[str, Any]) -> User:
    if "full_name" in payload:
        full_name = payload.get("full_name")
        if not isinstance(full_name, str) or not full_name.strip():
            raise APIError("full_name is required", 400)
        user.full_name = full_name.strip()

    if "email" in payload:
        email = payload.get("email")
        if not isinstance(email, str) or not email.strip():
            raise APIError("email is required", 400)
        user.email = email.strip().lower()

    if "role" in payload:
        role = payload.get("role")
        if not isinstance(role, str):
            raise APIError("role is required", 400)
        try:
            user.role = UserRole(role.strip().lower())
        except ValueError as exc:
            raise APIError("Invalid role", 400) from exc

    if "department" in payload:
        user.department = normalize_optional_text(payload.get("department"))

    if "phone" in payload:
        user.phone = normalize_optional_text(payload.get("phone"))

    if "is_active" in payload:
        user.is_active = bool(payload.get("is_active"))

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIError("Unable to update user", 409) from exc
    return user


def update_profile(user: User, payload: dict[str, Any]) -> User:
    allowed = {key: payload[key] for key in ("full_name", "department", "phone") if key in payload}
    return update_user(user, allowed)


def create_user(payload: dict[str, Any]) -> User:
    from .auth_service import register_user

    return register_user(payload)
