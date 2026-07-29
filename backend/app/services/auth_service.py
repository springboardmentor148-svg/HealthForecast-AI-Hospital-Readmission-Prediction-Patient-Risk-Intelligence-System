from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any

from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from ..errors import APIError
from ..extensions import db
from ..models import User, UserRole


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
USERNAME_RE = re.compile(r"[^a-z0-9]+")


def normalize_email(email: Any) -> str:
    if not isinstance(email, str):
        raise APIError("Email is required", 400)
    return email.strip().lower()


def normalize_optional_text(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise APIError("Input values must be strings where applicable", 400)
    cleaned = value.strip()
    return cleaned or None


def validate_email(email: str) -> str:
    normalized = normalize_email(email)
    if not EMAIL_RE.match(normalized):
        raise APIError("A valid email address is required", 400)
    return normalized


def validate_password(password: Any) -> str:
    if not isinstance(password, str):
        raise APIError("Password is required", 400)
    cleaned = password.strip()
    if len(cleaned) < 8:
        raise APIError("Password must be at least 8 characters long", 400)
    return password


def validate_required_text(field_name: str, value: Any) -> str:
    if not isinstance(value, str):
        raise APIError(f"{field_name} is required", 400)
    cleaned = value.strip()
    if not cleaned:
        raise APIError(f"{field_name} is required", 400)
    return cleaned


def validate_role(role: Any) -> UserRole:
    if not isinstance(role, str):
        raise APIError("role is required", 400)
    cleaned = role.strip().lower()
    try:
        return UserRole(cleaned)
    except ValueError as exc:
        raise APIError("Invalid role", 400) from exc


def generate_username(email: str, full_name: str) -> str:
    email_prefix = email.split("@", 1)[0]
    base = USERNAME_RE.sub(".", email_prefix.lower()).strip(".")
    if len(base) < 3:
        base = USERNAME_RE.sub(".", full_name.lower()).strip(".")
    if len(base) < 3:
        base = "user"

    candidate = base
    suffix = 1
    while User.query.filter_by(username=candidate).first() is not None:
        suffix += 1
        candidate = f"{base}-{suffix}"
    return candidate


def serialize_user(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role.value if user.role else None,
        "department": user.department,
        "phone": user.phone,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
    }


def register_user(payload: dict[str, Any]) -> User:
    full_name = validate_required_text("full_name", payload.get("full_name"))
    email = validate_email(payload.get("email"))
    password = validate_password(payload.get("password"))
    role = validate_role(payload.get("role"))
    department = validate_required_text("department", payload.get("department"))
    phone = normalize_optional_text(payload.get("phone"))

    if User.query.filter_by(email=email).first() is not None:
        raise APIError("Email is already registered", 409)

    username = generate_username(email, full_name)
    user = User(
        username=username,
        email=email,
        full_name=full_name,
        password_hash=generate_password_hash(password),
        role=role,
        department=department,
        phone=phone,
        last_login_at=None,
    )
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIError("Email is already registered", 409) from exc
    return user


def authenticate_user(email: Any, password: Any) -> User:
    if not isinstance(email, str) or not email.strip():
        raise APIError("Invalid email or password", 401)
    if not isinstance(password, str) or not password:
        raise APIError("Invalid email or password", 401)

    normalized_email = email.strip().lower()
    if not EMAIL_RE.match(normalized_email):
        raise APIError("Invalid email or password", 401)

    user = User.query.filter_by(email=normalized_email).first()
    if user is None or not check_password_hash(user.password_hash, password):
        raise APIError("Invalid email or password", 401)

    user.last_login_at = datetime.now(UTC)
    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIError("Unable to update login timestamp", 500) from exc
    return user


def build_login_response(user: User) -> dict[str, Any]:
    access_token = create_access_token(identity=str(user.id))
    return {"access_token": access_token, "user": serialize_user(user)}
